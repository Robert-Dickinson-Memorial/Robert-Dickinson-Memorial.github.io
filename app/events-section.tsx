import { CalendarDays, MapPin } from "lucide-react";
import type { MemorialEvent } from "./site-data";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", { dateStyle: "long", timeStyle: "short" }).format(new Date(value));
}

export default function EventsSection({ events, copy }: { events: MemorialEvent[]; copy: Record<string, string> }) {
  return (
    <section id="events" className="events-section">
      <div className="events-heading"><p className="section-kicker">${copy["events.sectionKicker"]}</p><h2>${copy["events.sectionTitle"]}</h2><p>${copy["events.sectionIntro"]}</p></div>
      {!events.length ? (
        <div className="events-empty"><CalendarDays size={30} /><p>${copy["events.empty"]}</p></div>
      ) : (
        <div className="events-list">
          {events.map((event) => (
            <article className="event-card" key={event.id}>
              <time dateTime={event.startAt}>{formatDate(event.startAt)}</time>
              <h3>{event.title}</h3>
              {event.location && <p className="event-location"><MapPin size={16} /> {event.location}</p>}
              {event.description && <p>{event.description}</p>}
              {event.linkUrl && <a href={event.linkUrl} target="_blank" rel="noopener noreferrer">{event.linkLabel || copy["events.defaultLink"]} →</a>}
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
