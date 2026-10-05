#!/usr/bin/env python3
"""Mirror approved public records and referenced files into the Pages publication."""

import concurrent.futures
import hashlib
import json
import os
import re
import subprocess
from pathlib import Path
from urllib.error import HTTPError
from urllib.parse import quote
from urllib.request import Request, urlopen


OUTPUT = Path(os.environ.get("MEMORIAL_SITE_DIR", "_site")) / "mirror"
QUERIES = {
    "site_content": "SELECT key, value FROM site_content",
    "events": """SELECT id, title, start_at AS startAt, end_at AS endAt, location, description,
                 link_label AS linkLabel, link_url AS linkUrl FROM events
                 WHERE published = 1 ORDER BY start_at ASC, id ASC""",
    "gallery": """SELECT id, kind, title, caption, object_key AS objectKey,
                  external_url AS externalUrl, created_at AS createdAt FROM gallery_items
                  WHERE published = 1 ORDER BY created_at DESC, id DESC""",
    "memories": """SELECT id, name, relationship, title, story, photo2_key AS photo2Key, photo2_name AS photo2Name, photo3_key AS photo3Key, photo3_name AS photo3Name, photo_key AS photoKey,
                   video_key AS videoKey, video_name AS videoName, pdf_key AS pdfKey,
                   social_url AS socialUrl, created_at AS createdAt FROM memories
                   WHERE status = 'approved' ORDER BY CASE
                     WHEN id = 11 THEN 0
                     WHEN lower(trim(name)) IN ('haishan chen', 'hanshan chen') THEN 1
                     WHEN lower(trim(name)) = 'david schimel' THEN 2
                     WHEN lower(trim(name)) = 'xubin zeng' THEN 3
                     WHEN lower(name) LIKE '%zong%liang%yang%' THEN 4
                     WHEN lower(trim(name)) = 'kaicun wang' THEN 5
                     ELSE 6 END,
                     created_at ASC, id ASC""",
    "tree_total": "SELECT COALESCE(SUM(reported_tree_count), 0) AS total FROM tree_dedications WHERE status = 'approved' AND contribution_type = 'tree' AND payment_confirmed = 1",
    "restoration_total": "SELECT COUNT(*) AS total FROM tree_dedications WHERE status = 'approved' AND contribution_type = 'restoration' AND payment_confirmed = 1",
}


def query(sql):
    endpoint = (f"https://api.cloudflare.com/client/v4/accounts/{os.environ['CLOUDFLARE_ACCOUNT_ID']}"
                f"/d1/database/{os.environ['CLOUDFLARE_D1_DATABASE_ID']}/query")
    request = Request(endpoint, data=json.dumps({"sql": sql}).encode(), headers={
        "Authorization": "Bearer " + os.environ["CLOUDFLARE_API_TOKEN"],
        "Content-Type": "application/json",
    })
    with urlopen(request, timeout=60) as response:
        payload = json.load(response)
    if not payload.get("success") or any(not result.get("success", True) for result in payload.get("result", [])):
        raise RuntimeError("Public snapshot database query failed")
    return payload["result"][0]["results"]


def public_keys(content, gallery, memories):
    entries = set()

    def add(route, key):
        if key:
            if not isinstance(key, str) or any(part in ("", ".", "..") for part in key.split("/")):
                raise ValueError("Invalid public media key")
            entries.add((route, key))

    for asset in content.get("siteAssets", {}).values():
        if isinstance(asset, dict):
            add("/api/site-assets", asset.get("objectKey"))
    for photo in content.get("lifePhotos", []):
        add("/api/life-photos", photo.get("objectKey"))
    for chapter in content.get("legacyChapters", []):
        add("/api/chapter-photos", (chapter.get("photo") or {}).get("objectKey"))
    for item in gallery:
        if item.get("kind") == "image":
            add("/api/gallery/photos", item.get("objectKey"))
    for memory in memories:
        for field in ("photoKey", "photo2Key", "photo3Key"):
            add("/api/photos", memory.get(field))
        add("/api/memory-videos", memory.get("videoKey"))
        add("/api/memory-files", memory.get("pdfKey"))
    return sorted(entries)


def extension(path):
    with path.open("rb") as file:
        header = file.read(16)
    if header.startswith(b"\xff\xd8\xff"):
        return ".jpg"
    if header.startswith(b"\x89PNG\r\n\x1a\n"):
        return ".png"
    if header.startswith(b"RIFF") and header[8:12] == b"WEBP":
        return ".webp"
    if header.startswith(b"%PDF-"):
        return ".pdf"
    if header[4:8] == b"ftyp":
        return ".mp4"
    if header.startswith(b"\x1a\x45\xdf\xa3"):
        return ".webm"
    raise RuntimeError("Unsupported public media format")


