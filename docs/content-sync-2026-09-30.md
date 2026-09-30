# Public content and editor synchronization audit

The public service and GitHub Pages use the same saved site-content merge, approved memories, published events, gallery records, and participation queries. Existing editorial content and uploads were retained.

Corrections:
- Added owner-managed globe, His Life background, and Plant a Tree landscape-grid assets, with upload/reset support and the existing same-origin media mirror.
- Connected Events and Gallery banner backgrounds to the saved shared horizon image.
- Connected home counter labels, mobile Menu label, and publication action labels to editable page copy.
- Content hydration now completes before dependent previews and labels render, initially and after live refresh. Updated counter labels refresh alongside content.
- Removed client-only overrides of saved navigation labels and the React-only frontier label substitution.
- Initial static HTML now uses saved marked page-copy text as well as saved shared photographs, avoiding old fallback text before hydration.

Editing locations:
- Shared images & backgrounds: portrait, banner, globe, His Life artwork, tree landscape grid.
- Home: hero introduction, scientific narrative, thread labels/descriptions, contributions, frontiers, section headings, preview labels, counter labels.
- Existing Life, Legacy, Events, Gallery, and Published community memories editors retain their corresponding stories, captions, photographs, attachments, and publication status controls.
- Event preview dates and gallery preview photographs are derived from published records, not separate homepage copies. Participation totals remain derived values rather than editable numbers.

Verification: production build; simulated delayed saved content; updated text and image choices on all seven public routes; focus-triggered live refresh without reloading; initial HTML escaping and layout preservation. No test records were written to the live database.

Timing: live refresh occurs after opening a page, on window focus, and every minute while visible. Visitors unable to reach the live service use the same-origin snapshot, which is rebuilt hourly and on deployments. This fallback is intentionally retained for international accessibility; it cannot promise instantaneous updates while the live service is unreachable.
