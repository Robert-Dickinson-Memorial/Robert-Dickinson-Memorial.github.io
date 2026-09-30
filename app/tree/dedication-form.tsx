"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";

const contributionRoutes = [
  { id: "chippewa-arbor-day", label: "Chippewa National Forest · Arbor Day Foundation", type: "tree", geography: "Exact forest: Chippewa National Forest" },
  { id: "minnesota-living-tribute", label: "Minnesota forests · A Living Tribute", type: "tree", geography: "State-level attribution: Minnesota (specific forest not guaranteed)" },
  { id: "global-one-tree-planted", label: "Where needed most · One Tree Planted", type: "tree", geography: "Global / greatest-need attribution; not assigned to a Robert-specific location" },
  { id: "brazil-black-jaguar", label: "Brazil · Black Jaguar Foundation", type: "tree", geography: "Regional attribution: Araguaia corridor · Amazon–Cerrado" },
  { id: "arizona-living-tribute", label: "Arizona forests · A Living Tribute", type: "tree", geography: "State-level attribution: Arizona" },
  { id: "georgia-living-tribute", label: "Georgia forests · A Living Tribute", type: "tree", geography: "State-level attribution: Georgia" },
  { id: "texas-living-tribute", label: "Texas forests · A Living Tribute", type: "tree", geography: "State-level attribution: Texas" },
  { id: "colorado-csfs", label: "Colorado · Colorado State Forest Service", type: "tree", geography: "State-level attribution: Colorado" },
  { id: "california-living-tribute", label: "California forests · A Living Tribute", type: "tree", geography: "State-level attribution: California" },
  { id: "massachusetts-tree-boston", label: "Boston, Massachusetts · Tree Boston", type: "tree", geography: "City-level attribution: Boston, Massachusetts" },
  { id: "new-england-neff", label: "New England · NEFF restoration gift", type: "restoration", geography: "Regional attribution: New England" },
] as const;

export default function DedicationForm() {
  const [message, setMessage] = useState("");
  const [messageIsSuccess, setMessageIsSuccess] = useState(false);
  const messageRef = useRef<HTMLParagraphElement>(null);
  const [busy, setBusy] = useState(false);
  const [routeId, setRouteId] = useState("");

  useEffect(() => {
    const chooseRoute = (value: string | null) => {
      const normalized = value === "chippewa-living-tribute" ? "minnesota-living-tribute" : value;
      if (normalized && contributionRoutes.some((route) => route.id === normalized)) setRouteId(normalized);
    };
    chooseRoute(window.sessionStorage.getItem("livingTributeRoute"));
    const onRouteSelected = (event: Event) => chooseRoute((event as CustomEvent<string>).detail);
    window.addEventListener("livingTributeRouteSelected", onRouteSelected);
    return () => window.removeEventListener("livingTributeRouteSelected", onRouteSelected);
  }, []);

  const selectedRoute = useMemo(() => contributionRoutes.find((route) => route.id === routeId), [routeId]);
  const isTree = selectedRoute?.type !== "restoration";
  const countRef = useRef<HTMLInputElement>(null);
  function stepCount(direction: number) {
    const input = countRef.current;
    if (!input) return;
    input.value = String(Math.min(Number(input.max), Math.max(1, (Number(input.value) || 1) + direction)));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const form = event.currentTarget;
    const data = new FormData(form);
    setBusy(true); setMessage(""); setMessageIsSuccess(false);
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
      const result = await response.json() as {
        error?: string;
        contributionType?: "tree" | "restoration";
        geographicLabel?: string;
      };
      if (!response.ok) throw new Error(result.error || "Unable to record the tribute.");
      form.reset();
      setRouteId("");
      window.sessionStorage.removeItem("livingTributeRoute");
      window.dispatchEvent(new CustomEvent("livingTributeRecorded"));
      setMessageIsSuccess(true);
      setMessage(result.contributionType === "tree"
        ? "Thank you — your contribution has been successfully recorded. Your trees are now included in Robert’s living-tribute total."
        : "Thank you — your contribution has been successfully recorded in Robert’s living tribute.");
      window.setTimeout(() => messageRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }), 0);
    } catch (error) {
      setMessageIsSuccess(false);
      setMessage(error instanceof Error ? error.message : "Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return <form className="tree-dedication-form" onSubmit={submit}>
    <div className="tree-dedication-fields">
      <label>Your name<input placeholder="Name for your tribute" name="name" required minLength={2} maxLength={100} autoComplete="name" /></label>
      <label>Planting project
        <select name="route" required value={routeId} onChange={(event) => setRouteId(event.target.value)}>
          <option value="" disabled>Choose your project</option>
          {contributionRoutes.map((route) => <option key={route.id} value={route.id}>{route.label}</option>)}
        </select>
      </label>
      {isTree && <label>Number of trees<span className="tree-count-stepper"><button type="button" aria-label="One fewer tree" onClick={() => stepCount(-1)}>−</button><input ref={countRef} key={routeId} name="treeCount" type="number" min={1} max={routeId === "massachusetts-tree-boston" ? 1 : 10000} step={1} required inputMode="numeric" defaultValue={1} /><button type="button" aria-label="One more tree" onClick={() => stepCount(1)}>+</button></span></label>}
    </div>
    <details className="tree-optional"><summary>Add a donation reference (optional)</summary><label>Confirmation / order no.<input name="confirmationRef" maxLength={120} autoComplete="off" /></label></details>
    {selectedRoute && <p className="tree-geography-guidance"><strong>Location recorded:</strong> {selectedRoute.geography}</p>}
    {selectedRoute?.type === "restoration" && <p className="tree-count-guidance">This provider does not assign a defensible exact tree quantity. Your successful gift will be preserved as a forest-restoration contribution and will not be converted into a guessed number of trees.</p>}
    {isTree && routeId === "massachusetts-tree-boston" && <p className="tree-count-guidance">Choose one of Tree Boston’s listed one-tree options ($100, $500, or $1,000), then record 1 tree. Other donation amounts should not be converted into a tree count.</p>}
    {isTree && routeId !== "massachusetts-tree-boston" && <p className="tree-count-guidance">Enter only the exact number of trees stated by the provider or, for Colorado’s official fund, the quantity implied by its published $2-per-seedling conversion.</p>}
    <label className="tree-dedication-confirm"><input type="checkbox" name="confirmed" required /> I have completed my donation.</label>
    <label className="form-honeypot" aria-hidden="true">Website<input name="website" tabIndex={-1} autoComplete="off" /></label>
    <button type="submit" disabled={busy || !selectedRoute}>{busy ? "Submitting…" : "Record my trees →"}</button>
    <small className="tree-form-note">Only record the tree quantity confirmed by your provider.</small>
    {message && <p ref={messageRef} role="status" className={`tree-dedication-message ${messageIsSuccess ? "is-success" : "is-error"}`}>{messageIsSuccess && <span aria-hidden="true">✓</span>} {message}</p>}
  </form>;
}
