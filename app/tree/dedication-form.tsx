"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

const contributionRoutes = [
  { id: "chippewa-arbor-day", label: "Chippewa · Arbor Day Foundation", type: "tree" },
  { id: "chippewa-living-tribute", label: "Chippewa · A Living Tribute", type: "tree" },
  { id: "chippewa-usda", label: "Chippewa · USDA Forest Service restoration gift", type: "restoration" },
  { id: "amazon-tree-nation", label: "Amazon · Tree-Nation / Rioterra", type: "tree" },
  { id: "amazon-conservation", label: "Amazon · Amazon Conservation restoration gift", type: "restoration" },
  { id: "arizona-living-tribute", label: "Arizona · A Living Tribute", type: "tree" },
  { id: "georgia-living-tribute", label: "Georgia · A Living Tribute", type: "tree" },
  { id: "texas-living-tribute", label: "Texas · A Living Tribute", type: "tree" },
  { id: "colorado-csfs", label: "Colorado · Colorado State Forest Service", type: "tree" },
  { id: "california-living-tribute", label: "California · A Living Tribute", type: "tree" },
  { id: "massachusetts-esplanade", label: "Massachusetts · Esplanade Association", type: "tree" },
  { id: "new-england-neff", label: "New England · New England Forestry Foundation restoration gift", type: "restoration" },
] as const;

export default function DedicationForm() {
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [routeId, setRouteId] = useState("");

  useEffect(() => {
    const saved = window.sessionStorage.getItem("livingTributeRoute");
    if (saved && contributionRoutes.some((route) => route.id === saved)) setRouteId(saved);
  }, []);

  const selectedRoute = useMemo(() => contributionRoutes.find((route) => route.id === routeId), [routeId]);
  const isTree = selectedRoute?.type === "tree";

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    setBusy(true); setMessage("");
    try {
      const response = await fetch("/api/participation", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: data.get("name"),
          email: data.get("email"),
          route: data.get("route"),
          treeCount: isTree ? data.get("treeCount") : null,
          confirmationRef: data.get("confirmationRef"),
          confirmed: data.get("confirmed") === "on",
          website: data.get("website"),
        }),
      });
      const result = await response.json() as { error?: string; contributionType?: "tree" | "restoration" };
      if (!response.ok) throw new Error(result.error || "Unable to record the tribute.");
      form.reset();
      setRouteId("");
      window.sessionStorage.removeItem("livingTributeRoute");
      setMessage(result.contributionType === "tree"
        ? "Thank you. Your tree dedication has been submitted for review. After approval, the reported trees will join Robert’s lifetime total."
        : "Thank you. Your restoration gift has been submitted for review. It will be preserved separately from the exact tree total.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return <form className="tree-dedication-form" onSubmit={submit}>
    <div className="tree-dedication-fields">
      <label>Your name<input name="name" required minLength={2} maxLength={100} autoComplete="name" /></label>
      <label>Contribution made
        <select name="route" required value={routeId} onChange={(event) => setRouteId(event.target.value)}>
          <option value="" disabled>Choose the project and provider</option>
          {contributionRoutes.map((route) => <option key={route.id} value={route.id}>{route.label}</option>)}
        </select>
      </label>
      {isTree && <label>Number of trees <small>(use the provider’s quantity)</small><input name="treeCount" type="number" min={1} max={10000} step={1} required inputMode="numeric" /></label>}
      <label>Confirmation / order no. <small>(optional)</small><input name="confirmationRef" maxLength={120} autoComplete="off" /></label>
      <label>Email <small>(optional, kept private)</small><input name="email" type="email" maxLength={200} autoComplete="email" /></label>
    </div>
    {selectedRoute?.type === "restoration" && <p className="tree-count-guidance">This provider does not assign a defensible exact tree quantity. Your successful gift will be preserved as a forest-restoration contribution and will not be converted into a guessed number of trees.</p>}
    {isTree && <p className="tree-count-guidance">Enter only the number of trees stated by the provider or, for Colorado’s official fund, the quantity implied by its published $2-per-seedling conversion.</p>}
    <label className="tree-dedication-confirm"><input type="checkbox" name="confirmed" required /> I confirm that the payment completed successfully and, when I entered a tree quantity, it is the quantity stated by the provider or its published conversion.</label>
    <label className="form-honeypot" aria-hidden="true">Website<input name="website" tabIndex={-1} autoComplete="off" /></label>
    <button type="submit" disabled={busy || !selectedRoute}>{busy ? "Submitting…" : "Record my living tribute"}</button>
    {message && <p role="status" className="tree-dedication-message">{message}</p>}
  </form>;
}
