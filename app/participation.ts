// A submission can name two contributors (for example, "Liming Zhou & Yuhong Tian").
// Names are the only common public identifier across older memories and tree reports.
export function contributorCount(names: string[]): number {
  const people = new Set<string>();
  for (const name of names) {
    for (const part of name.split(/\s+(?:&|and)\s+/i)) {
      const normalized = part.trim().replace(/\s+/g, " ").toLocaleLowerCase();
      if (normalized) people.add(normalized);
    }
  }
  return people.size;
}
