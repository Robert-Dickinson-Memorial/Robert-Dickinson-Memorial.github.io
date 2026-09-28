"use client";

import { FormEvent, useState } from "react";

const projects = ["Chippewa National Forest", "Amazon rainforest", "Arizona", "Georgia", "Texas", "Colorado", "California", "Massachusetts & New England"];

export default function DedicationForm() {
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    setBusy(true); setMessage("");
    try {
      const response = await fetch("/api/participation", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: data.get("name"), email: data.get("email"), project: data.get("project"),
          confirmed: data.get("confirmed") === "on", website: data.get("website"),
        }),
      });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error || "Unable to record the dedication.");
      form.reset();
      setMessage("Thank you. Your dedication has been submitted for review. The contributor count will update after approval.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Please try again."); }
    finally { setBusy(false); }
  }

  return <form className="tree-dedication-form" onSubmit={submit}>
    <div className="tree-dedication-fields">
      <label>Your name<input name="name" required minLength={2} maxLength={100} autoComplete="name" /></label>
      <label>Project supported<select name="project" required defaultValue=""><option value="" disabled>Choose a project</option>{projects.map((project) => <option key={project}>{project}</option>)}</select></label>
      <label>Email <small>(optional, kept private)</small><input name="email" type="email" maxLength={200} autoComplete="email" /></label>
    </div>
    <label className="tree-dedication-confirm"><input type="checkbox" name="confirmed" required /> I made a dedication through the selected organization in Robert’s memory.</label>
    <label className="form-honeypot" aria-hidden="true">Website<input name="website" tabIndex={-1} autoComplete="off" /></label>
    <button type="submit" disabled={busy}>{busy ? "Submitting…" : "Record my dedication"}</button>
    {message && <p role="status" className="tree-dedication-message">{message}</p>}
  </form>;
}
