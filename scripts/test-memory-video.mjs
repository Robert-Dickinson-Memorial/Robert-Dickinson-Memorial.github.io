import { readFile } from 'node:fs/promises';
import { stripTypeScriptTypes } from 'node:module';
import assert from 'node:assert/strict';
let stored = new Map(), inserted, approved = false;
globalThis.__videoTestEnv = {
 DB: { prepare(sql) { return { bind(...args) { return { async run() { inserted = {sql,args}; return {meta:{changes:1}}; }, async first() { return approved ? {id:1} : null; } }; } }; } },
 BUCKET: {
  async put(key, stream, options) { stored.set(key, {bytes: new Uint8Array(await new Response(stream).arrayBuffer()), options}); },
  async delete(key) { stored.delete(key); },
  async head(key) { const o=stored.get(key); return o && {size:o.bytes.length,httpEtag:'"test"',httpMetadata:o.options.httpMetadata}; },
  async get(key, {range}) { const o=stored.get(key); return o && {body:o.bytes.slice(range.offset,range.offset+range.length)}; }
 }
};
async function load(path, extra='') {
 let code=await readFile(new URL('../'+path,import.meta.url),'utf8');
 code=code.replace(/^import .*;\n/gm,'');
 return import('data:text/javascript;base64,'+Buffer.from(stripTypeScriptTypes('const env=globalThis.__videoTestEnv;\n'+extra+'\n'+code)).toString('base64'));
}
const cors='const publicJson=(data,init)=>Response.json(data,init); const publicOptions=()=>new Response(null,{status:204}); const isAllowedPublicOrigin=()=>true; const sendReviewNotification=async()=>{};';
const {POST}=await load('app/api/memories/route.ts',cors);
const mp4=new Uint8Array([0,0,0,20,102,116,121,112,109,112,52,50,0,0,0,0,0,0,0,0]);
function request(bytes=mp4,filename='slides.mp4') { const f=new FormData(); for(const [k,v] of Object.entries({name:'Test Person',relationship:'Colleague',title:'Presentation',consent:'on'})) f.set(k,v); f.set('video',new File([bytes],filename,{type:'video/mp4'})); return new Request('https://example.com/api/memories',{method:'POST',body:f}); }
assert.equal((await POST(request())).status,201);
assert.equal(inserted.args[4],''); // Video alone is valid story content.
assert.equal(inserted.args[12],'pending');
const key=inserted.args[9]; assert(stored.has(key));
assert.equal((await POST(request(new Uint8Array([1,2,3])))).status,400);
assert.equal((await POST(request(mp4,'malicious.html'))).status,400);
assert.equal((await POST(request(new Uint8Array(50*1024*1024+1)))).status,400);
assert.equal((await POST(new Request('https://example.com',{method:'POST',headers:{'content-type':'multipart/form-data; boundary=a','content-length':String(81*1024*1024)},body:'a'}))).status,413);
const {videoResponse}=await load('app/video-response.ts'); globalThis.__videoResponse=videoResponse;
for(const [range,status,length,contentRange] of [[null,200,20,null],['bytes=4-7',206,4,'bytes 4-7/20'],['bytes=10-',206,10,'bytes 10-19/20'],['bytes=-4',206,4,'bytes 16-19/20'],['bytes=99-',416,0,'bytes */20'],['bytes=0-1,4-5',416,0,'bytes */20']]) {
 const res=await videoResponse(new Request('https://example.com',{headers:range?{range}:{}}),key);
 assert.equal(res.status,status); assert.equal((await res.arrayBuffer()).byteLength,length); assert.equal(res.headers.get('content-range'),contentRange);
}
const {GET}=await load('app/api/memory-videos/[...key]/route.ts','const videoResponse=globalThis.__videoResponse; const publicOptions=()=>{}; const publicMediaResponse=(b,i)=>new Response(b,i);');
const context={params:Promise.resolve({key:key.split('/')})};
assert.equal((await GET(new Request('https://example.com'),context)).status,404);
approved=true;
assert.equal((await GET(new Request('https://example.com'),context)).status,200);
const privateResponse=await videoResponse(new Request('https://example.com'),key,true);
assert.equal(privateResponse.headers.get('cache-control'),'private, no-store');
console.log('PASS: video-only submission, validation, limits, pending privacy, playback ranges, private caching');
