// Event editor and public event times use the venue's Pacific time zone.
export function eventLocalInput(value: string | null | undefined): string {
  if (!value) return "";
  if (!/(Z|[+-]\d{2}:\d{2})$/.test(value)) return value.slice(0, 16);
  const parts = new Intl.DateTimeFormat("sv-SE", { timeZone: "America/Los_Angeles", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(new Date(value));
  const get = (key: string) => parts.find(p => p.type === key)?.value;
  return `${get("year")}-${get("month")}-${get("day")}T${get("hour")}:${get("minute")}`;
}
export function eventInstant(value: string): string {
  if (!value) return "";
  if (/(Z|[+-]\d{2}:\d{2})$/.test(value)) return Number.isNaN(Date.parse(value)) ? "" : new Date(value).toISOString();
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) return "";
  for (const offset of ["-07:00", "-08:00"]) {
    const candidate = value + offset;
    if (eventLocalInput(candidate) === value) return new Date(candidate).toISOString();
  }
  return "";
}
