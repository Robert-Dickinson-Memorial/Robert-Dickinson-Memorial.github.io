# Automatically published memory book

Backup: `backup/memory-book-main-2026-09-30` preserves the previous book at `8e4f79cf5e42e27f4d55eac33d35f34ba11672d6`.

## Reading and printing

- Preview: `/memory-book/`.
- Download: `/memory-book/Robert-E-Dickinson-Memory-Book.pdf`.
- Edition metadata: `/memory-book/edition.json`.
- The PDF rebuilds after each Pages content snapshot (hourly, on deployments, and following the existing extraction/deployment triggers). The preview uses the site's live content refresh. Use “Print or save as PDF” to export that live edition.
- Letter portrait, 8.5 × 11 inches, mirrored binding margins, ivory/navy/sage styling, contents links, PDF outline, page numbers, and selectable text. Home/office printing: actual size, backgrounds enabled, browser headers/footers disabled. A commercial hardcover wrap/spine/bleed template depends on the chosen printer and is not included.

## Sources and ownership

`public/memory-book.js` is the single layout/pagination implementation, used by both the React backend route and static site. Source records remain the saved site content, approved memories, published gallery and dedication totals. The book retains contributor text and public memory order, including pinned contributors; gallery images follow years. Videos and PDFs remain linked, not falsely represented as playable or embedded paper content. Only approved/public records enter the downloadable edition.

Book-specific labels are editable under Memory book headings; cover artwork is editable under Shared images & backgrounds. The source biography, mentorship narrative, scientific chapters, publication metadata, honors/service, life photos and captions, memories and gallery remain in their existing editors. No live source records were changed to produce this design.

## Publishing

The Pages workflow copies the shared renderer/styles, builds the existing public snapshot, creates print-sized image derivatives (original uploads are unchanged), embeds a licensed Noto Serif CJK subset for current public text, and runs Chromium against the same local static publication. The font source is pinned to a Noto repository commit and its license is shipped beside the subset.

`prepare-book-images.py` uses Pillow and fontTools. `generate-memory-book.mjs` uses Playwright. It fails publication on missing photographs, page overflow, or book-render errors. The renderer also checks that every supplied memory's complete story appears in the rendered prose. No PDF or private data is committed to git; generated files ship in the Pages artifact.

## Validation

Generated and rendered the full current edition (66 pages at local validation; 7 published memories, 27 gallery photographs, 10 life photographs). Checked all pages in contact sheets and inspected cover, contents, contributor pages including Chinese passages, gallery pages and the science diagram at readable resolution. Verified all contributors, correct Letter page size, internal contents links, outline, complete memory text, no failed images and no overflow. Production app build passed. Pagination adapts to current content and available platform font metrics; edition length is not fixed.
