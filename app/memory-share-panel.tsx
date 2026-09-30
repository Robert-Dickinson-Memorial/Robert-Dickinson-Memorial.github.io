"use client";
import { ReactNode, useEffect, useRef } from "react";

export default function MemorySharePanel({ children }: { children: ReactNode }) {
  const panel = useRef<HTMLDetailsElement>(null);
  useEffect(() => {
    const reveal = () => { if (location.hash === "#share" && panel.current) panel.current.open = true; };
    reveal();
    window.addEventListener("hashchange", reveal);
    return () => window.removeEventListener("hashchange", reveal);
  }, []);
  return <details id="share" className="memory-share-panel" ref={panel}>
    <summary><span><strong>Share your memory</strong><small>Add a story, photo, PDF, or video to Robert’s memory wall.</small></span><span className="share-panel-action"><span className="share-open-label">Write a memory</span><span className="share-close-label">Close form</span><span aria-hidden="true">＋</span></span></summary>
    {children}
  </details>;
}
