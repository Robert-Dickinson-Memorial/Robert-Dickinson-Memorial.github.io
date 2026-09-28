#!/usr/bin/env python3
"""Publish only approved, public memorial data and media beside the static site."""

import concurrent.futures
import hashlib
import json
import os
from pathlib import Path
from urllib.parse import quote
from urllib.request import Request, urlopen


API_BASE = os.environ["MEMORIAL_API_BASE"].rstrip("/")
OUTPUT = Path(os.environ.get("MEMORIAL_SITE_DIR", "_site")) / "mirror"
DATA = {
    "/api/content": "content",
    "/api/events": "events",
    "/api/gallery": "gallery",
    "/api/memories": "memories",
}
MIME_EXTENSIONS = {
    "image/jpeg": ".jpg", "image/png": ".png", "image/webp": ".webp",
    "video/mp4": ".mp4", "video/webm": ".webm", "application/pdf": ".pdf",
}


def public_url(path):
    return API_BASE + path


def fetch_json(path):
    with urlopen(Request(public_url(path), headers={"accept": "application/json"}), timeout=35) as response:
        if response.status != 200:
            raise RuntimeError(f"Public data endpoint failed: {path} ({response.status})")
        return json.load(response)


def safe_key(key):
    if not isinstance(key, str) or not key or any(part in ("", ".", "..") for part in key.split("/")):
        raise ValueError("Invalid public media key")
    return "/".join(quote(part, safe="") for part in key.split("/"))


def media_requests(payloads):
    content = payloads["content"]["content"]
    requests = set()

    def add(route, key):
        if key:
            requests.add((route, safe_key(key)))

    for asset in content.get("siteAssets", {}).values():
        if isinstance(asset, dict):
            add("/api/site-assets", asset.get("objectKey"))
    for photo in content.get("lifePhotos", []):
        add("/api/life-photos", photo.get("objectKey"))
    for chapter in content.get("legacyChapters", []):
        add("/api/chapter-photos", (chapter.get("photo") or {}).get("objectKey"))
    for item in payloads["gallery"]["gallery"]:
        if item.get("kind") == "image":
            add("/api/gallery/photos", item.get("objectKey"))
    for memory in payloads["memories"]["memories"]:
        add("/api/photos", memory.get("photoKey"))
        add("/api/memory-videos", memory.get("videoKey"))
        add("/api/memory-files", memory.get("pdfKey"))
    return sorted(requests)


def copy_media(entry):
    route, key = entry
    source = f"{route}/{key}"
    with urlopen(Request(public_url(source)), timeout=90) as response:
        mime = response.headers.get_content_type()
        extension = MIME_EXTENSIONS.get(mime)
        if response.status != 200 or not extension:
            raise RuntimeError(f"Public media unavailable or invalid: {route} ({response.status}, {mime})")
        digest = hashlib.sha256(source.encode()).hexdigest()[:24]
        filename = f"{digest}{extension}"
        destination = OUTPUT / "media" / filename
        limit = 55 * 1024 * 1024
        count = 0
        with destination.open("wb") as stream:
            while chunk := response.read(1024 * 1024):
                count += len(chunk)
                if count > limit:
                    raise RuntimeError(f"Public media exceeds snapshot limit: {route}")
                stream.write(chunk)
        if not count:
            raise RuntimeError(f"Public media is empty: {route}")
    return source, f"/mirror/media/{filename}"


def main():
    if not API_BASE.startswith("https://"):
        raise ValueError("MEMORIAL_API_BASE must be HTTPS")
    (OUTPUT / "api").mkdir(parents=True, exist_ok=True)
    (OUTPUT / "media").mkdir(parents=True, exist_ok=True)
    payloads = {name: fetch_json(path) for path, name in DATA.items()}
    for name, key in (("content", "content"), ("events", "events"), ("gallery", "gallery"), ("memories", "memories")):
        if not isinstance(payloads[name].get(key), (dict if name == "content" else list)):
            raise RuntimeError(f"Malformed public response: {name}")
        (OUTPUT / "api" / f"{name}.json").write_text(json.dumps(payloads[name], ensure_ascii=False), encoding="utf-8")

    entries = media_requests(payloads)
    with concurrent.futures.ThreadPoolExecutor(max_workers=5) as pool:
        media = dict(pool.map(copy_media, entries))
    (OUTPUT / "manifest.json").write_text(json.dumps({"media": media}, ensure_ascii=False), encoding="utf-8")
    print(f"Mirrored {len(payloads['gallery']['gallery'])} gallery items, {len(payloads['memories']['memories'])} approved memories, and {len(media)} public media files.")


if __name__ == "__main__":
    main()
