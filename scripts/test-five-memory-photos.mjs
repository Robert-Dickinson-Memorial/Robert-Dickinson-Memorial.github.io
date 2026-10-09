import { readFile } from 'node:fs/promises';
import { stripTypeScriptTypes } from 'node:module';
import { DatabaseSync } from 'node:sqlite';
import assert from 'node:assert/strict';
const db = new DatabaseSync(':memory:');
const fields = ['name','relationship','email','title','story','photo_key','photo_name','photo2_key','photo2_name','photo3_key','photo3_name','pdf_key','pdf_name','video_key','video_name','social_url','status','consent','created_at','preview_token_hash'];
db.exec(`CREATE TABLE memories (id INTEGER PRIMARY KEY, ${fields.map(f=>f+' TEXT').join(',')})`);
db.exec(await readFile('drizzle/0020_five_memory_photos.sql','utf8'));
const stored = new Map();
globalThis.__photoEnv = { DB: {prepare(sql) {const stmt=db.prepare(sql);return {bind(...args){return {async run(){const r=stmt.run(...args);return {meta:{changes:Number(r.changes),last_row_id:Number(r.lastInsertRowid)}}},async first(){return stmt.get(...args)},async all(){return {results:stmt.all(...args)}}}}}}}, BUCKET:{async put(key,stream){stored.set(key,await new Response(stream).arrayBuffer())}, async delete(key){stored.delete(key)},async get(key){return stored.has(key)?{body:stored.get(key),writeHttpMetadata(){},httpEtag:'test'}:null}}};
async function load(path,extra='') {let code=await readFile(path,'utf8');code=code.replace(/^import .*;\n/gm,'');return import('data:text/javascript;base64,'+Buffer.from(stripTypeScriptTypes('const env=globalThis.__photoEnv;\n'+extra+'\n'+code)).toString('base64'));}
const preview=await load('app/memory-preview.ts');globalThis.__pending=preview.pendingMemory;globalThis.__hash=preview.tokenHash;
const {POST}=await load('app/api/memories/route.ts','const pendingMemory=globalThis.__pending;const tokenHash=globalThis.__hash;const publicJson=(d,i)=>Response.json(d,i);const isAllowedPublicOrigin=()=>true;const sendReviewNotification=async()=>{};');
function request(n,edit) {const f=new FormData();for(const [k,v] of Object.entries({name:'Test Person',relationship:'Colleague',title:'Five photos',story:'A test memory with enough written text.',consent:'on',...(edit?{editId:String(edit.id),editToken:edit.editToken}:{})}))f.set(k,v);for(let i=0;i<n;i++)f.append('photo',new File([new Uint8Array([255,216,255,i])],`photo-${i}.jpg`,{type:'image/jpeg'}));return new Request('https://example.com/api/memories',{method:'POST',body:f});}
let res=await POST(request(5));assert.equal(res.status,201);const edit=await res.json();assert.equal(stored.size,5);let row=db.prepare('SELECT * FROM memories').get();assert(row.photo4_key&&row.photo5_key);const old=row.photo5_key;
res=await POST(request(6));assert.equal(res.status,400);assert.equal(stored.size,5);
res=await POST(request(0,edit));assert.equal(res.status,200);assert.equal(db.prepare('SELECT photo5_key FROM memories').get().photo5_key,old);
const {GET}=await load('app/api/photos/[...key]/route.ts','const publicMediaResponse=(b,i)=>new Response(b,i);');const ctx={params:Promise.resolve({key:old.split('/')})};assert.equal((await GET(new Request('https://example.com'),ctx)).status,404);db.exec("UPDATE memories SET status='approved'");assert.equal((await GET(new Request('https://example.com'),ctx)).status,200);db.exec("UPDATE memories SET status='pending'");
res=await POST(request(2,edit));assert.equal(res.status,200);row=db.prepare('SELECT * FROM memories').get();assert.equal(row.photo4_key,null);assert.equal(row.photo5_key,null);assert.equal(stored.size,2);
console.log('PASS: five-photo persistence; sixth rejected; text edit preserves photos; extra photos private until approval; replacement clears old slots and storage.');
