// RD_EVENT_PROGRAM: a single program resource, with two formats.
import type { MemorialEvent } from "./site-data";

const defaults: Record<string, string> = {
  "events.programDate": "2026-10-09",
  "events.programTitle": "Memorial program",
  "events.programIntro": "Choose the format that suits you—the content is the same.",
  "events.programReadLabel": "Read the program",
  "events.programReadMeta": "PDF · 4 pages · Reading order",
  "events.programReadUrl": "/events/2026-10-09/memorial-program.pdf",
  "events.programPrintLabel": "Print a folded booklet",
  "events.programPrintMeta": "PDF · 2 pages · US Letter print layout",
  "events.programPrintUrl": "/events/2026-10-09/printable-booklet-letter.pdf",
  "events.programPrintHelpLabel": "Printing instructions",
  "events.programPrintHelp": "Print on US Letter paper in landscape, double-sided, at actual size, flipping on the short edge. Fold in half. The pages are already arranged for folding; do not apply a second booklet layout. Test one sheet before printing multiple copies.",
  "events.programNewTab": "Opens a PDF in a new tab"
};

export function isMemorialProgramEvent(event: MemorialEvent, copy: Record<string, string>): boolean {
  const when = new Date(event.startAt);
  if (!Number.isFinite(when.getTime())) return false;
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Los_Angeles", year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(when);
  const part = (kind: string) => parts.find(p => p.type === kind)?.value || "";
  const day = `${part("year")}-${part("month")}-${part("day")}`;
  return day === (copy["events.programDate"] ?? defaults["events.programDate"])
    && /dickinson|james west|ucla/i.test(`${event.title} ${event.location || ""}`);
}

function safeDocumentUrl(raw: string): string {
  if (/^\/(?!\/)/.test(raw) && !raw.includes("\\")) return raw;
  try {
    const url = new URL(raw);
    return url.protocol === "https:" && !url.username && !url.password ? url.href : "";
  } catch { return ""; }
}

export default function EventProgram({ copy, eventId }: {
  copy: Record<string, string>; eventId: string | number;
}) {
  const c = (key: string) => copy[`events.program${key}`] ?? defaults[`events.program${key}`];
  const readUrl = safeDocumentUrl(c("ReadUrl"));
  const printUrl = safeDocumentUrl(c("PrintUrl"));
  if (!readUrl && !printUrl) return null;
  const headingId = `event-program-title-${eventId}`;
  return <aside className="event-program-resource" data-event-program aria-labelledby={headingId}>
    <h4 id={headingId}>{c("Title")}</h4>
    <div className="event-program-formats">
      {readUrl && <div className="event-program-format">
        <a className="event-program-link event-program-link-primary" href={readUrl}
          target="_blank" rel="noopener noreferrer" type="application/pdf"
          aria-label={`${c("ReadLabel")}. ${c("ReadMeta")}. ${c("NewTab")}.`}>
          {c("ReadLabel")} <span aria-hidden="true">↗</span>
        </a>
        <span className="event-program-meta">{c("ReadMeta")}</span>
      </div>}
      {printUrl && <div className="event-program-format">
        <a className="event-program-link" href={printUrl}
          target="_blank" rel="noopener noreferrer" type="application/pdf"
          aria-label={`${c("PrintLabel")}. ${c("PrintMeta")}. ${c("NewTab")}.`}>
          {c("PrintLabel")} <span aria-hidden="true">↗</span>
        </a>
        <span className="event-program-meta">{c("PrintMeta")}</span>
      </div>}
    </div>
    {printUrl && <details className="event-program-help">
      <summary>{c("PrintHelpLabel")}</summary><p>{c("PrintHelp")}</p>
    </details>}
  </aside>;
}
