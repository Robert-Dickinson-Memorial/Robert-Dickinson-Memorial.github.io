# Homepage design — September 30, 2026

Main backup branch: `backup/home-main-2026-09-30`
Backup commit: `0dbd637c543e1be47886ca62206e95cdf76a03a9`

The redesign adapts the owner's Design_Home2 reference, retaining the existing public copy and the editable content sources. The dates and quotations come from the memorial's saved content rather than the mockup. The homepage portrait and horizon retain the existing owner asset controls. Scientific thread titles and descriptions use the existing Scientific Legacy thread editor; contribution cards and frontier topics retain their existing Home editors.

Homepage-only CSS is scoped to `.home-redesign`. Both `app/page.tsx` and `static/index.html` use the new structure; `static/site.js` adds homepage hydration while preserving other page handlers. The homepage event and gallery previews read the same published records as their full pages and use the existing media mirror for access resilience.

No database content, published memories, gallery records, or other page designs were modified.

To restore, revert the homepage redesign commit. If subsequent work touches the same shared files, apply the homepage reverse patch selectively; do not reset the whole site to the backup and discard later work.

Earth image: NASA / Earth Observatory, Blue Marble (2002), public-domain NASA image.
Source: https://science.nasa.gov/resource/blue-marble-2002/
Asset: https://assets.science.nasa.gov/dynamicimage/assets/science/psd/solar/2023/09/1/1-bluemarble_west.jpg?w=600&h=600&fit=clip
Local copy: `public/home-earth.jpg`. Served locally for reliable access; cropped to its circular Earth boundary by CSS.

Validation: production build; browser layout checks at 1440, 1024, 768, 600, 390, and 320px; preserved owner copy; live owner-edit hydration; mobile navigation; six threads/four contribution cards; published event/gallery previews.
