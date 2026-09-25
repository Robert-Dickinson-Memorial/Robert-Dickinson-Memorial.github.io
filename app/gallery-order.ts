type DatedGalleryItem = {
  id: number;
  title: string;
  caption: string | null;
};

// Prefer the title; use the caption when the title has no year.
// Decades, approximate dates, and ranges sort by their first stated year.
export function galleryYear(item: Pick<DatedGalleryItem, "title" | "caption">): number | null {
  for (const text of [item.title, item.caption ?? ""]) {
    const match = text.match(/(?:^|[^\d])((?:18|19|20|21)\d{2})(?!\d)/);
    if (match) return Number(match[1]);
  }
  return null;
}

export function sortGalleryByYear<T extends DatedGalleryItem>(items: T[]): T[] {
  return [...items].sort((a, b) => {
    const aYear = galleryYear(a);
    const bYear = galleryYear(b);
    if (aYear === null && bYear !== null) return 1;
    if (bYear === null && aYear !== null) return -1;
    return (aYear ?? 0) - (bYear ?? 0) || a.id - b.id;
  });
}
