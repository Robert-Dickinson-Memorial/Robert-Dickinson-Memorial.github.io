#!/usr/bin/env python3
"""Put the saved wordmark and shared photographs in the initial Pages HTML.
Runtime hydration still applies later owner edits; media remains same-origin.
"""
import html
import json
import re
import sys
from pathlib import Path
from urllib.parse import quote


def prerender(site):
    content = json.loads((site / 'mirror/api/content.json').read_text())['content']
    media = json.loads((site / 'mirror/manifest.json').read_text())['media']
    wordmark = html.escape(content['pageCopy']['global.wordmark'])
    assets = content['siteAssets']

    def image(match):
        tag = match[0]
        asset_id = re.search(r'data-site-asset="([^"]+)"', tag)[1]
        asset = assets.get(asset_id)
        if not asset:
            return tag
        key = asset.get('objectKey')
        if key:
            resource = '/api/site-assets/' + '/'.join(quote(part, safe='') for part in key.split('/'))
            src = media.get(resource)
            if not src:
                return tag
        else:
            src = '/assets/' + asset['asset'].lstrip('/')
        tag = re.sub(r'\bsrc="[^"]*"', lambda _: 'src="' + html.escape(src, quote=True) + '"', tag)
        # The background is decorative; retain its empty alt.
        alt = '' if 'aria-hidden="true"' in tag else asset.get('alt', '')
        return re.sub(r'\balt="[^"]*"', lambda _: 'alt="' + html.escape(alt, quote=True) + '"', tag)

    for page in site.rglob('*.html'):
        markup = page.read_text()
        markup = re.sub(r'(<span\b[^>]*data-copy="global.wordmark"[^>]*>)[^<]*(</span>)', lambda m: m[1] + wordmark + m[2], markup)
        markup = re.sub(r'<img\b[^>]*data-site-asset="[^"]+"[^>]*>', image, markup)
        page.write_text(markup)


if __name__ == '__main__':
    prerender(Path(sys.argv[1]))
