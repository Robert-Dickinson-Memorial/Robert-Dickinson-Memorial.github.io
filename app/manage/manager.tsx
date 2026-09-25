"use client";

import { FormEvent, useState } from "react";
import { BookOpen, CalendarPlus, FileX, ImageOff, ImagePlus, Save, Trash2, Video } from "lucide-react";
import type { GalleryItem, LegacyChapter, LegacyPublication, MemorialEvent, SiteContent } from "../site-data";

type MemorialEditor = { email: string; displayName: string | null; createdAt: string };
type PublishedMemory = { id: number; name: string; relationship: string; title: string; story: string; photoKey: string | null; pdfKey: string | null; pdfName: string | null; socialUrl: string | null };

async function responseData(response: Response) {
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Unable to save this change.");
  return data;
}

const toLines = (value: string) => value.split(/\n/).map((item) => item.trim()).filter(Boolean);

const copyGroups = [
  { id: "copy-sitewide", prefix: ["global.", "nav."], page: "Site-wide", title: "Navigation & footer" },
  { id: "copy-home", prefix: ["home."], page: "Home", title: "Headings, buttons & labels" },
  { id: "copy-life", prefix: ["life."], page: "His life", title: "Personal portrait, headings & links" },
  { id: "copy-legacy", prefix: ["legacy."], page: "Scientific legacy", title: "Headings & section labels" },
  { id: "copy-events", prefix: ["events."], page: "Events", title: "Headings, messages & links" },
  { id: "copy-gallery", prefix: ["gallery."], page: "Gallery", title: "Headings, buttons & messages" },
  { id: "copy-memories", prefix: ["memories."], page: "Memories", title: "Headings, form labels & messages" },
  { id: "copy-tree", prefix: ["tree."], page: "Living tribute", title: "Tree dedication page" },
  { id: "copy-book", prefix: ["book."], page: "Memory book", title: "Cover, headings & print labels" },
] as const;

const copyFieldNames: Record<string, string> = {
  wordmark: "Navigation site name",
  footerName: "Footer name",
  footerText: "Footer text",
  footerHome: "Footer home link",
  heroEyebrow: "Hero eyebrow",
  heroKicker: "Hero kicker",
  heroTitle: "Hero title",
  heroIntro: "Hero introduction",
  heroNameLine1: "Name — line 1",
  heroNameLine2: "Name — line 2",
  lifeDates: "Life dates",
  readStory: "Read his story link",
  portraitQuote: "Portrait quote",
  portraitCaption: "Portrait caption",
  storyKicker: "His story — kicker",
  storyTitleLine1: "His story — title line 1",
  storyTitleLine2: "His story — title line 2",
  storyYears: "His story — years",
  storyReadLink: "His story — read link",
  personalPortraitIntro: "Personal portrait — opening paragraph",
  personalPortraitText: "Personal portrait — mentorship paragraph",
  fullStoryLink: "Full story — memory book link",
  tributeKicker: "Living tributes — kicker",
  tributeTitle: "Living tributes — heading",
  tributeIntro: "Living tributes — introduction",
  legacyKicker: "Scientific legacy — kicker",
  legacyTitle: "Scientific legacy — heading",
  legacyMapPrimary: "Home scientific map — primary label",
  legacyMapSecondary: "Home scientific map — secondary label",
  legacyMapHint: "Home scientific map — explanatory line",
  legacyCta: "Scientific legacy — button",
  communityKicker: "Explore the memorial — kicker",
  communityTitle: "Explore the memorial — heading",
  communityIntro: "Explore the memorial — introduction",
  sectionKicker: "Section kicker",
  sectionTitle: "Section heading",
  sectionIntro: "Section introduction",
  threadsKicker: "Enduring research threads — kicker",
  threadsTitle: "Enduring research threads — heading",
  threadsIntro: "Enduring research threads — introduction",
  voicesKicker: "Scientific community voices — kicker",
  voicesTitle: "Scientific community voices — heading",
  voicesIntro: "Scientific community voices — introduction",
  honorsKicker: "Honors, awards & recognition — heading",
  shareKicker: "Share a memory — kicker",
  shareTitle: "Share a memory — heading",
  shareText: "Share a memory — introduction",
  formStoryNote: "Story optional note",
  formSocial: "Public post field label",
  formSocialNote: "Public post optional note",
  formSocialPlaceholder: "Public post placeholder",
  formPdf: "PDF upload label",
  formPdfHelp: "PDF upload guidance",
  pdfLink: "Published PDF link label",
  socialLink: "Published public-post link label",
  moderation: "Submission review note",
  dedicationUrl: "Tree dedication link",
  projectUrl: "Chippewa project link",
  toolbarReturn: "Return to memorial label",
  print: "Print / save PDF button",
};

function copyFieldLabel(key: string) {
  const tail = key.split(".").pop() || key;
  if (copyFieldNames[tail]) return copyFieldNames[tail];
  return tail
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/faq/gi, "FAQ")
    .replace(/^./, (letter) => letter.toUpperCase());
}

