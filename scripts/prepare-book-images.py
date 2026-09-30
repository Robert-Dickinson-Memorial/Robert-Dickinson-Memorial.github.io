#!/usr/bin/env python3
"""Create print-sized derivatives and embed a CJK font without changing uploads."""
from pathlib import Path
from PIL import Image, ImageOps
from fontTools import subset
import hashlib,json,os,sys,shutil
root=Path(sys.argv[1]);dest=root/'memory-book';(dest/'print-media').mkdir(parents=True,exist_ok=True);(dest/'fonts').mkdir(exist_ok=True)
manifest=json.loads((root/'mirror/manifest.json').read_text())['media'];mapping={}
for source in set(manifest.values()):
 path=root/source.lstrip('/')
 if path.suffix.lower() not in {'.jpg','.jpeg','.png','.webp'}:continue
 with Image.open(path) as original:
  image=ImageOps.exif_transpose(original).convert('RGB');image.thumbnail((2100,2100),Image.Resampling.LANCZOS)
  name=hashlib.sha256(source.encode()).hexdigest()[:24]+'.jpg';out=dest/'print-media'/name
  image.save(out,'JPEG',quality=90,optimize=True,dpi=(300,300))
  mapping[source]='/memory-book/print-media/'+name
(dest/'print-images.json').write_text(json.dumps(mapping))
font=Path(os.environ['MEMORIAL_BOOK_CJK_FONT']);options=subset.Options();options.layout_features=['*'];f=subset.load_font(str(font),options)
text=''.join(json.dumps(json.loads(p.read_text()),ensure_ascii=False) for p in (root/'mirror/api').glob('*.json'))
s=subset.Subsetter(options=options);s.populate(text=text);s.subset(f);subset.save_font(f,str(dest/'fonts/noto-serif-cjk.otf'),options)
if os.environ.get('MEMORIAL_BOOK_CJK_LICENSE'):shutil.copy(os.environ['MEMORIAL_BOOK_CJK_LICENSE'],dest/'fonts/LICENSE.txt')
print('Prepared',len(mapping),'print images and embedded CJK font')
