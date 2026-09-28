import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { stripTypeScriptTypes } from 'node:module';

const row = { id: 9, status: 'approved', photoKey: 'old-photo', pdfKey: 'old-pdf', story: 'Curated text remains editable.' };
const objects = new Map([['old-photo', new Uint8Array([1])], ['old-pdf', new Uint8Array([2])]]);
globalThis.owner = true;
globalThis.editor = true;
globalThis.__attachmentTestEnv = {
  DB: { prepare(sql) { return { bind(...args) { return {
    async first() {
      if (sql.includes('COUNT(*)')) return { count: 0 };
      if (row.status !== 'approved' || args[0] !== row.id) return null;
      return sql.includes('photo_key AS photoKey') ? { photoKey: row.photoKey } : { pdfKey: row.pdfKey };
    },
    async run() {
      const kind = sql.includes('SET photo_key') ? 'photoKey' : 'pdfKey';
      const oldKey = args[3];
      if (row.status !== 'approved' || args[2] !== row.id || row[kind] !== oldKey) return { meta: { changes: 0 } };
      row[kind] = args[0];
      return { meta: { changes: 1 } };
    },
  }; } }; } },
  BUCKET: {
    async put(key, stream) { objects.set(key, new Uint8Array(await new Response(stream).arrayBuffer())); },
    async delete(key) { objects.delete(key); },
  },
};

async function load(path, auth) {
  let code = await readFile(new URL('../' + path, import.meta.url), 'utf8');
  code = code.replace(/^import .*;\n/gm, '');
  return import('data:text/javascript;base64,' + Buffer.from(stripTypeScriptTypes(`const env=globalThis.__attachmentTestEnv; const ${auth}=()=>globalThis.${auth === 'isOwnerRequest' ? 'owner' : 'editor'};\n` + code)).toString('base64'));
}

const photoRoute = await load('app/api/admin/memory-photo/route.ts', 'isEditorRequest');
const pdfRoute = await load('app/api/admin/memory-pdf/route.ts', 'isOwnerRequest');
function request(kind, bytes, expectedKey, name, type) {
  const body = new FormData();
  body.set('id', '9');
  body.set(kind === 'photo' ? 'expectedPhotoKey' : 'expectedPdfKey', expectedKey);
  body.set('file', new File([bytes], name, { type }));
  return new Request('https://memorial.example/api/admin/memory-' + kind, { method: 'POST', body });
}
const jpeg = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0, 0, 0, 0]);
const pdf = new TextEncoder().encode('%PDF-1.7\nNew memorial document');

let response = await photoRoute.POST(request('photo', jpeg, 'old-photo', 'yanping.jpg', 'image/jpeg'));
assert.equal(response.status, 200);
assert.match(row.photoKey, /^memory-photos\//);
assert(!objects.has('old-photo'));
assert(objects.has(row.photoKey));
assert.equal(row.story, 'Curated text remains editable.');

response = await photoRoute.POST(request('photo', jpeg, 'old-photo', 'stale.jpg', 'image/jpeg'));
assert.equal(response.status, 409);
assert(objects.has(row.photoKey));

response = await photoRoute.POST(request('photo', pdf, row.photoKey, 'wrong.jpg', 'image/jpeg'));
assert.equal(response.status, 400);

response = await pdfRoute.POST(request('pdf', pdf, 'old-pdf', 'updated.pdf', 'application/pdf'));
assert.equal(response.status, 200);
assert.match(row.pdfKey, /^memory-pdfs\//);
assert(!objects.has('old-pdf'));
assert(objects.has(row.pdfKey));
assert.equal(row.story, 'Curated text remains editable.');

response = await pdfRoute.POST(request('pdf', pdf, 'old-pdf', 'stale.pdf', 'application/pdf'));
assert.equal(response.status, 409);
response = await pdfRoute.POST(request('pdf', jpeg, row.pdfKey, 'invalid.pdf', 'application/pdf'));
assert.equal(response.status, 400);

globalThis.owner = false;
response = await pdfRoute.POST(request('pdf', pdf, row.pdfKey, 'forbidden.pdf', 'application/pdf'));
assert.equal(response.status, 403);
console.log('PASS: photo replacement, PDF replacement, stale edit protection, validation, owner access, and preserved story text');
