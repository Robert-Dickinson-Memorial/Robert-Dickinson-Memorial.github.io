"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { Check, ImagePlus, Send } from "lucide-react";

declare global {
  interface Document {
    modelContext?: { registerTool?: (tool: unknown, options?: { signal?: AbortSignal }) => void | Promise<void> };
  }
}

type Status = "idle" | "sending" | "success" | "error";

async function submitMemory(input: { name: string; relationship: string; email?: string; title: string; story: string }) {
  const response = await fetch("/api/memories", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(input),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Unable to submit this memory.");
  return data;
}

export default function ContributionForm({ copy }: { copy: Record<string, string> }) {
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    const context = document.modelContext;
    if (!context?.registerTool) return;
    const lifecycle = new AbortController();
    try {
      void Promise.resolve(context.registerTool({
        name: "submit_memorial_memory",
        title: "Submit memorial memory",
        description: "Submit a written memory for review before it appears on the memorial site.",
        inputSchema: {
          type: "object",
          properties: {
            name: { type: "string", minLength: 2 },
            relationship: { type: "string", minLength: 2 },
            email: { type: "string" },
            title: { type: "string", minLength: 2 },
            story: { type: "string", minLength: 20 },
          },
          required: ["name", "relationship", "title", "story"],
          additionalProperties: false,
        },
        annotations: { readOnlyHint: false, untrustedContentHint: true },
        execute: async (input: unknown) => submitMemory(input as Parameters<typeof submitMemory>[0]),
      }, { signal: lifecycle.signal })).catch(() => undefined);
    } catch {
      // The visible form remains fully functional in browsers without WebMCP.
    }
    return () => lifecycle.abort();
  }, []);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("sending");
    setMessage("");
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/memories", { method: "POST", body: form });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to submit this memory.");
      setStatus("success");
      setMessage(copy["memories.successMessage"]);
      formRef.current?.reset();
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : copy["memories.formError"]);
    }
  }

  if (status === "success") {
    return (
      <div className="success-card" role="status">
        <span><Check size={30} aria-hidden="true" /></span>
        <h3>{copy["memories.successTitle"]}</h3>
        <p>{message}</p>
        <button type="button" onClick={() => setStatus("idle")}>{copy["memories.shareAnother"]}</button>
      </div>
    );
  }

  return (
    <form ref={formRef} className="memory-form" onSubmit={onSubmit}>
      <div className="field-row">
        <label>{copy["memories.formName"]}<input name="name" required minLength={2} maxLength={100} placeholder={copy["memories.formNamePlaceholder"]} /></label>
        <label>{copy["memories.formRelationship"]}<input name="relationship" required maxLength={120} placeholder={copy["memories.formRelationshipPlaceholder"]} /></label>
      </div>
      <label>{copy["memories.formEmail"]} <span>{copy["memories.formEmailNote"]}</span><input name="email" type="email" maxLength={200} placeholder={copy["memories.formEmailPlaceholder"]} /></label>
      <label>{copy["memories.formTitle"]}<input name="title" required minLength={2} maxLength={160} placeholder={copy["memories.formTitlePlaceholder"]} /></label>
      <label>{copy["memories.formStory"]}<textarea name="story" required minLength={20} maxLength={6000} rows={7} placeholder={copy["memories.formStoryPlaceholder"]} /></label>
      <label className="photo-field">
        <ImagePlus size={22} aria-hidden="true" />
        <span><strong>{copy["memories.formPhoto"]}</strong><small>{copy["memories.formPhotoHelp"]}</small></span>
        <input name="photo" type="file" accept="image/jpeg,image/png,image/webp" />
      </label>
      <label className="consent-field">
        <input name="consent" type="checkbox" required />
        <span>{copy["memories.formConsent"]}</span>
      </label>
      <button className="submit-button" type="submit" disabled={status === "sending"}>
        {status === "sending" ? copy["memories.formSending"] : copy["memories.formSubmit"]} <Send size={17} aria-hidden="true" />
      </button>
      {status === "error" && <p className="form-error" role="alert">{message}</p>}
    </form>
  );
}
