from pathlib import Path
import html as html_lib
import json
import re

BASE = "https://robert-dickinson-memorial.github.io"
IMAGE = f"{BASE}/assets/robert-dickinson.jpg"

PAGES = {
    "_site/index.html": (
        "Robert E. Dickinson Memorial | Life, Science & Memories",
        "Celebrating the life, science, and enduring legacy of Robert E. Dickinson. Explore his story, scientific contributions, photos, and community memories, and share a memory.",
        f"{BASE}/",
    ),
    "_site/life/index.html": (
        "Robert E. Dickinson | His Life and Career",
        "Explore the life and career of Robert E. Dickinson, from his early years through a lifetime of scientific discovery, teaching, mentorship, and leadership.",
        f"{BASE}/life/",
    ),
    "_site/legacy/index.html": (
        "Robert E. Dickinson | Scientific Legacy",
        "Explore Robert E. Dickinson's scientific legacy in atmospheric dynamics, climate change, Earth-system modeling, land-atmosphere interactions, and remote sensing.",
        f"{BASE}/legacy/",
    ),
    "_site/events/index.html": (
        "Robert E. Dickinson Memorial | Events",
        "Memorial gatherings, scientific tributes, talks, and celebrations honoring the life and work of Robert E. Dickinson.",
        f"{BASE}/events/",
    ),
    "_site/gallery/index.html": (
        "Robert E. Dickinson Memorial | Photo Gallery",
        "Photos from the life, career, collaborations, and community of Robert E. Dickinson.",
        f"{BASE}/gallery/",
    ),
    "_site/memories/index.html": (
        "Share a Memory of Robert E. Dickinson | Memorial",
        "Read memories of Robert E. Dickinson and share a story, photograph, or reflection with his family, colleagues, students, collaborators, and scientific community.",
        f"{BASE}/memories/",
    ),
    "_site/tree/index.html": (
        "Plant a Tree in Robert E. Dickinson's Memory | Living Tribute",
        "Honor Robert E. Dickinson with a living tribute by supporting tree planting and forest restoration projects connected to his life and science.",
        f"{BASE}/tree/",
    ),
    "_site/memory-book/index.html": (
        "Robert E. Dickinson Memory Book | Memorial",
        "Explore the Robert E. Dickinson memory book, bringing together his life story, scientific legacy, community memories, and photographs.",
        f"{BASE}/memory-book/",
    ),
}

def meta_block(title, description, url):
    title_e = html_lib.escape(title, quote=True)
    desc_e = html_lib.escape(description, quote=True)
    url_e = html_lib.escape(url, quote=True)
    return f"""
    <link rel="canonical" href="{url_e}" />
    <meta property="og:site_name" content="Robert E. Dickinson Memorial" />
    <meta property="og:type" content="website" />
    <meta property="og:title" content="{title_e}" />
    <meta property="og:description" content="{desc_e}" />
    <meta property="og:url" content="{url_e}" />
    <meta property="og:image" content="{IMAGE}" />
    <meta property="og:image:alt" content="Robert E. Dickinson" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="{title_e}" />
    <meta name="twitter:description" content="{desc_e}" />
    <meta name="twitter:image" content="{IMAGE}" />
"""

for filename, (title, description, url) in PAGES.items():
    path = Path(filename)
    text = path.read_text()
    text = re.sub(r"<title>.*?</title>", f"<title>{html_lib.escape(title)}</title>", text, count=1, flags=re.S)
    if re.search(r'<meta\s+name=["\']description["\']', text, flags=re.I):
        text = re.sub(
            r'<meta\s+name=["\']description["\'][^>]*>',
            f'<meta name="description" content="{html_lib.escape(description, quote=True)}" />',
            text,
            count=1,
            flags=re.I,
        )
    else:
        text = text.replace("</head>", f'    <meta name="description" content="{html_lib.escape(description, quote=True)}" />\n  </head>', 1)

    text = re.sub(r'\s*<link\s+rel=["\']canonical["\'][^>]*>', "", text, flags=re.I)
    text = re.sub(r'\s*<meta\s+(?:property|name)=["\'](?:og:[^"\']+|twitter:[^"\']+)["\'][^>]*>', "", text, flags=re.I)
    text = text.replace("</head>", meta_block(title, description, url) + "  </head>", 1)

    if filename == "_site/index.html":
        data = {
            "@context": "https://schema.org",
            "@graph": [
                {
                    "@type": "WebSite",
                    "@id": f"{BASE}/#website",
                    "url": f"{BASE}/",
                    "name": "Robert E. Dickinson Memorial",
                    "description": description,
                },
                {
                    "@type": "Person",
                    "@id": f"{BASE}/#robert-e-dickinson",
                    "name": "Robert E. Dickinson",
                    "url": f"{BASE}/",
                    "image": IMAGE,
                    "description": "Pioneering climate scientist, Earth-system modeler, teacher, and mentor.",
                },
            ],
        }
        structured = '<script type="application/ld+json">' + json.dumps(data, ensure_ascii=False) + "</script>"
        text = text.replace("</head>", f"    {structured}\n  </head>", 1)

    path.write_text(text)
