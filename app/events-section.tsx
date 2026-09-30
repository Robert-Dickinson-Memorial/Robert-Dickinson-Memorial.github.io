"use client";
import { useState } from "react";
import type { MemorialEvent } from "./site-data";

export default function EventsSection({ events, copy, portrait = "/robert-dickinson.jpg" }: { events: MemorialEvent[]; copy: Record<string, string>; portrait?: string }) {
  const [filter, setFilter] = useState("upcoming");
  const c = (key: string) => copy[`events.design.${key}`];
  const visible = events.filter(e => filter === "all" || (filter === "past") === (Date.parse(e.endAt || e.startAt) < Date.now()));
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
    <div className="event-feature-list" aria-live="polite">{!visible.length ? <p className="events-empty">{c(`empty${filter[0].toUpperCase()+filter.slice(1)}`)}</p> : visible.map(e=><article className="event-feature" key={e.id}>
      <div className="event-feature-photo"><img src={portrait} alt="Robert E. Dickinson"/><div className="event-date-badge"><span>{date(e.startAt,{month:"short"})}</span><strong>{date(e.startAt,{day:"numeric"})}</strong><span>{date(e.startAt,{year:"numeric"})}</span></div></div>
      <div className="event-feature-copy"><p className="section-kicker">{c("details")}</p><h3>{e.title}</h3><time dateTime={e.startAt}>{date(e.startAt,{weekday:"long",month:"long",day:"numeric",year:"numeric"})}<br/>{date(e.startAt,{timeStyle:"short"})}{e.endAt ? ` – ${date(e.endAt,{timeStyle:"short"})}` : ""} Pacific Time</time>
      {e.location && <p className="event-venue">{e.location}</p>}
      <div className="event-actions">{e.linkUrl && <a className="event-primary" href={e.linkUrl} target="_blank" rel="noopener noreferrer">{e.linkLabel || copy["events.defaultLink"]} ↗</a>}<button type="button" onClick={()=>calendar(e)}>{c("calendar")} ↓</button>{e.location && <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(e.location)}`} target="_blank" rel="noopener noreferrer">{c("directions")} ↗</a>}</div>
      {e.description && <div className="event-story">{e.description.split(/(https?:\/\/[^\s]+)/g).map((p,i)=>/^https?:\/\//.test(p)?<a key={i} href={p} target="_blank" rel="noopener noreferrer">{p === "https://robert-dickinson-memorial.github.io/" ? "Robert’s memorial website ↗" : p}</a>:p)}</div>}</div>
    </article>)}</div>
    <aside className="event-planning"><h2>{c("planning")}</h2><p>{c("planningIntro")}</p><div className="event-planning-grid">{["venue","online","remember"].map(k=><div key={k}><h3>{c(`${k}Title`)}</h3><p>{c(`${k}Text`)}</p>{k==="remember" && <div className="event-remembrance"><a href="/tree/">{c("tree")} →</a><a href="/memories/">{c("memory")} →</a></div>}</div>)}</div></aside>
  </section>;
}
