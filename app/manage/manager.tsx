"use client";

import { FormEvent, useState } from "react";
import { CalendarPlus, ImagePlus, Save, Trash2, Video } from "lucide-react";
import type { GalleryItem, MemorialEvent } from "../site-data";

type EditableContent = { heroIntro: string; obituaryStory: string; treeTribute: string; treeDetail: string };
type MemorialEditor = { email: string; displayName: string | null; createdAt: string };

async function responseData(response: Response) {
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Unable to save this change.");
  return data;
}

export default function Manager({ content, events, media, editors, owner }: { content: EditableContent; events: MemorialEvent[]; media: GalleryItem[]; editors: MemorialEditor[]; owner: boolean }) {
  const [contentValues, setContentValues] = useState(content);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function saveContent(event: FormEvent) {
    event.preventDefault(); setBusy(true); setMessage("");
    try {
      await responseData(await fetch("/api/admin/content", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ values: contentValues }) }));
      setMessage("Memorial text saved.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Please try again."); }
    finally { setBusy(false); }
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
      await responseData(await fetch("/api/admin/editors", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(Object.fromEntries(form.entries())) }));
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

  return (
    <div className="manager-grid">
      {message && <p className="manager-message" role="status">{message}</p>}

      <section id="edit-story" className="manager-panel">
        <div className="manager-panel-heading"><p className="section-kicker">Memorial text</p><h2>Edit the story</h2><p>Changes appear on the main memorial page after you save.</p></div>
        <form className="manager-form" onSubmit={saveContent}>
          <label>Homepage introduction<textarea rows={3} value={contentValues.heroIntro} onChange={(e) => setContentValues({ ...contentValues, heroIntro: e.target.value })} /></label>
          <label>Full obituary story <span>Separate paragraphs with a blank line.</span><textarea rows={18} value={contentValues.obituaryStory} onChange={(e) => setContentValues({ ...contentValues, obituaryStory: e.target.value })} /></label>
          <label>Tree tribute<textarea rows={4} value={contentValues.treeTribute} onChange={(e) => setContentValues({ ...contentValues, treeTribute: e.target.value })} /></label>
          <label>Forest project details<textarea rows={4} value={contentValues.treeDetail} onChange={(e) => setContentValues({ ...contentValues, treeDetail: e.target.value })} /></label>
          <button className="manager-primary" disabled={busy}><Save size={18} /> Save text changes</button>
        </form>
      </section>

      <section id="edit-events" className="manager-panel">
        <div className="manager-panel-heading"><p className="section-kicker">Events</p><h2>Add an event</h2><p>Events are displayed chronologically on the memorial homepage.</p></div>
        <form className="manager-form" onSubmit={addEvent}>
          <div className="manager-row"><label>Event title<input name="title" required /></label><label>Date and time<input name="startAt" type="datetime-local" required /></label></div>
          <label>Location<input name="location" placeholder="Venue, campus, or online" /></label>
          <label>Description<textarea name="description" rows={5} /></label>
          <div className="manager-row"><label>Link label<input name="linkLabel" placeholder="Register or view details" /></label><label>Event URL<input name="linkUrl" type="url" placeholder="https://…" /></label></div>
          <button className="manager-primary" disabled={busy}><CalendarPlus size={18} /> Add event</button>
        </form>
        <div className="manager-items">
          {events.map((item) => <article key={item.id}><div><strong>{item.title}</strong><span>{new Date(item.startAt).toLocaleString()}</span></div><button onClick={() => remove("events", item.id)} aria-label={`Remove ${item.title}`}><Trash2 size={17} /></button></article>)}
          {!events.length && <p>No events have been added.</p>}
        </div>
      </section>

      <section id="edit-gallery" className="manager-panel">
        <div className="manager-panel-heading"><p className="section-kicker">Gallery</p><h2>Add photos and videos</h2><p>Upload photographs directly, or add a YouTube or Vimeo link.</p></div>
        <form className="manager-form" onSubmit={addMedia}>
          <label>Media type<select name="kind" defaultValue="image"><option value="image">Photo</option><option value="video">Video link</option></select></label>
          <label>Title<input name="title" required /></label>
          <label>Caption<textarea name="caption" rows={3} /></label>
          <label><ImagePlus size={18} /> Photo file<input name="file" type="file" accept="image/jpeg,image/png,image/webp" /></label>
          <label><Video size={18} /> YouTube or Vimeo URL<input name="externalUrl" type="url" placeholder="https://…" /></label>
          <button className="manager-primary" disabled={busy}><ImagePlus size={18} /> Add to gallery</button>
        </form>
        <div className="manager-items">
          {media.map((item) => <article key={item.id}><div><strong>{item.title}</strong><span>{item.kind === "image" ? "Photo" : "Video"}</span></div><button onClick={() => remove("media", item.id)} aria-label={`Remove ${item.title}`}><Trash2 size={17} /></button></article>)}
          {!media.length && <p>No gallery items have been added.</p>}
        </div>
      </section>

      {owner && <section id="edit-access" className="manager-panel">
        <div className="manager-panel-heading"><p className="section-kicker">Family & trusted editors</p><h2>Manage editor access</h2><p>Editors can update text, events, and gallery items. Only you can approve or reject submitted memories.</p></div>
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