def copy_media(entry):
    route, key = entry
    resource = f"{route}/{'/'.join(quote(part, safe='') for part in key.split('/'))}"
    digest = hashlib.sha256(resource.encode()).hexdigest()[:24]
    temporary = OUTPUT / "media" / f"{digest}.download"
    bucket = os.environ.get("CLOUDFLARE_R2_BUCKET_NAME") or "robert-dickinson-memorial-photos"
    try:
        subprocess.run([os.environ["WRANGLER_BIN"], "r2", "object", "get", f"{bucket}/{key}",
                       "--remote", "--file", str(temporary)], check=True, capture_output=True, timeout=180)
    except subprocess.CalledProcessError as error:
        raise RuntimeError(f"Approved public media could not be copied: {route}") from error
    if not temporary.is_file() or not temporary.stat().st_size or temporary.stat().st_size > 55 * 1024 * 1024:
        raise RuntimeError(f"Invalid public media size for {route}")
    suffix = extension(temporary)
    filename = f"{digest}{suffix}"
    temporary.rename(OUTPUT / "media" / filename)
    return resource, f"/mirror/media/{filename}"


def gallery_year(item):
    for text in (item["title"], item.get("caption") or ""):
        match = re.search(r"(?:^|[^\d])((?:18|19|20|21)\d{2})(?!\d)", text)
        if match:
            return int(match.group(1))
    return None


def main():
    # A Pages build can start before the companion deployment applies migrations.
    # Keep the current public edition available during that short interval.
    columns = {column['name'] for column in query('PRAGMA table_info(memories)')}
    if 'photo2_key' not in columns:
        QUERIES['memories'] = QUERIES['memories'].replace('photo2_key AS photo2Key, photo2_name AS photo2Name, photo3_key AS photo3Key, photo3_name AS photo3Name, ', '')
    (OUTPUT / "api").mkdir(parents=True, exist_ok=True)
    (OUTPUT / "media").mkdir(parents=True, exist_ok=True)
    rows = {name: query(sql) for name, sql in QUERIES.items() if name not in ("tree_total", "restoration_total")}
    try:
        rows["tree_total"] = query(QUERIES["tree_total"])
        rows["restoration_total"] = query(QUERIES["restoration_total"])
    except (RuntimeError, HTTPError):
        # Backend migrations and Pages deploy on separate jobs. The live API
        # will supply the totals once the tree-dedication table is available.
        rows["tree_total"] = []
        rows["restoration_total"] = []
    raw = OUTPUT / "site-content-rows.json"
    raw.write_text(json.dumps(rows["site_content"], ensure_ascii=False), encoding="utf-8")
    subprocess.run(["node", "scripts/render-public-content.mjs", str(raw), str(OUTPUT / "api" / "content.json")], check=True)
    raw.unlink()
    content = json.loads((OUTPUT / "api" / "content.json").read_text(encoding="utf-8"))["content"]
    gallery = sorted(rows["gallery"], key=lambda item: (gallery_year(item) is None, gallery_year(item) or 0, item["id"]))
    memories = rows["memories"]
    for name, value in (("events", rows["events"]), ("gallery", gallery), ("memories", memories)):
        (OUTPUT / "api" / f"{name}.json").write_text(json.dumps({name: value}, ensure_ascii=False), encoding="utf-8")
    tree_total = int(rows["tree_total"][0]["total"]) if rows["tree_total"] else 0
    restoration_total = int(rows["restoration_total"][0]["total"]) if rows["restoration_total"] else 0
    (OUTPUT / "api" / "participation.json").write_text(
        json.dumps({"memories": len(memories), "trees": tree_total, "restorationGifts": restoration_total}),
        encoding="utf-8"
    )

    with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
        media = dict(pool.map(copy_media, public_keys(content, gallery, memories)))
    (OUTPUT / "manifest.json").write_text(json.dumps({"media": media}), encoding="utf-8")
    subprocess.run(["python3", "scripts/prerender-shared-hero.py", str(OUTPUT.parent)], check=True)
    print(f"Mirrored {len(gallery)} gallery items, {len(memories)} approved memories, {tree_total} dedicated trees, {restoration_total} restoration gifts, and {len(media)} public media files.")


if __name__ == "__main__":
    main()
