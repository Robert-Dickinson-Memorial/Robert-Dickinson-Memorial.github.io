"""Fill missing story/photo fields from approved attachments, keeping private rollback records.
Run through the named GitHub workflow, which uses existing deployment credentials.
"""
import json
import os
import re
import subprocess
import tempfile
import urllib.request
import uuid
from pathlib import Path

import pymupdf
from PIL import Image

PLACEHOLDERS = {'see the attached audio/pdf file for detail', 'see attached', 'see attached pdf', 'please see attached', 'see attached file'}

def needs_story(story):
    return not story.strip() or story.strip().lower().rstrip('.') in PLACEHOLDERS

def extract_pdf(path, image_path):
    paragraphs = []
    found_image = False
    with pymupdf.open(path) as doc:
        if doc.needs_pass or len(doc) > 100:
            raise ValueError('PDF requires manual extraction')
        for page in doc:
            blocks = page.get_text('blocks', sort=True)
            for block in blocks:
                if block[6] == 0:
                    text = re.sub(r'[ \t]+', ' ', block[4]).strip()
                    # Rejoin PDF line wrapping while retaining paragraph boundaries.
                    text = re.sub(r'(?<=\w)-\n(?=[a-z])', '', text)
                    text = re.sub(r'\s*\n\s*', ' ', text)
                    if text and not re.fullmatch(r'\d+', text):
                        paragraphs.append(text)
            if not found_image:
                # Images in visual reading order, excluding tiny icons and masks.
                images = sorted(page.get_image_info(xrefs=True), key=lambda b: (b['bbox'][1], b['bbox'][0]))
                for info in images:
                    if min(info['width'], info['height']) < 100 or not info['xref']:
                        continue
                    pix = pymupdf.Pixmap(doc, info['xref'])
                    if pix.colorspace is None:
                        continue
                    if pix.colorspace.n != 3:
                        pix = pymupdf.Pixmap(pymupdf.csRGB, pix)
                    raw = image_path.with_suffix('.png')
                    pix.save(raw)
                    with Image.open(raw) as im:
                        im = im.convert('RGB'); im.thumbnail((1600, 1600))
                        im.save(image_path, 'JPEG', quality=88)
                    found_image = True
                    break
        text = '\n\n'.join(paragraphs)
        if len(text) > 60000:
            raise ValueError('PDF text exceeds 60,000 characters; manual review required')
        if not found_image and len(doc):
            # A first-page preview is preferable to inventing an image when none is embedded.
            page = doc[0]
            pix = page.get_pixmap(matrix=pymupdf.Matrix(1.5,1.5), alpha=False)
            pix.save(image_path)
    return text


def query(sql, params=()):
    endpoint = f"https://api.cloudflare.com/client/v4/accounts/{os.environ['CLOUDFLARE_ACCOUNT_ID']}/d1/database/{os.environ['CLOUDFLARE_D1_DATABASE_ID']}/query"
    req = urllib.request.Request(endpoint, data=json.dumps({'sql':sql,'params':list(params)}).encode(), headers={'Authorization':'Bearer '+os.environ['CLOUDFLARE_API_TOKEN'], 'Content-Type':'application/json'})
    with urllib.request.urlopen(req, timeout=60) as response:
        result = json.load(response)
    if not result.get('success') or any(not r.get('success', True) for r in result.get('result',[])):
        raise RuntimeError('Database operation failed')
    return result['result'][0]


def r2(action, key, file):
    bucket = os.environ.get('CLOUDFLARE_R2_BUCKET_NAME') or 'robert-dickinson-memorial-photos'
    args = [os.environ['WRANGLER_BIN'], 'r2','object',action, f'{bucket}/{key}', '--remote', '--file',str(file)]
    if action == 'put': args += ['--content-type','image/jpeg']
    subprocess.run(args, check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE, timeout=180)


def main():
    query('''CREATE TABLE IF NOT EXISTS memory_attachment_backups (
      memory_id INTEGER PRIMARY KEY, previous_story TEXT, previous_photo_key TEXT,
      previous_photo_name TEXT, applied_story TEXT, applied_photo_key TEXT, created_at TEXT)''')
    rows = query("SELECT id, story, photo_key, photo_name, pdf_key, video_key FROM memories WHERE status = 'approved' AND (pdf_key IS NOT NULL OR video_key IS NOT NULL)")['results']
    updated = 0
    for row in rows:
        need_text = needs_story(row['story'] or '') and row['pdf_key']
        need_photo = not row['photo_key']
        if not need_text and not need_photo: continue
        with tempfile.TemporaryDirectory() as directory:
            folder = Path(directory); image = folder/'preview.jpg'; text = ''
            try:
                if row['pdf_key']:
                    pdf = folder/'source.pdf'; r2('get',row['pdf_key'],pdf)
                    text = extract_pdf(pdf,image)
                elif row['video_key'] and need_photo:
                    video = folder/'source-video'; r2('get',row['video_key'],video)
                    subprocess.run(['ffmpeg','-v','error','-i',str(video),'-frames:v','1','-vf','scale=1600:1600:force_original_aspect_ratio=decrease',str(image)], check=True, capture_output=True, timeout=120)
                new_text = text if need_text and len(text.strip()) >= 20 else row['story']
                new_key = f"extracted-memory-previews/{uuid.uuid4()}.jpg" if need_photo and image.exists() else row['photo_key']
                if new_text == row['story'] and new_key == row['photo_key']:
                    print(f"Memory {row['id']}: no extractable content; unchanged")
                    continue
                # Back up only the fields we change. No originals are removed.
                query('''INSERT OR IGNORE INTO memory_attachment_backups
                  (memory_id,previous_story,previous_photo_key,previous_photo_name,applied_story,applied_photo_key,created_at)
                  VALUES (?,?,?,?,?,?,datetime('now'))''', (row['id'],row['story'],row['photo_key'],row['photo_name'],new_text,new_key))
                if new_key != row['photo_key']: r2('put',new_key,image)
                # Avoid overwriting a concurrent editor's work or publishing a rejected item.
                result = query('''UPDATE memories SET story=?, photo_key=?, photo_name=?
                  WHERE id=? AND status='approved' AND story IS ? AND photo_key IS ? AND pdf_key IS ? AND video_key IS ?''',
                  (new_text,new_key,'Attachment preview' if new_key != row['photo_key'] else row['photo_name'],row['id'],row['story'],row['photo_key'],row['pdf_key'],row['video_key']))
                changed = result.get('meta',{}).get('changes',0)
                updated += changed
                print(f"Memory {row['id']}: {'updated' if changed else 'concurrent edit; skipped'}, extracted text {len(text)} characters, preview {image.exists()}")
            except Exception as exc:
                # Do not print credentials, attachment contents or private data into workflow logs.
                print(f"Memory {row['id']}: extraction failed ({type(exc).__name__}); originals retained")
                raise
    print(f'Completed: {updated} memories updated')

if __name__ == '__main__': main()
