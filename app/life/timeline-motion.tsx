"use client";
import { useEffect } from "react";
export default function LifeTimelineMotion() {
  useEffect(() => {
    function illuminateLifeTimeline() {
    const entries = document.querySelectorAll(".life-scroll-entry");
    if (!("IntersectionObserver" in window) || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      entries.forEach((entry) => entry.classList.add("is-reached"));
      return;
    }
    const observer = new IntersectionObserver((changes) => {
      changes.forEach((change) => {
        if (change.isIntersecting) {
          change.target.classList.add("is-reached");
          observer.unobserve(change.target);
        }
      });
    }, { rootMargin: "0px 0px -18% 0px", threshold: 0 });
    entries.forEach((entry) => observer.observe(entry));
    return () => observer.disconnect();
  }
    return illuminateLifeTimeline();
  }, []);
  return null;
}
