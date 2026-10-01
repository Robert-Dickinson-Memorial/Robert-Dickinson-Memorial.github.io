# Editorial memory book redesign

Backup: `backup/memory-book-first-edition-2026-10-01`, commit `78cd1fc9d552c0fb7d6e54b77e7d01a1bbfb5308`. This preserves the first book renderer and all source code; the separate original core backup remains intact.

The shared browser/PDF renderer now uses a portrait cover, dark frontispiece, numbered chapter openings, sage and warm ivory chapter colors, prominent existing quotations, a childhood photo mosaic, alternating career photo/text compositions, illustrated scientific chapters, publication panels, a dated honors layout, contributor photographs wrapped by narrative, and three chronological gallery compositions. Original source text and photographs remain owner-managed through the existing backend. No database content was rewritten and no quotations were invented.

Measured pagination can split long paragraphs into available space, carries section styling onto continuation pages, and balances short story endings. Attachment links sit in a dedicated footer region rather than creating otherwise empty pages. Drop capitals are measured before pagination. Contributor ordering and chronological gallery ordering are preserved. The existing renderer rejects missing contributor text, missing images, and overflowing pages before automatic PDF publication.

Verification: production app build; generated the PDF through the actual static memory-book page with current public content; 62 Letter pages, seven complete memories, all 27 gallery photographs and 10 life photographs, no missing images or body overflow. Rendered all pages and reviewed contact sheets plus detailed narrative, Chinese text, science and gallery proofs. Existing hourly PDF workflow and live preview remain unchanged.

Book typography is embedded with static regular, italic and bold instances of Libre Baskerville (distributed as Memorial Book Serif, with the OFL license). The book overrides inherited website heading-font choices so local, server PDF and browser previews use the same display typography. Public asset changes now also rebuild the Worker reader.
