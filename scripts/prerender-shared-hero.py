#!/usr/bin/env python3
"""Put the saved wordmark and shared photographs in the initial Pages HTML.
Runtime hydration still applies later owner edits; media remains same-origin.
"""
import html
import json
import re
import sys
from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import quote


class SavedCopyParser(HTMLParser):
    """Replace marked text only; keep surrounding links, classes and layout intact."""
    def __init__(self, markup, copy):
        super().__init__(convert_charrefs=False)
        self.markup, self.copy = markup, copy
        self.offsets = [0]
        for line in markup.splitlines(keepends=True):
            self.offsets.append(self.offsets[-1] + len(line))
        self.stack, self.edits = [], []
        self.feed(markup)

    def position(self):
        line, column = self.getpos()
        return self.offsets[line - 1] + column

    def handle_starttag(self, tag, attrs):
        if tag in {"area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "param", "source", "track", "wbr"}:
            return
        self.stack.append((tag, dict(attrs).get("data-copy"), self.position() + len(self.get_starttag_text())))

    def handle_endtag(self, tag):
        match = next((i for i in range(len(self.stack) - 1, -1, -1) if self.stack[i][0] == tag), None)
        if match is None:
            return
        _, key, start = self.stack[match]
        self.stack = self.stack[:match]
        if key in self.copy and isinstance(self.copy[key], str):
            text = self.copy[key]
            if key == "life.heroTitle":
                text = re.sub(r"\.\s+(?=A generous spirit)", ".\n", text, flags=re.I)
            self.edits.append((start, self.position(), html.escape(text)))

    def render(self):
        result = self.markup
        # All marked copy fields are leaves in the static templates.
        for start, end, text in sorted(self.edits, reverse=True):
            result = result[:start] + text + result[end:]
        return result


def prerender(site):
    content = json.loads((site / 'mirror/api/content.json').read_text())['content']
    media = json.loads((site / 'mirror/manifest.json').read_text())['media']
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
        markup = SavedCopyParser(markup, content['pageCopy']).render()
        markup = re.sub(r'<img\b[^>]*data-site-asset="[^"]+"[^>]*>', image, markup)
        page.write_text(markup)


if __name__ == '__main__':
    prerender(Path(sys.argv[1]))