export default function Manager({ content, events, media, publishedMemories, editors, owner }: { content: SiteContent; events: MemorialEvent[]; media: GalleryItem[]; publishedMemories: PublishedMemory[]; editors: MemorialEditor[]; owner: boolean }) {
  const [contentValues, setContentValues] = useState(content);
  const [lifePhotos, setLifePhotos] = useState(content.lifePhotos);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function saveContent() {
    setBusy(true); setMessage("");
    try {
      await responseData(await fetch("/api/admin/content", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ values: contentValues }) }));
      setMessage("Memorial content saved. The public site will use these changes immediately.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Please try again."); }
    finally { setBusy(false); }
  }

  function updatePageCopy(key: string, value: string) {
    setContentValues((current) => ({ ...current, pageCopy: { ...current.pageCopy, [key]: value } }));
  }

  function updateSiteAssetAlt(assetId: "portrait" | "horizon" | "lifePortrait", value: string) {
    setContentValues((current) => ({
      ...current,
      siteAssets: { ...current.siteAssets, [assetId]: { ...current.siteAssets[assetId], alt: value } },
    }));
  }

  function updatePortraitLayout(layout: "portrait" | "landscape") {
    setContentValues((current) => ({
      ...current,
      siteAssets: {
        ...current.siteAssets,
        portrait: { ...current.siteAssets.portrait, layout },
      },
    }));
  }

  function siteAssetSrc(assetId: "portrait" | "horizon" | "lifePortrait") {
    const asset = contentValues.siteAssets[assetId];
    if (asset.objectKey) return `/api/site-assets/${asset.objectKey.split("/").map(encodeURIComponent).join("/")}`;
    return `/${asset.asset.replace(/^\//, "")}`;
  }

  async function uploadSiteAsset(event: FormEvent<HTMLFormElement>, assetId: "portrait" | "horizon" | "lifePortrait") {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const file = form.get("file");
    if (!(file instanceof File) || !file.size) { setMessage("Choose a photograph to upload."); return; }
    form.set("assetId", assetId);
    setBusy(true); setMessage("");
    try {
      await responseData(await fetch("/api/admin/content", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ values: contentValues }) }));
      await responseData(await fetch("/api/admin/site-asset", { method: "POST", body: form }));
      window.location.reload();
    } catch (error) { setMessage(error instanceof Error ? error.message : "Please try again."); }
    finally { setBusy(false); }
  }

  async function resetSiteAsset(assetId: "portrait" | "horizon" | "lifePortrait") {
    if (!window.confirm("Restore the original built-in image?")) return;
    setBusy(true); setMessage("");
    try {
      await responseData(await fetch("/api/admin/content", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ values: contentValues }) }));
      await responseData(await fetch(`/api/admin/site-asset?assetId=${encodeURIComponent(assetId)}`, { method: "DELETE" }));
      window.location.reload();
    } catch (error) { setMessage(error instanceof Error ? error.message : "Please try again."); setBusy(false); }
  }

  function updateMilestone(index: number, field: "year" | "title" | "text", value: string) {
    setContentValues((current) => ({ ...current, lifeMilestones: current.lifeMilestones.map((item, itemIndex) => itemIndex === index ? { ...item, [field]: value } : item) }));
  }

  function updateHomeLegacyCard(index: number, field: "title" | "text", value: string) {
    setContentValues((current) => ({ ...current, homeLegacyCards: current.homeLegacyCards.map((item, itemIndex) => itemIndex === index ? { ...item, [field]: value } : item) }));
  }

  function addHomeLegacyCard() {
    setContentValues((current) => ({ ...current, homeLegacyCards: [...current.homeLegacyCards, { title: "", text: "", threadIds: [] }] }));
  }

  function removeHomeLegacyCard(index: number) {
    setContentValues((current) => ({ ...current, homeLegacyCards: current.homeLegacyCards.filter((_, itemIndex) => itemIndex !== index) }));
  }

  function updateLegacyThread(index: number, field: "title" | "text", value: string) {
    setContentValues((current) => ({ ...current, legacyThreads: current.legacyThreads.map((item, itemIndex) => itemIndex === index ? { ...item, [field]: value } : item) }));
  }

  function updateSecondaryLegacyTopic(index: number, field: "title" | "text", value: string) {
    setContentValues((current) => ({ ...current, secondaryLegacyTopics: current.secondaryLegacyTopics.map((item, itemIndex) => itemIndex === index ? { ...item, [field]: value } : item) }));
  }

  function addSecondaryLegacyTopic() {
    setContentValues((current) => ({ ...current, secondaryLegacyTopics: [...current.secondaryLegacyTopics, { title: "", text: "", threadIds: [] }] }));
  }

  function removeSecondaryLegacyTopic(index: number) {
    setContentValues((current) => ({ ...current, secondaryLegacyTopics: current.secondaryLegacyTopics.filter((_, itemIndex) => itemIndex !== index) }));
  }

  function updateCommunityQuote(index: number, field: "quote" | "attribution", value: string) {
    setContentValues((current) => ({ ...current, communityQuotes: current.communityQuotes.map((item, itemIndex) => itemIndex === index ? { ...item, [field]: value } : item) }));
  }

  function addCommunityQuote() {
    setContentValues((current) => ({ ...current, communityQuotes: [...current.communityQuotes, { quote: "", attribution: "" }] }));
  }

  function removeCommunityQuote(index: number) {
    setContentValues((current) => ({ ...current, communityQuotes: current.communityQuotes.filter((_, itemIndex) => itemIndex !== index) }));
  }

  function updateHonor(index: number, field: "year" | "title" | "detail", value: string) {
    setContentValues((current) => ({ ...current, honors: current.honors.map((item, itemIndex) => itemIndex === index ? { ...item, [field]: value } : item) }));
  }

  function updateChapter(index: number, patch: Partial<LegacyChapter>) {
    setContentValues((current) => ({ ...current, legacyChapters: current.legacyChapters.map((item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item) }));
  }

  function chapterPublications(chapter: LegacyChapter): LegacyPublication[] {
    if (chapter.publications?.length) return chapter.publications;
    return chapter.publication ? [chapter.publication] : [];
  }

  function updateChapterPublication(chapterIndex: number, publicationIndex: number, patch: Partial<LegacyPublication>) {
    const chapter = contentValues.legacyChapters[chapterIndex];
    const publications = chapterPublications(chapter).map((publication, index) => index === publicationIndex ? { ...publication, ...patch } : publication);
    updateChapter(chapterIndex, { publication: null, publications });
  }

  function addChapterPublication(chapterIndex: number) {
    const chapter = contentValues.legacyChapters[chapterIndex];
    updateChapter(chapterIndex, { publication: null, publications: [...chapterPublications(chapter), { year: "", title: "", citation: "", note: "", url: "", image: "", alt: "" }] });
  }

  function removeChapterPublication(chapterIndex: number, publicationIndex: number) {
    const chapter = contentValues.legacyChapters[chapterIndex];
    updateChapter(chapterIndex, { publication: null, publications: chapterPublications(chapter).filter((_, index) => index !== publicationIndex) });
  }

  async function saveLifePhoto(event: FormEvent<HTMLFormElement>, id?: string) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const file = form.get("file");
    const upload = file instanceof File && file.size > 0;
    if (!id && !upload) { setMessage("Choose a photograph to upload."); return; }
    if (id) form.set("id", id);
    setBusy(true); setMessage("");
    try {
      const response = upload
        ? await fetch("/api/admin/life-photos", { method: "POST", body: form })
        : await fetch("/api/admin/life-photos", { method: "PATCH", headers: { "content-type": "application/json" },
            body: JSON.stringify({ id, caption: form.get("caption"), date: form.get("date"), alt: form.get("alt"), milestoneId: form.get("milestoneId") }) });
      const data = await responseData(response);
      setLifePhotos(data.photos);
      if (!id) formElement.reset();
      setMessage("Photograph saved.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Please try again."); }
    finally { setBusy(false); }
  }

  async function deleteLifePhoto(id: string) {
    if (!window.confirm("Remove this photograph and its caption from His Life?")) return;
    setBusy(true); setMessage("");
    try {
      const data = await responseData(await fetch(`/api/admin/life-photos?id=${encodeURIComponent(id)}`, { method: "DELETE" }));
      setLifePhotos(data.photos); setMessage("Photograph removed from His Life.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Please try again."); }
    finally { setBusy(false); }
  }

  async function uploadChapterPhoto(event: FormEvent<HTMLFormElement>, chapterId: string) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const file = form.get("file");
    if (!(file instanceof File) || !file.size) { setMessage("Choose a photograph to upload."); return; }
    form.set("chapterId", chapterId);
    setBusy(true); setMessage("");
    try {
      await responseData(await fetch("/api/admin/content", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ values: contentValues }) }));
      await responseData(await fetch("/api/admin/chapter-photo", { method: "POST", body: form }));
      window.location.reload();
    } catch (error) { setMessage(error instanceof Error ? error.message : "Please try again."); }
    finally { setBusy(false); }
  }

  async function removeChapterPhoto(chapterId: string) {
    if (!window.confirm("Remove this photograph from the scientific chapter?")) return;
    setBusy(true); setMessage("");
    try {
      await responseData(await fetch("/api/admin/content", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ values: contentValues }) }));
      await responseData(await fetch(`/api/admin/chapter-photo?chapterId=${encodeURIComponent(chapterId)}`, { method: "DELETE" }));
      window.location.reload();
    } catch (error) { setMessage(error instanceof Error ? error.message : "Please try again."); setBusy(false); }
  }

  async function addEvent(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setMessage("");
    const form = new FormData(event.currentTarget);
    const payload = Object.fromEntries(form.entries());
    try {
      await responseData(await fetch("/api/admin/events", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payload) }));
      window.location.reload();
    } catch (error) { setMessage(error instanceof Error ? error.message : "Please try again."); setBusy(false); }
  }

  async function addMedia(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setMessage("");
    try {
      await responseData(await fetch("/api/admin/media", { method: "POST", body: new FormData(event.currentTarget) }));
      window.location.reload();
    } catch (error) { setMessage(error instanceof Error ? error.message : "Please try again."); setBusy(false); }
  }

  async function remove(path: "events" | "media", id: number) {
    if (!window.confirm("Remove this item from the memorial site?")) return;
    setBusy(true); setMessage("");
    try {
      await responseData(await fetch(`/api/admin/${path}?id=${id}`, { method: "DELETE" }));
      window.location.reload();
    } catch (error) { setMessage(error instanceof Error ? error.message : "Please try again."); setBusy(false); }
  }

  async function addEditor(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setMessage("");
    const form = new FormData(event.currentTarget);
    try {
      const result = await responseData(await fetch("/api/admin/editors", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(Object.fromEntries(form.entries())) }));
      if (!result.invitationSent) window.alert("Editor access was added, but the invitation email could not be sent. Mail service activation may still be required.");
      window.location.reload();
    } catch (error) { setMessage(error instanceof Error ? error.message : "Please try again."); setBusy(false); }
  }

  async function removeEditor(email: string) {
    if (!window.confirm(`Remove editor access for ${email}?`)) return;
    setBusy(true); setMessage("");
    try {
      await responseData(await fetch(`/api/admin/editors?email=${encodeURIComponent(email)}`, { method: "DELETE" }));
      window.location.reload();
    } catch (error) { setMessage(error instanceof Error ? error.message : "Please try again."); setBusy(false); }
  }

  async function savePublishedMemory(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setMessage("");
    const form = new FormData(event.currentTarget);
    const payload = Object.fromEntries(form.entries());
    try {
      await responseData(await fetch("/api/admin/memories", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ ...payload, action: "edit" }) }));
      setMessage("Published memory updated.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Please try again."); }
    finally { setBusy(false); }
  }

  async function removePublishedMemory(id: number, title: string, mode: "text" | "photo" | "pdf" | "link" | "all", hasPhoto = true) {
    const warning = mode === "text"
      ? hasPhoto ? `Delete the memory entry “${title}”? Its photo will be preserved in the public gallery, while any PDF or public link will be removed with the memory.` : `Permanently delete the memory entry “${title}” and any PDF or public link attached to it?`
      : mode === "photo" ? `Delete only the photo attached to “${title}”? The rest of the memory will remain published.`
      : mode === "pdf" ? `Delete only the PDF attached to “${title}”? The rest of the memory will remain published.`
      : mode === "link" ? `Remove only the public link attached to “${title}”? The rest of the memory will remain published.`
      : `Permanently delete “${title}” and all of its text, photo, PDF, and public-link content?`;
    if (!window.confirm(warning)) return;
    setBusy(true); setMessage("");
    try {
      await responseData(await fetch(`/api/admin/memories?id=${id}&mode=${mode}`, { method: "DELETE" }));
      window.location.reload();
    } catch (error) { setMessage(error instanceof Error ? error.message : "Please try again."); setBusy(false); }
  }

  return (
    <div className="manager-grid">
      {message && <p className="manager-message" role="status">{message}</p>}

      <section id="edit-memory-book" className="manager-panel">
        <div className="manager-panel-heading"><p className="section-kicker">Memory book</p><h2>Dynamic memorial book</h2><p>The book is assembled automatically from the current Home, His life, Scientific legacy, and approved Memories content. Updating any of those sections updates the book the next time it is opened.</p><a className="manager-section-link" href="#copy-book">Edit Memory book cover & print labels ↓</a></div>
        <div className="manager-form manager-stack">
          <div className="manager-edit-card manager-book-sources">
            <strong>Included automatically</strong>
            <p><b>Home</b> — hero introduction, portrait, Earth-horizon artwork, Scientific legacy narrative highlights, shared enduring threads, and secondary scientific frontiers.</p>
            <p><b>His life</b> — full biography, education and career timeline, and mentorship reflection.</p>
            <p><b>Scientific legacy</b> — every career chapter, chapter photograph, key contributions, legacy statement, landmark publication, Robert’s reflections, community service, and honors. Edit the quotes and service text under Scientific Legacy headings & text.</p>
            <p><b>Memories</b> — every approved community memory, published photograph, PDF attachment, and shared public link.</p>
          </div>
          <a className="manager-primary manager-preview-book" href="/memory-book" target="_blank" rel="noopener noreferrer"><BookOpen size={18} /> Preview memory book</a>
        </div>
      </section>

      <section id="edit-style" className="manager-panel">
        <div className="manager-panel-heading"><p className="section-kicker">Site-wide settings</p><h2>Typography</h2><p>Choose the body and heading fonts used throughout the public memorial.</p></div>
        <div className="manager-form">
          <label>Body font<select value={contentValues.bodyFont} onChange={(e) => setContentValues({ ...contentValues, bodyFont: e.target.value })}><option value="system-sans">Clean sans serif</option><option value="humanist-sans">Humanist sans serif</option><option value="book-serif">Book serif</option></select></label>
          <label>Heading font<select value={contentValues.headingFont} onChange={(e) => setContentValues({ ...contentValues, headingFont: e.target.value })}><option value="classic-serif">Classic serif</option><option value="book-serif">Book serif</option><option value="modern-sans">Modern sans serif</option></select></label>
          <button type="button" className="manager-primary" disabled={busy} onClick={saveContent}><Save size={18} /> Save typography</button>
        </div>
      </section>

      <section id="edit-home" className="manager-panel">
        <div className="manager-panel-heading"><p className="section-kicker">Home</p><h2>Hero images</h2><p>Replace the homepage photograph and Earth-horizon artwork here. The homepage photograph can be displayed as either a landscape or portrait card.</p><a className="manager-section-link" href="#copy-home">Edit Home headings, buttons & labels ↓</a></div>
        <div className="manager-form manager-stack">
          {(["portrait", "horizon"] as const).map((assetId) => {
            const asset = contentValues.siteAssets[assetId];
            const label = assetId === "portrait" ? "Homepage photograph" : "Homepage horizon / background artwork";
            return <div className="manager-edit-card manager-asset-editor" key={assetId}>
              <strong>{label}</strong>
              <img className={`manager-image-preview ${assetId === "portrait" && asset.layout !== "portrait" ? "manager-image-preview-landscape" : ""}`} src={siteAssetSrc(assetId)} alt={asset.alt} />
              {assetId === "portrait" && <label>Homepage photo layout<select value={asset.layout === "portrait" ? "portrait" : "landscape"} onChange={(e) => updatePortraitLayout(e.target.value as "portrait" | "landscape")}><option value="landscape">Landscape</option><option value="portrait">Portrait</option></select><span>This changes the shape of the photo card on the homepage; it does not crop the uploaded file permanently.</span></label>}
              <label>Alt text<input value={asset.alt} onChange={(e) => updateSiteAssetAlt(assetId, e.target.value)} /></label>
              <form className="manager-photo-form manager-site-asset-form" onSubmit={(event) => uploadSiteAsset(event, assetId)}>
                <label>Replacement image <span>JPG, PNG, or WebP, up to 12 MB.</span><input name="file" type="file" accept="image/jpeg,image/png,image/webp" required /></label>
                <button className="manager-secondary" disabled={busy}><ImagePlus size={17} /> Upload replacement</button>
                {asset.objectKey && <button type="button" className="manager-danger" disabled={busy} onClick={() => resetSiteAsset(assetId)}>Restore original</button>}
              </form>
            </div>;
          })}
          <button type="button" className="manager-primary" disabled={busy} onClick={saveContent}><Save size={18} /> Save image settings</button>
        </div>
      </section>


      <section id="edit-home-story" className="manager-panel">
        <div className="manager-panel-heading"><p className="section-kicker">Home · Memory book</p><h2>Biography & homepage introduction</h2><a className="manager-section-link" href="#edit-life-photos">Manage biography & career photographs ↓</a><p>The complete biography is preserved in the Memory book; its first two paragraphs also appear on Home. His Life uses a separate short personal portrait beside the timeline.</p><a className="manager-section-link" href="#copy-life">Edit the His Life personal portrait ↓</a></div>
        <div className="manager-form">
          <label>Home — hero introduction<textarea rows={3} value={contentValues.heroIntro} onChange={(e) => setContentValues({ ...contentValues, heroIntro: e.target.value })} /></label>
          <label>Memory book — full biographical story <span>Separate paragraphs with a blank line. This is independent of the shorter His Life personal portrait.</span><textarea rows={18} value={contentValues.obituaryStory} onChange={(e) => setContentValues({ ...contentValues, obituaryStory: e.target.value })} /></label>
          <button type="button" className="manager-primary" disabled={busy} onClick={saveContent}><Save size={18} /> Save biography</button>
        </div>
      </section>

      <section id="edit-home-legacy" className="manager-panel manager-panel-wide">
        <div className="manager-panel-heading"><p className="section-kicker">Home</p><h2>Scientific legacy story</h2><p>The full-width heading sits above the introductory text and six-thread illustration. Home shows your editable frontier list beneath the illustration, then four editorial highlights. Edit the story here; the illustration is a fixed image, so changes to thread names below will need an updated image to match.</p><a className="manager-section-link" href="#edit-legacy-threads">Edit shared scientific threads & other frontiers ↓</a></div>
        <div className="manager-form manager-stack">
          <label>Home — Scientific Legacy introduction<textarea rows={5} value={contentValues.homeLegacyIntro} onChange={(e) => setContentValues({ ...contentValues, homeLegacyIntro: e.target.value })} /></label>
          <label>Other frontiers — homepage bullets <span>One bullet per line. Edit, add, remove, or reorder lines, then save the homepage scientific story.</span><textarea rows={7} value={contentValues.homeFrontierLabels.join("\n")} onChange={(e) => setContentValues({ ...contentValues, homeFrontierLabels: e.target.value.split("\n") })} /></label>
          <div className="manager-subcard">
            <h3>Major editorial highlights</h3>
            <p className="manager-help">These are the four large editorial rows beneath the six-thread illustration on Home.</p>
            {contentValues.homeLegacyCards.map((card, index) => <div className="manager-edit-card manager-home-legacy-card-editor" key={`card-${index}`}>
              <strong>Highlight {index + 1}</strong>
              <label>Heading<input value={card.title} onChange={(e) => updateHomeLegacyCard(index, "title", e.target.value)} /></label>
              <label>Text<textarea rows={5} value={card.text} onChange={(e) => updateHomeLegacyCard(index, "text", e.target.value)} /></label>
              <button type="button" className="manager-danger" onClick={() => removeHomeLegacyCard(index)}><Trash2 size={16} /> Remove highlight</button>
            </div>)}
            <button type="button" className="manager-secondary" onClick={addHomeLegacyCard}>Add highlight</button>
          </div>
          <button type="button" className="manager-primary" disabled={busy} onClick={saveContent}><Save size={18} /> Save homepage scientific story</button>
        </div>
      </section>

      <section id="edit-life-photos" className="manager-panel manager-panel-wide">
        <div className="manager-panel-heading"><p className="section-kicker">His Life</p><h2>Biography & career photographs</h2><p>Choose Early life to place photographs beside the biography, or select a career period for its timeline photo. Each period supports one photo. Dates and captions are optional and editable.</p><a className="manager-section-link" href="#copy-life">Edit the photo section heading ↓</a></div>
        <div className="manager-form manager-stack">
          {lifePhotos.map((photo) => <form className="manager-edit-card" key={photo.id + photo.objectKey} onSubmit={(event) => saveLifePhoto(event, photo.id)}>
            <img className="manager-image-preview" src={`/api/life-photos/${photo.objectKey.split("/").map(encodeURIComponent).join("/")}`} alt={photo.alt} />
            <label>Placement<select name="milestoneId" defaultValue={photo.milestoneId || ""}><option value="">Early life — beside biography</option>{contentValues.lifeMilestones.map((item, index) => <option key={item.id || index} value={item.id || `life-period-${index}`}>{item.title} · {item.year}</option>)}</select></label>
            <label>Date or period<input name="date" defaultValue={photo.date} placeholder="For example: circa 1955" maxLength={100} /></label>
            <label>Caption<textarea name="caption" rows={3} defaultValue={photo.caption} maxLength={2000} /></label>
            <label>Image description <span>Describe the photograph for visitors using screen readers.</span><input name="alt" defaultValue={photo.alt} maxLength={500} /></label>
            <label>Replace photograph <span>Optional. JPG, PNG, or WebP, up to 12 MB.</span><input name="file" type="file" accept="image/jpeg,image/png,image/webp" /></label>
            <button className="manager-primary" disabled={busy}><Save size={18} /> Save photograph</button>
            <button type="button" className="manager-danger" disabled={busy} onClick={() => deleteLifePhoto(photo.id)}><Trash2 size={16} /> Delete photograph</button>
          </form>)}
          <form className="manager-edit-card" onSubmit={(event) => saveLifePhoto(event)}>
            <h3>Add a photograph</h3><label>Placement<select name="milestoneId" defaultValue=""><option value="">Early life — beside biography</option>{contentValues.lifeMilestones.map((item, index) => <option key={item.id || index} value={item.id || `life-period-${index}`}>{item.title} · {item.year}</option>)}</select></label>
            <label>Photograph <span>JPG, PNG, or WebP, up to 12 MB.</span><input name="file" type="file" accept="image/jpeg,image/png,image/webp" required /></label>
            <label>Date or period<input name="date" placeholder="For example: Childhood in Minnesota" maxLength={100} /></label>
            <label>Caption<textarea name="caption" rows={3} maxLength={2000} /></label>
            <label>Image description<input name="alt" placeholder="Describe who and what appears in the photograph" maxLength={500} /></label>
            <button className="manager-primary" disabled={busy}><ImagePlus size={18} /> Add photograph</button>
          </form>
        </div>
      </section>

      <section id="edit-life" className="manager-panel">
        <div className="manager-panel-heading"><p className="section-kicker">His life</p><h2>Education & career timeline</h2><p>Keep this timeline concise: institutions, dates, degrees, and appointments. Describe research achievements under Scientific Legacy.</p><a className="manager-section-link" href="#copy-life">Edit His life headings & source links ↓</a></div>
        <div className="manager-form manager-stack">
          {contentValues.lifeMilestones.map((item, index) => <div className="manager-edit-card" key={index}><div className="manager-row"><label>Period<input value={item.year} onChange={(e) => updateMilestone(index, "year", e.target.value)} /></label><label>Institution / affiliation<input value={item.title} onChange={(e) => updateMilestone(index, "title", e.target.value)} /></label></div><label>Description<textarea rows={4} value={item.text} onChange={(e) => updateMilestone(index, "text", e.target.value)} /></label></div>)}
          <button type="button" className="manager-primary" disabled={busy} onClick={saveContent}><Save size={18} /> Save life timeline</button>
        </div>
      </section>

      <section id="edit-legacy" className="manager-panel manager-panel-wide">
        <div className="manager-panel-heading"><p className="section-kicker">Scientific legacy</p><h2>Scientific contributions</h2><p>Lead each chapter with its scientific question, contributions, and lasting impact. Institutions and dates provide context; appointment details belong in the His Life timeline. Photos and landmark publications remain editable here.</p><a className="manager-section-link" href="#copy-legacy">Edit Scientific legacy headings & labels ↓</a></div>
        <div className="manager-form manager-stack">
          {contentValues.legacyChapters.map((chapter, index) => <div className="manager-edit-card manager-chapter-editor" key={chapter.id}>
            <div className="manager-chapter-heading"><span>{chapter.number}</span><strong>{chapter.institution}</strong><small>{chapter.years}</small></div>
            <div className="manager-row"><label>Period<input value={chapter.years} onChange={(e) => updateChapter(index, { years: e.target.value })} /></label><label>Institution<input value={chapter.institution} onChange={(e) => updateChapter(index, { institution: e.target.value })} /></label></div>
            <label>Scientific focus<input value={chapter.scale} onChange={(e) => updateChapter(index, { scale: e.target.value })} /></label>
            <label>Chapter heading<input value={chapter.title} onChange={(e) => updateChapter(index, { title: e.target.value })} /></label>
            <label>Chapter summary<textarea rows={7} value={chapter.summary} onChange={(e) => updateChapter(index, { summary: e.target.value })} /></label>
            <label>Key contributions <span>One contribution per line.</span><textarea rows={7} value={chapter.contributions.join("\n")} onChange={(e) => updateChapter(index, { contributions: toLines(e.target.value) })} /></label>
            <label>Legacy statement<textarea rows={5} value={chapter.impact} onChange={(e) => updateChapter(index, { impact: e.target.value })} /></label>
            <label>Research threads <span>One label per line.</span><textarea rows={4} value={chapter.threads.join("\n")} onChange={(e) => updateChapter(index, { threads: toLines(e.target.value) })} /></label>

            <div className="manager-subcard">
              <h3>Chapter photograph</h3>
              {chapter.photo && <><img className="manager-image-preview" src={chapter.photo.objectKey ? `/api/chapter-photos/${chapter.photo.objectKey.split("/").map(encodeURIComponent).join("/")}` : `/${(chapter.photo.asset || "").replace(/^\//, "")}`} alt={chapter.photo.alt} /><label>Alt text<input value={chapter.photo.alt} onChange={(e) => updateChapter(index, { photo: { ...chapter.photo!, alt: e.target.value } })} /></label><label>Caption<textarea rows={3} value={chapter.photo.caption} onChange={(e) => updateChapter(index, { photo: { ...chapter.photo!, caption: e.target.value } })} /></label></>}
              <form className="manager-photo-form" onSubmit={(event) => uploadChapterPhoto(event, chapter.id)}><label><ImagePlus size={17} /> {chapter.photo ? "Replace photograph" : "Add photograph"}<input name="file" type="file" accept="image/jpeg,image/png,image/webp" required /></label><button className="manager-secondary" disabled={busy}>Upload photo</button>{chapter.photo && <button type="button" className="manager-danger" disabled={busy} onClick={() => removeChapterPhoto(chapter.id)}>Remove photo</button>}</form>
            </div>

            <div className="manager-subcard">
              <h3>Landmark Publication</h3>
              <p className="manager-help">One or more highlighted publications can appear beneath this chapter’s contribution bullets. The publication preview image is a built-in archival-style title card.</p>
              {chapterPublications(chapter).map((publication, publicationIndex) => <div className="manager-edit-card" key={`publication-${chapter.id}-${publicationIndex}`}>
                <div className="manager-row"><label>Year / edition<input value={publication.year} onChange={(e) => updateChapterPublication(index, publicationIndex, { year: e.target.value })} /></label><label>Citation<input value={publication.citation} onChange={(e) => updateChapterPublication(index, publicationIndex, { citation: e.target.value })} /></label></div>
                <label>Title<input value={publication.title} onChange={(e) => updateChapterPublication(index, publicationIndex, { title: e.target.value })} /></label>
                <label>Publication URL<input value={publication.url || ""} onChange={(e) => updateChapterPublication(index, publicationIndex, { url: e.target.value })} /></label>
                <label>Preview image path<input value={publication.image || ""} onChange={(e) => updateChapterPublication(index, publicationIndex, { image: e.target.value })} /></label>
                <label>Why it matters<textarea rows={4} value={publication.note} onChange={(e) => updateChapterPublication(index, publicationIndex, { note: e.target.value })} /></label>
                <button type="button" className="manager-text-button" onClick={() => removeChapterPublication(index, publicationIndex)}>Remove landmark publication</button>
              </div>)}
              <button type="button" className="manager-secondary" onClick={() => addChapterPublication(index)}>Add landmark publication</button>
            </div>
            <button type="button" className="manager-primary" disabled={busy} onClick={saveContent}><Save size={18} /> Save this chapter’s text</button>
          </div>)}
        </div>
      </section>

      <section id="edit-legacy-threads" className="manager-panel manager-panel-wide">
        <div className="manager-panel-heading"><p className="section-kicker">Scientific legacy</p><h2>Shared scientific landscape</h2><p>These research notes are retained for reference; their separate sections are no longer displayed on Scientific Legacy. The Home illustration shows the original six names as part of the image; update the artwork if you rename them. “Other frontiers” remain smaller supporting topics.</p><a className="manager-section-link" href="#copy-legacy">Edit Scientific Legacy section headings ↓</a></div>
        <div className="manager-form manager-stack">
          <div className="manager-subcard"><h3>Six enduring research threads</h3>
            {contentValues.legacyThreads.map((thread, index) => <div className="manager-edit-card" key={thread.id}><strong>Primary thread {index + 1}</strong><label>Thread title<input value={thread.title} onChange={(e) => updateLegacyThread(index, "title", e.target.value)} /></label><label>Description<textarea rows={3} value={thread.text} onChange={(e) => updateLegacyThread(index, "text", e.target.value)} /></label></div>)}
          </div>
          <div className="manager-subcard"><h3>Other scientific frontiers</h3><p className="manager-help">This fuller list is retained for reference and is no longer displayed on Scientific Legacy. Edit the homepage bullets separately under Scientific legacy story → Other frontiers — homepage bullets.</p>
            {contentValues.secondaryLegacyTopics.map((topic, index) => <div className="manager-edit-card manager-secondary-topic-editor" key={`secondary-${index}`}>
              <label>Topic<input value={topic.title} onChange={(e) => updateSecondaryLegacyTopic(index, "title", e.target.value)} /></label>
              <label>Short explanation<textarea rows={3} value={topic.text} onChange={(e) => updateSecondaryLegacyTopic(index, "text", e.target.value)} /></label>
              <button type="button" className="manager-danger" onClick={() => removeSecondaryLegacyTopic(index)}><Trash2 size={16} /> Remove topic</button>
            </div>)}
            <button type="button" className="manager-secondary" onClick={addSecondaryLegacyTopic}>Add frontier topic</button>
          </div>
          <button type="button" className="manager-primary" disabled={busy} onClick={saveContent}><Save size={18} /> Save shared scientific landscape</button>
        </div>
      </section>

      <section id="edit-honors" className="manager-panel">
        <div className="manager-panel-heading"><p className="section-kicker">Scientific legacy</p><h2>Honors, awards & recognition</h2><p>Edit the honors section shown at the end of the Scientific legacy page.</p></div>
        <div className="manager-form manager-stack">
          {contentValues.honors.map((honor, index) => <div className="manager-edit-card" key={index}><div className="manager-row"><label>Year<input value={honor.year} onChange={(e) => updateHonor(index, "year", e.target.value)} /></label><label>Honor / award<input value={honor.title} onChange={(e) => updateHonor(index, "title", e.target.value)} /></label></div><label>Institution / detail<input value={honor.detail} onChange={(e) => updateHonor(index, "detail", e.target.value)} /></label></div>)}
          <label>Recognition note<textarea rows={4} value={contentValues.honorsNote} onChange={(e) => setContentValues({ ...contentValues, honorsNote: e.target.value })} /></label>
          <button type="button" className="manager-primary" disabled={busy} onClick={saveContent}><Save size={18} /> Save honors</button>
        </div>
      </section>

      <section id="edit-events" className="manager-panel">
        <div className="manager-panel-heading"><p className="section-kicker">Events</p><h2>Memorial events</h2><p>Add or edit the services, gatherings, lectures, and scientific tributes listed on the Events page.</p><a className="manager-section-link" href="#copy-events">Edit Events headings & messages ↓</a></div>
        <form className="manager-form" onSubmit={addEvent}>
          <div className="manager-row"><label>Event title<input name="title" required /></label><label>Date and time<input name="startAt" type="datetime-local" required /></label></div>
          <label>Location<input name="location" placeholder="Venue, campus, or online" /></label>
          <label>Description<textarea name="description" rows={5} /></label>
          <div className="manager-row"><label>Link label<input name="linkLabel" placeholder="Register or view details" /></label><label>Event URL<input name="linkUrl" type="url" placeholder="https://…" /></label></div>
          <button className="manager-primary" disabled={busy}><CalendarPlus size={18} /> Add event</button>
        </form>
        <div className="manager-edit-list">
          {events.map((item) => <form className="manager-edit-card manager-form" key={item.id} onSubmit={addEvent}>
            <input type="hidden" name="id" value={item.id} />
            <div className="manager-row"><label>Event title<input name="title" defaultValue={item.title} required /></label><label>Date and time<input name="startAt" type="datetime-local" defaultValue={item.startAt.slice(0, 16)} required /></label></div>
            <label>Location<input name="location" defaultValue={item.location ?? ""} /></label>
            <label>Description<textarea name="description" rows={4} defaultValue={item.description ?? ""} /></label>
            <div className="manager-row"><label>Link label<input name="linkLabel" defaultValue={item.linkLabel ?? ""} /></label><label>Event URL<input name="linkUrl" type="url" defaultValue={item.linkUrl ?? ""} /></label></div>
            <div className="manager-inline-actions"><button className="manager-secondary" disabled={busy}><Save size={16} /> Save event</button><button type="button" className="manager-danger" onClick={() => remove("events", item.id)}><Trash2 size={16} /> Delete event</button></div>
          </form>)}
          {!events.length && <p>No events have been added.</p>}
        </div>
      </section>

      <section id="edit-gallery" className="manager-panel">
        <div className="manager-panel-heading"><p className="section-kicker">Gallery</p><h2>Photo & video gallery</h2><p>Add or edit the photographs, captions, and videos shown on the Gallery page. Include the photo’s year in its title (for example, Amazon, 1980s or Boston, 2020). The gallery automatically sorts oldest to newest, using a year in the caption if the title has none. Undated items appear last.</p><a className="manager-section-link" href="#copy-gallery">Edit Gallery headings & buttons ↓</a></div>
        <form className="manager-form" onSubmit={addMedia}>
          <label>Media type<select name="kind" defaultValue="image"><option value="image">Photo</option><option value="video">Video link</option></select></label>
          <label>Title<input name="title" required /></label>
          <label>Caption<textarea name="caption" rows={3} /></label>
          <label><ImagePlus size={18} /> Photo file<input name="file" type="file" accept="image/jpeg,image/png,image/webp" /></label>
          <label><Video size={18} /> YouTube or Vimeo URL<input name="externalUrl" type="url" placeholder="https://…" /></label>
          <button className="manager-primary" disabled={busy}><ImagePlus size={18} /> Add to gallery</button>
        </form>
        <div className="manager-edit-list">
          {media.map((item) => <form className="manager-edit-card manager-form manager-media-editor" key={item.id} onSubmit={addMedia}>
            <input type="hidden" name="id" value={item.id} />
            {item.kind === "image" && item.objectKey && <img className="manager-image-preview" src={`/api/gallery/photos/${item.objectKey.split("/").map(encodeURIComponent).join("/")}`} alt={item.title} />}
            <label>Media type<select name="kind" defaultValue={item.kind}><option value="image">Photo</option><option value="video">Video link</option></select></label>
            <label>Title<input name="title" defaultValue={item.title} required /></label>
            <label>Caption<textarea name="caption" rows={3} defaultValue={item.caption ?? ""} /></label>
            <label><ImagePlus size={18} /> Replace photo <span>Leave empty to keep the current image.</span><input name="file" type="file" accept="image/jpeg,image/png,image/webp" /></label>
            <label><Video size={18} /> YouTube or Vimeo URL<input name="externalUrl" type="url" defaultValue={item.externalUrl ?? ""} placeholder="https://…" /></label>
            <div className="manager-inline-actions"><button className="manager-secondary" disabled={busy}><Save size={16} /> Save media</button><button type="button" className="manager-danger" onClick={() => remove("media", item.id)}><Trash2 size={16} /> Delete media</button></div>
          </form>)}
          {!media.length && <p>No gallery items have been added.</p>}
        </div>

      </section>

      <section id="edit-memories" className="manager-panel manager-panel-wide">
        <div className="manager-panel-heading"><p className="section-kicker">Memories</p><h2>Voices & community memories</h2><p>Edit the curated scientist quotations shown near the top of the Memories page, along with the full published community memories below.</p><a className="manager-section-link" href="#copy-memories">Edit Memories headings, form labels & messages ↓</a></div>
        <div className="manager-form manager-stack">
          <div className="manager-subcard">
            <h3>Voices from the scientific community</h3>
            <p className="manager-help">These appear as a bulleted quotation list on the public Memories page. Edit the quotation and attribution directly, add new entries, or remove entries.</p>
            {contentValues.communityQuotes.map((item, index) => <div className="manager-edit-card manager-community-quote-editor" key={`community-quote-${index}`}>
              <label>Quotation<textarea rows={3} value={item.quote} onChange={(e) => updateCommunityQuote(index, "quote", e.target.value)} /></label>
              <label>Attribution<input value={item.attribution} onChange={(e) => updateCommunityQuote(index, "attribution", e.target.value)} /></label>
              <button type="button" className="manager-danger" onClick={() => removeCommunityQuote(index)}><Trash2 size={16} /> Remove quote</button>
            </div>)}
            <div className="manager-inline-actions"><button type="button" className="manager-secondary" onClick={addCommunityQuote}>Add quotation</button><button type="button" className="manager-primary" disabled={busy} onClick={saveContent}><Save size={18} /> Save quotations</button></div>
          </div>

          <div className="manager-subcard">
            <h3>Published community memories</h3>
            <div className="manager-edit-list">
              {publishedMemories.map((item) => <form className="manager-edit-card manager-form manager-published-memory" key={item.id} onSubmit={savePublishedMemory}>
                <input type="hidden" name="id" value={item.id} />
                {item.photoKey && <img className="manager-image-preview" src={`/api/photos/${item.photoKey.split("/").map(encodeURIComponent).join("/")}`} alt="" />}
                <div className="manager-row"><label>Name<input name="name" defaultValue={item.name} required /></label><label>Connection<input name="relationship" defaultValue={item.relationship} required /></label></div>
                <label>Memory title<input name="title" defaultValue={item.title} required /></label>
                <label>Memory text <span>May be blank when the memory has a PDF or public link.</span><textarea name="story" rows={7} defaultValue={item.story} /></label>
                <label>Public social-media or web post<input name="socialUrl" type="url" defaultValue={item.socialUrl ?? ""} placeholder="https://…" /></label>
                {item.pdfKey && <p className="manager-memory-attachment"><a href={`/api/memory-files/${item.pdfKey.split("/").map(encodeURIComponent).join("/")}`} target="_blank" rel="noopener noreferrer">Open PDF{item.pdfName ? ` · ${item.pdfName}` : ""} ↗</a></p>}
                <div className="manager-inline-actions"><button className="manager-secondary" disabled={busy}><Save size={16} /> Save memory</button><button type="button" className="manager-danger" onClick={() => removePublishedMemory(item.id, item.title, "text", Boolean(item.photoKey))}><FileX size={16} /> Delete memory entry</button>{item.photoKey && <button type="button" className="manager-danger" onClick={() => removePublishedMemory(item.id, item.title, "photo")}><ImageOff size={16} /> Delete photo</button>}{item.pdfKey && <button type="button" className="manager-danger" onClick={() => removePublishedMemory(item.id, item.title, "pdf")}><FileX size={16} /> Delete PDF</button>}{item.socialUrl && <button type="button" className="manager-danger" onClick={() => removePublishedMemory(item.id, item.title, "link")}><FileX size={16} /> Remove link</button>}<button type="button" className="manager-danger" onClick={() => removePublishedMemory(item.id, item.title, "all")}><Trash2 size={16} /> Delete all</button></div>
              </form>)}
              {!publishedMemories.length && <p>No memories are currently published.</p>}
            </div>
          </div>
        </div>
      </section>


      <section id="edit-tree-content" className="manager-panel">
        <div className="manager-panel-heading"><p className="section-kicker">Living tribute</p><h2>Restoration projects</h2><p>Edit the two narrative paragraphs used in the featured Chippewa National Forest section. The researched regional project cards and their official donation/source links are maintained in the site code; headings, guidance, FAQ text, and buttons remain editable below.</p><a className="manager-section-link" href="#copy-tree">Edit Living tribute headings, guidance & FAQ ↓</a></div>
        <div className="manager-form">
          <label>Minnesota connection — tribute text<textarea rows={5} value={contentValues.treeTribute} onChange={(e) => setContentValues({ ...contentValues, treeTribute: e.target.value })} /></label>
          <label>Chippewa project — restoration details<textarea rows={5} value={contentValues.treeDetail} onChange={(e) => setContentValues({ ...contentValues, treeDetail: e.target.value })} /></label>
          <button type="button" className="manager-primary" disabled={busy} onClick={saveContent}><Save size={18} /> Save Living tribute text</button>
        </div>
      </section>

      <section id="edit-all-copy" className="manager-panel manager-panel-wide">
        <div className="manager-panel-heading"><p className="section-kicker">Page headings, labels & buttons</p><h2>Text organized by public page</h2><p>Use the same page names as the public memorial. Open a page below to edit its headings, buttons, navigation labels, form labels, and other interface text.</p></div>
        <div className="manager-form manager-stack manager-copy-groups">
          {copyGroups.map((group) => {
            const entries = Object.entries(contentValues.pageCopy).filter(([key]) => group.prefix.some((prefix) => key.startsWith(prefix)) && !/^legacy\.(?:scale|threads|frontiers)/.test(key) && key !== "legacy.heroTitle");
            return <details className="manager-copy-group" id={group.id} key={group.id} open={group.id === "copy-home"}>
              <summary><span>{group.page}</span><strong>{group.title}</strong><small>{entries.length} editable text fields</small></summary>
              <div className="manager-copy-group-body">
                {entries.map(([key, value]) => {
                  const isUrl = key.toLowerCase().endsWith("url");
                  const longValue = value.length > 90 || /(?:Text|Intro|Message|Subtitle|Note|Caption|Story)$/i.test(key);
                  return <div className="manager-copy-row" key={key}>
                    <label><span className="manager-copy-label">{copyFieldLabel(key)}</span><small className="manager-copy-key">{key}</small>
                      {longValue && !isUrl
                        ? <textarea rows={Math.min(6, Math.max(2, Math.ceil(value.length / 70)))} value={value} onChange={(e) => updatePageCopy(key, e.target.value)} />
                        : <input type={isUrl ? "url" : "text"} value={value} onChange={(e) => updatePageCopy(key, e.target.value)} />}
                    </label>
                  </div>;
                })}
              </div>
            </details>;
          })}
          <button type="button" className="manager-primary" disabled={busy} onClick={saveContent}><Save size={18} /> Save page headings & labels</button>
        </div>
      </section>


      {owner && <section id="edit-access" className="manager-panel">
        <div className="manager-panel-heading"><p className="section-kicker">Family & trusted editors</p><h2>Manage editor access</h2><p>Editors can update text, events, gallery items, scientific chapters, and chapter photographs. Only you can add or remove editors.</p></div>
        <form className="manager-form" onSubmit={addEditor}>
          <div className="manager-row"><label>Name<input name="displayName" placeholder="Family member or editor" /></label><label>Email address<input name="email" type="email" required placeholder="name@example.com" /></label></div>
          <button className="manager-primary" disabled={busy}><Save size={18} /> Grant editor access</button>
        </form>
        <div className="manager-items">
          {editors.map((editor) => <article key={editor.email}><div><strong>{editor.displayName || editor.email}</strong><span>{editor.email}</span></div><button onClick={() => removeEditor(editor.email)} aria-label={`Remove editor access for ${editor.email}`}><Trash2 size={17} /></button></article>)}
          {!editors.length && <p>No additional editors have been added.</p>}
        </div>
      </section>}
    </div>
  );
}
