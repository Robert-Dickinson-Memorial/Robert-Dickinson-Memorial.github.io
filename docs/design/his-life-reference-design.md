# His Life reference design

The supplied mockup uses one continuous illustrated scene, navy serif typography, compact ivory cards, generous photographs, and hollow glowing timeline nodes. The implementation keeps the existing biography, dates, photos, six editable qualities, and CMS fields. The full biography remains in the memory book.

## Artwork

- Project asset: `public/life-reference-background-v1.webp`
- Generated with the built-in image generation tool from the supplied visual reference. This is decorative Earth/mountain artwork, not a documentary photograph.
- Robert's portrait and historical photographs remain the original uploaded images. The hero uses a CSS edge fade; historical portraits retain their full frame.
- Original generated source: `exec-02911c66-4ce9-4710-aa9c-73b39534ae6e.png`; web delivery copy uses WebP encoding.

### Generation prompt

Use case: compositing. Asset type: decorative background plate for a responsive memorial website, not a mockup. Input image is the style/layout reference. Create ONLY the continuous background artwork from this example, REMOVE every person, all portraits, photos, cards, panels, writing, letters, numbers, headings, circles, dots and timeline lines. Keep its dignified ivory paper, subtle blue-grey Earth globe partially entering from the UPPER LEFT, soft blue-grey mountain peaks and clouds across the TOP RIGHT fading into a large warm ivory empty center, faint delicate topographic contour lines along the LEFT edge down the middle, and another soft blue-grey mountain ridge along the BOTTOM edge. Near-exact palette of the reference: warm ivory #f5f2eb, pale slate-blue, muted grey, very subtle paper grain. Elegant realistic landscape illustration, softly faded with crisp mountain detail confined to the perimeter. The large center 70% must be essentially empty pale ivory for real HTML content laid over it. The top Earth and mountains occupy the top 22%; bottom mountains only bottom 12%. Portrait orientation 2:3, high resolution, no people, absolutely no typography, no symbols, no interface components, no borders. This is a reusable website background, not a full webpage.

## Recovery

Core backup: `backup/core-approved-2026-09-25`.
Before this redesign: `backup/his-life-before-reference-art-2026-09-25` at `c9d0e88d17a56b2a06fd5ac1824917cc03f3d65c`.

Do not restore the content database to revert a layout. Restore only the relevant layout files while preserving current CMS text and photos.
