import { BookOpen, Images } from "lucide-react";
import { GalleryItem, videoEmbedUrl } from "./site-data";

export default function GallerySection({ items }: { items: GalleryItem[] }) {
  return (
    <section id="gallery" className="gallery-section">
      <div className="gallery-heading">
        <div><p className="section-kicker light">Images and voices</p><h2>Photo & video gallery</h2></div>
        <a className="book-button" href="/memory-book"><BookOpen size={18} /> Turn photos into a book</a>
      </div>
      {!items.length ? (
        <div className="gallery-empty"><Images size={32} /><p>Photos and videos added by the memorial editors will appear here.</p></div>
      ) : (
        <div className="gallery-grid">
          {items.map((item) => {
            const embed = item.kind === "video" ? videoEmbedUrl(item.externalUrl) : null;
            return (
              <figure className="gallery-card" key={item.id}>
                {item.kind === "image" && item.objectKey && <img src={`/api/gallery/photos/${item.objectKey}`} alt={item.title} />}
                {embed && <iframe src={embed} title={item.title} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />}
                {!embed && item.kind === "video" && item.externalUrl && <a className="video-link" href={item.externalUrl} target="_blank" rel="noopener noreferrer">Watch video ↗</a>}
                <figcaption><strong>{item.title}</strong>{item.caption && <span>{item.caption}</span>}</figcaption>
              </figure>
            );
          })}
        </div>
      )}
    </section>
  );
}
