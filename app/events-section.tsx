import { CalendarDays, MapPin } from "lucide-react";
import type { MemorialEvent } from "./site-data";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", { dateStyle: "long", timeStyle: "short" }).format(new Date(value));
}

export default function EventsSection({ events }: { events: MemorialEvent[] }) {
  return (
    <section id="events" className="events-section">
      <div className="events-heading"><p className="section-kicker">Gather in remembrance</p><h2>Events</h2><p>Memorial gatherings, scientific tributes, and community events will be listed here.</p></div>
      {!events.length ? (
        <div className="events-empty"><CalendarDays size={30} /><p>No events have been announced yet.</p></div>
      ) : (
        <div className="events-list">
          {events.map((event) => (
            <article className="event-card" key={event.id}>
              <time dateTime={event.startAt}>{formatDate(event.startAt)}</time>
              <h3>{event.title}</h3>
              {event.location && <p className="event-location"><MapPin size={16} /> {event.location}</p>}
              {event.description && <p>{event.description}</p>}
              {event.linkUrl && <a href={event.linkUrl} target="_blank" rel="noopener noreferrer">{event.linkLabel || "Event details"} →</a>}
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
