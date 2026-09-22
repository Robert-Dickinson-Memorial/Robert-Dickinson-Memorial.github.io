import { BookOpen, Images } from "lucide-react";
import { GalleryItem, videoEmbedUrl } from "./site-data";

export default function GallerySection({ items, copy }: { items: GalleryItem[]; copy: Record<string, string> }) {
  return (
    <section id="gallery" className="gallery-section">
      <div className="gallery-heading">
        <div><p className="section-kicker light">{copy["gallery.sectionKicker"]}</p><h2>{copy["gallery.sectionTitle"]}</h2></div>
        <a className="book-button" href="/memory-book"><BookOpen size={18} /> {copy["gallery.bookButton"]}</a>
      </div>
      {!items.length ? (
        <div className="gallery-empty"><Images size={32} /><p>{copy["gallery.empty"]}</p></div>
      ) : (
        <div className="gallery-grid">
          {items.map((item) => {
            const embed = item.kind === "video" ? videoEmbedUrl(item.externalUrl) : null;
            return (
              <figure className="gallery-card" key={item.id}>
                {item.kind === "image" && item.objectKey && <img src={`/api/gallery/photos/${item.objectKey}`} alt={item.title} />}
                {embed && <iframe src={embed} title={item.title} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />}
                {!embed && item.kind === "video" && item.externalUrl && <a className="video-link" href={item.externalUrl} target="_blank" rel="noopener noreferrer">{copy["gallery.watchVideo"]}</a>}
                <figcaption><strong>{item.title}</strong>{item.caption && <span>{item.caption}</span>}</figcaption>
              </figure>
            );
          })}
        </div>
      )}
    </section>
  );
}
