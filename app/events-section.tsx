"use client";
import { useState } from "react";
import type { MemorialEvent } from "./site-data";
import EventProgram, { isMemorialProgramEvent } from "./event-program";

// Keep the editable source intact; omit only the known invitation boilerplate.
function eventDescriptionParts(description: string | null | undefined) {
  const redundant = new Set([
    "Professor Robert E. Dickinson\n26 March 1940 – 11 September 2026",
    "For those who cannot attend in person, a live video stream will be available via the Zoom link below.",
    "Honor Robert through a living tribute or a memory shared with his community:\nhttps://robert-dickinson-memorial.github.io/",
    "Honor Robert through a living tribute or a memory shared with his community:",
    "https://robert-dickinson-memorial.github.io/"
  ]);
  const paragraphs = (description || "").replace(/\r\n/g, "\n").split(/\n\s*\n/).map(p => p.trim()).filter(Boolean);
  return {
    logistics: paragraphs.filter(p => /^Parking:/.test(p) || p === "Reception to follow.").sort((a, b) => Number(/^Parking:/.test(b)) - Number(/^Parking:/.test(a))),
    remaining: paragraphs.filter(p => !redundant.has(p) && !/^Parking:/.test(p) && p !== "Reception to follow.").join("\n\n")
  };
}

export default function EventsSection({ events, copy, portrait = "/robert-dickinson.jpg" }: { events: MemorialEvent[]; copy: Record<string, string>; portrait?: string }) {
  const [filter, setFilter] = useState("upcoming");
  const c = (key: string) => copy[`events.design.${key}`];
  const visible = events.filter(e => filter === "all" || (filter === "past") === (Date.parse(e.endAt || e.startAt) < Date.now()));
  const programEventId = visible.find(e => isMemorialProgramEvent(e, copy))?.id;
  const date = (v: string, opts: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat("en-US", {timeZone:"America/Los_Angeles", ...opts}).format(new Date(v));
  function calendar(e: MemorialEvent) {
    const escape = (v: string) => v.replace(/\\/g,"\\\\").replace(/\r?\n/g,"\\n").replace(/,/g,"\\,").replace(/;/g,"\\;");
    const stamp = (v: string) => new Date(v).toISOString().replace(/[-:]/g,"").replace(/\.\d{3}/,"");
    const lines = ["BEGIN:VCALENDAR","VERSION:2.0","PRODID:-//Robert Dickinson Memorial//Events//EN","BEGIN:VEVENT",`UID:memorial-${e.id}@robert-dickinson-memorial.github.io`,`DTSTAMP:${stamp(new Date().toISOString())}`,`DTSTART:${stamp(e.startAt)}`,...(e.endAt ? [`DTEND:${stamp(e.endAt)}`] : []),`SUMMARY:${escape(e.title)}`,`LOCATION:${escape(e.location || "")}`,`DESCRIPTION:${escape((e.description || "") + "\n" + (e.linkUrl || ""))}`,"END:VEVENT","END:VCALENDAR"];
    const url = URL.createObjectURL(new Blob([lines.join("\r\n") + "\r\n"],{type:"text/calendar;charset=utf-8"}));
    const a=document.createElement("a");a.href=url;a.download=`robert-dickinson-event-${e.id}.ics`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  }
  return <section className="events-section event-designed-section">
    <div className="event-filter-bar" role="group" aria-label="Filter events">{["upcoming","past","all"].map(f=><button key={f} type="button" aria-pressed={filter===f} onClick={()=>setFilter(f)}>{c(f)}</button>)}</div>
    <div className="event-feature-list" aria-live="polite">{!visible.length ? <p className="events-empty">{c(`empty${filter[0].toUpperCase()+filter.slice(1)}`)}</p> : visible.map(e=>{ const details = eventDescriptionParts(e.description); return <article className="event-feature" key={e.id}>
      <div className="event-feature-photo"><img src={portrait} alt="Robert E. Dickinson"/></div>
      <div className="event-feature-copy"><h3>{e.title}</h3><time dateTime={e.startAt}>{date(e.startAt,{weekday:"long",month:"long",day:"numeric",year:"numeric"})}<br/>{date(e.startAt,{timeStyle:"short"})}{e.endAt ? ` – ${date(e.endAt,{timeStyle:"short"})}` : ""} Pacific Time</time>
      {e.location && <p className="event-venue">{e.location}</p>}
      {details.logistics.length > 0 && <div className="event-logistics">{details.logistics.map(p => <p key={p}>{p}</p>)}</div>}
      {details.remaining && <div className="event-story">{details.remaining.split(/(https?:\/\/[^\s]+)/g).map((p,i)=>/^https?:\/\//.test(p)?<a key={i} href={p} target="_blank" rel="noopener noreferrer">{p}</a>:p)}</div>}
      <div className="event-actions">{e.linkUrl && <a className="event-primary" href={e.linkUrl} target="_blank" rel="noopener noreferrer">{e.linkLabel || copy["events.defaultLink"]} ↗</a>}<button type="button" onClick={()=>calendar(e)}>{c("calendar")} ↓</button>{e.location && <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(e.location)}`} target="_blank" rel="noopener noreferrer">{c("directions")} ↗</a>}</div>
      {programEventId !== undefined && e.id === programEventId && <EventProgram copy={copy} eventId={e.id} />}
      </div>
    </article>})}</div>
  </section>;
}
