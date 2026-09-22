"use client";

import { FormEvent, useState } from "react";
import { CalendarPlus, FileX, ImageOff, ImagePlus, Save, Trash2, Video } from "lucide-react";
import type { GalleryItem, LegacyChapter, MemorialEvent, SiteContent } from "../site-data";

type MemorialEditor = { email: string; displayName: string | null; createdAt: string };
type PublishedMemory = { id: number; name: string; title: string; photoKey: string | null };

async function responseData(response: Response) {
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Unable to save this change.");
  return data;
}

const toLines = (value: string) => value.split(/\n/).map((item) => item.trim()).filter(Boolean);

export default function Manager({ content, events, media, publishedMemories, editors, owner }: { content: SiteContent; events: MemorialEvent[]; media: GalleryItem[]; publishedMemories: PublishedMemory[]; editors: MemorialEditor[]; owner: boolean }) {
  const [contentValues, setContentValues] = useState(content);
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

  function updateSiteAssetAlt(assetId: "portrait" | "horizon", value: string) {
    setContentValues((current) => ({
      ...current,
      siteAssets: { ...current.siteAssets, [assetId]: { ...current.siteAssets[assetId], alt: value } },
    }));
  }

  function siteAssetSrc(assetId: "portrait" | "horizon") {
    const asset = contentValues.siteAssets[assetId];
    if (asset.objectKey) return `/api/site-assets/${asset.objectKey.split("/").map(encodeURIComponent).join("/")}`;
    return `/${asset.asset.replace(/^\//, "")}`;
  }

  async function uploadSiteAsset(event: FormEvent<HTMLFormElement>, assetId: "portrait" | "horizon") {
    event.preventDefault(); setBusy(true); setMessage("");
    try {
      await responseData(await fetch("/api/admin/content", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ values: contentValues }) }));
      const form = new FormData(event.currentTarget);
      form.set("assetId", assetId);
      await responseData(await fetch("/api/admin/site-asset", { method: "POST", body: form }));
      window.location.reload();
    } catch (error) { setMessage(error instanceof Error ? error.message : "Please try again."); setBusy(false); }
  }

  async function resetSiteAsset(assetId: "portrait" | "horizon") {
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

  function updateTopic(index: number, field: "title" | "note", value: string) {
    setContentValues((current) => ({ ...current, homeLegacyTopics: current.homeLegacyTopics.map((item, itemIndex) => itemIndex === index ? { ...item, [field]: value } : item) }));
  }

  function updateHomeLegacyCard(index: number, field: "title" | "text", value: string) {
    setContentValues((current) => ({ ...current, homeLegacyCards: current.homeLegacyCards.map((item, itemIndex) => itemIndex === index ? { ...item, [field]: value } : item) }));
  }

  function updateLegacyThread(index: number, field: "title" | "text", value: string) {
    setContentValues((current) => ({ ...current, legacyThreads: current.legacyThreads.map((item, itemIndex) => itemIndex === index ? { ...item, [field]: value } : item) }));
  }

  function updateHonor(index: number, field: "year" | "title" | "detail", value: string) {
    setContentValues((current) => ({ ...current, honors: current.honors.map((item, itemIndex) => itemIndex === index ? { ...item, [field]: value } : item) }));
  }

  function updateChapter(index: number, patch: Partial<LegacyChapter>) {
    setContentValues((current) => ({ ...current, legacyChapters: current.legacyChapters.map((item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item) }));
  }

  async function uploadChapterPhoto(event: FormEvent<HTMLFormElement>, chapterId: string) {
    event.preventDefault(); setBusy(true); setMessage("");
    try {
      await responseData(await fetch("/api/admin/content", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ values: contentValues }) }));
      const form = new FormData(event.currentTarget);
      form.set("chapterId", chapterId);
      await responseData(await fetch("/api/admin/chapter-photo", { method: "POST", body: form }));
      window.location.reload();
    } catch (error) { setMessage(error instanceof Error ? error.message : "Please try again."); setBusy(false); }
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

  async function removePublishedMemory(id: number, title: string, mode: "text" | "photo" | "all", hasPhoto = true) {
    const warning = mode === "text"
      ? hasPhoto ? `Delete only the text for “${title}”? Its photo will be preserved in the public gallery.` : `Permanently delete the text-only memory “${title}”?`
      : mode === "photo" ? `Delete only the photo attached to “${title}”? The memory text will remain published.`
      : `Permanently delete “${title}”? Its memory text and attached photo will both be removed from the public memorial.`;
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

      <section id="edit-style" className="manager-panel">
        <div className="manager-panel-heading"><p className="section-kicker">Typography</p><h2>Edit the site fonts</h2><p>Choose the body and display typefaces used across the public memorial.</p></div>
        <div className="manager-form">
          <label>Body font<select value={contentValues.bodyFont} onChange={(e) => setContentValues({ ...contentValues, bodyFont: e.target.value })}><option value="system-sans">Clean sans serif</option><option value="humanist-sans">Humanist sans serif</option><option value="book-serif">Book serif</option></select></label>
          <label>Heading font<select value={contentValues.headingFont} onChange={(e) => setContentValues({ ...contentValues, headingFont: e.target.value })}><option value="classic-serif">Classic serif</option><option value="book-serif">Book serif</option><option value="modern-sans">Modern sans serif</option></select></label>
          <button type="button" className="manager-primary" disabled={busy} onClick={saveContent}><Save size={18} /> Save typography</button>
        </div>
      </section>

      <section id="edit-images" className="manager-panel">
        <div className="manager-panel-heading"><p className="section-kicker">Site images</p><h2>Edit homepage & book images</h2><p>The homepage headshot and horizon artwork are now managed here and reused wherever they appear, including the memory book.</p></div>
        <div className="manager-form manager-stack">
          {(["portrait", "horizon"] as const).map((assetId) => {
            const asset = contentValues.siteAssets[assetId];
            const label = assetId === "portrait" ? "Homepage headshot / portrait" : "Homepage horizon / background artwork";
            return <div className="manager-edit-card manager-asset-editor" key={assetId}>
              <strong>{label}</strong>
              <img className="manager-image-preview" src={siteAssetSrc(assetId)} alt={asset.alt} />
              <label>Alt text<input value={asset.alt} onChange={(e) => updateSiteAssetAlt(assetId, e.target.value)} /></label>
              <form className="manager-photo-form" onSubmit={(event) => uploadSiteAsset(event, assetId)}>
                <label><ImagePlus size={17} /> Replace image<input name="file" type="file" accept="image/jpeg,image/png,image/webp" required /></label>
                <button className="manager-secondary" disabled={busy}>Upload replacement</button>
                {asset.objectKey && <button type="button" className="manager-danger" disabled={busy} onClick={() => resetSiteAsset(assetId)}>Restore original</button>}
              </form>
            </div>;
          })}
          <button type="button" className="manager-primary" disabled={busy} onClick={saveContent}><Save size={18} /> Save image text</button>
        </div>
      </section>

      <section id="edit-all-copy" className="manager-panel manager-panel-wide">
        <div className="manager-panel-heading"><p className="section-kicker">All page text</p><h2>Edit every interface label & page heading</h2><p>This is the complete text registry for navigation, homepage headings, His Life, Scientific Legacy labels, Events, Gallery, Memories, the tree page, and the memory book. Changes are shared by the public site and private preview.</p></div>
        <div className="manager-form manager-stack">
          {Object.entries(contentValues.pageCopy).map(([key, value]) => {
            const isUrl = key.toLowerCase().endsWith("url");
            const longValue = value.length > 90 || /(?:Text|Intro|Message|Subtitle|Note|Caption)$/i.test(key);
            return <div className="manager-copy-row" key={key}>
              <label><span className="manager-copy-key">{key}</span>
                {longValue && !isUrl
                  ? <textarea rows={Math.min(6, Math.max(2, Math.ceil(value.length / 70)))} value={value} onChange={(e) => updatePageCopy(key, e.target.value)} />
                  : <input type={isUrl ? "url" : "text"} value={value} onChange={(e) => updatePageCopy(key, e.target.value)} />}
              </label>
            </div>;
          })}
          <button type="button" className="manager-primary" disabled={busy} onClick={saveContent}><Save size={18} /> Save all page text</button>
        </div>
      </section>

      <section id="edit-story" className="manager-panel">
        <div className="manager-panel-heading"><p className="section-kicker">Memorial text</p><h2>Edit the story</h2><p>These fields are shared by the homepage and His Life page.</p></div>
        <div className="manager-form">
          <label>Homepage introduction<textarea rows={3} value={contentValues.heroIntro} onChange={(e) => setContentValues({ ...contentValues, heroIntro: e.target.value })} /></label>
          <label>Full biographical story <span>Separate paragraphs with a blank line.</span><textarea rows={18} value={contentValues.obituaryStory} onChange={(e) => setContentValues({ ...contentValues, obituaryStory: e.target.value })} /></label>
          <label>Tree tribute<textarea rows={4} value={contentValues.treeTribute} onChange={(e) => setContentValues({ ...contentValues, treeTribute: e.target.value })} /></label>
          <label>Forest project details<textarea rows={4} value={contentValues.treeDetail} onChange={(e) => setContentValues({ ...contentValues, treeDetail: e.target.value })} /></label>
          <button type="button" className="manager-primary" disabled={busy} onClick={saveContent}><Save size={18} /> Save story text</button>
        </div>
      </section>

      <section id="edit-home-legacy" className="manager-panel">
        <div className="manager-panel-heading"><p className="section-kicker">Homepage</p><h2>Scientific legacy network</h2><p>Edit the five connected themes shown on the homepage.</p></div>
        <div className="manager-form manager-stack">
          <label>Introductory text<textarea rows={5} value={contentValues.homeLegacyIntro} onChange={(e) => setContentValues({ ...contentValues, homeLegacyIntro: e.target.value })} /></label>
          {contentValues.homeLegacyTopics.map((topic, index) => <div className="manager-edit-card" key={`topic-${index}`}><strong>Network theme {index + 1}</strong><label>Title<input value={topic.title} onChange={(e) => updateTopic(index, "title", e.target.value)} /></label><label>Supporting line<input value={topic.note} onChange={(e) => updateTopic(index, "note", e.target.value)} /></label></div>)}
          {contentValues.homeLegacyCards.map((card, index) => <div className="manager-edit-card" key={`card-${index}`}><strong>Homepage summary card {index + 1}</strong><label>Heading<input value={card.title} onChange={(e) => updateHomeLegacyCard(index, "title", e.target.value)} /></label><label>Text<textarea rows={3} value={card.text} onChange={(e) => updateHomeLegacyCard(index, "text", e.target.value)} /></label></div>)}
          <button type="button" className="manager-primary" disabled={busy} onClick={saveContent}><Save size={18} /> Save homepage legacy</button>
        </div>
      </section>

      <section id="edit-life" className="manager-panel">
        <div className="manager-panel-heading"><p className="section-kicker">His Life</p><h2>Education & affiliations</h2><p>Edit the periods and affiliations. These now follow Robert’s CV from Harvard through UCLA.</p></div>
        <div className="manager-form manager-stack">
          {contentValues.lifeMilestones.map((item, index) => <div className="manager-edit-card" key={index}><div className="manager-row"><label>Period<input value={item.year} onChange={(e) => updateMilestone(index, "year", e.target.value)} /></label><label>Institution / affiliation<input value={item.title} onChange={(e) => updateMilestone(index, "title", e.target.value)} /></label></div><label>Description<textarea rows={4} value={item.text} onChange={(e) => updateMilestone(index, "text", e.target.value)} /></label></div>)}
          <button type="button" className="manager-primary" disabled={busy} onClick={saveContent}><Save size={18} /> Save life timeline</button>
        </div>
      </section>

      <section id="edit-legacy" className="manager-panel manager-panel-wide">
        <div className="manager-panel-heading"><p className="section-kicker">Scientific legacy</p><h2>Edit career chapters</h2><p>Every chapter is driven by these fields. Text, labels, publication details, captions, and photographs all flow directly to the public site.</p></div>
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
              <h3>Landmark publication</h3>
              {chapter.publication ? <><div className="manager-row"><label>Year<input value={chapter.publication.year} onChange={(e) => updateChapter(index, { publication: { ...chapter.publication!, year: e.target.value } })} /></label><label>Citation<input value={chapter.publication.citation} onChange={(e) => updateChapter(index, { publication: { ...chapter.publication!, citation: e.target.value } })} /></label></div><label>Title<input value={chapter.publication.title} onChange={(e) => updateChapter(index, { publication: { ...chapter.publication!, title: e.target.value } })} /></label><label>Why it matters<textarea rows={4} value={chapter.publication.note} onChange={(e) => updateChapter(index, { publication: { ...chapter.publication!, note: e.target.value } })} /></label><button type="button" className="manager-text-button" onClick={() => updateChapter(index, { publication: null })}>Remove landmark publication</button></> : <button type="button" className="manager-secondary" onClick={() => updateChapter(index, { publication: { year: "", title: "", citation: "", note: "" } })}>Add landmark publication</button>}
            </div>
            <button type="button" className="manager-primary" disabled={busy} onClick={saveContent}><Save size={18} /> Save this chapter’s text</button>
          </div>)}
        </div>
      </section>

      <section id="edit-legacy-threads" className="manager-panel">
        <div className="manager-panel-heading"><p className="section-kicker">Scientific legacy</p><h2>Enduring research threads</h2><p>Edit every research-thread heading and description shown beneath the career chapters.</p></div>
        <div className="manager-form manager-stack">
          {contentValues.legacyThreads.map((thread, index) => <div className="manager-edit-card" key={`thread-${index}`}><label>Thread title<input value={thread.title} onChange={(e) => updateLegacyThread(index, "title", e.target.value)} /></label><label>Description<textarea rows={3} value={thread.text} onChange={(e) => updateLegacyThread(index, "text", e.target.value)} /></label></div>)}
          <button type="button" className="manager-primary" disabled={busy} onClick={saveContent}><Save size={18} /> Save research threads</button>
        </div>
      </section>

      <section id="edit-honors" className="manager-panel">
        <div className="manager-panel-heading"><p className="section-kicker">Scientific legacy</p><h2>Honors & awards</h2><p>Edit the complete honors list shown at the end of the Scientific Legacy page.</p></div>
        <div className="manager-form manager-stack">
          {contentValues.honors.map((honor, index) => <div className="manager-edit-card" key={index}><div className="manager-row"><label>Year<input value={honor.year} onChange={(e) => updateHonor(index, "year", e.target.value)} /></label><label>Honor / award<input value={honor.title} onChange={(e) => updateHonor(index, "title", e.target.value)} /></label></div><label>Institution / detail<input value={honor.detail} onChange={(e) => updateHonor(index, "detail", e.target.value)} /></label></div>)}
          <label>Recognition note<textarea rows={4} value={contentValues.honorsNote} onChange={(e) => setContentValues({ ...contentValues, honorsNote: e.target.value })} /></label>
          <button type="button" className="manager-primary" disabled={busy} onClick={saveContent}><Save size={18} /> Save honors</button>
        </div>
      </section>

      <section id="edit-events" className="manager-panel">
        <div className="manager-panel-heading"><p className="section-kicker">Events</p><h2>Add an event</h2><p>Events are displayed chronologically on the memorial site.</p></div>
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
        <div className="manager-panel-heading"><p className="section-kicker">Gallery</p><h2>Add and manage photos and videos</h2><p>Upload photographs directly, add a YouTube or Vimeo link, or remove published media below.</p></div>
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

        <div className="manager-subsection">
          <div className="manager-panel-heading"><h3>Published memories</h3><p>Remove only the text, only the attached photo, or permanently delete the complete contribution.</p></div>
          <div className="manager-items">
            {publishedMemories.map((item) => <article key={item.id}>{item.photoKey && <img className="manager-memory-thumb" src={`/api/photos/${item.photoKey.split("/").map(encodeURIComponent).join("/")}`} alt="" />}<div><strong>{item.title}</strong><span>Shared by {item.name} · {item.photoKey ? "Includes photo" : "Text only"}</span></div><div className="manager-actions"><button onClick={() => removePublishedMemory(item.id, item.title, "text", Boolean(item.photoKey))} aria-label={`Delete only the text for ${item.title}`} title="Delete text only"><FileX size={17} /><b>Text only</b></button>{item.photoKey && <button onClick={() => removePublishedMemory(item.id, item.title, "photo")} aria-label={`Delete only the photo attached to ${item.title}`} title="Delete photo only"><ImageOff size={17} /><b>Photo only</b></button>}{item.photoKey && <button onClick={() => removePublishedMemory(item.id, item.title, "all")} aria-label={`Delete published memory ${item.title}`} title="Delete text and photo"><Trash2 size={17} /><b>Text + photo</b></button>}</div></article>)}
            {!publishedMemories.length && <p>No memories are currently published.</p>}
          </div>
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
