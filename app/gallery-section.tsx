"use client";
import { useState, useRef } from "react";
import type { GalleryItem } from "./site-data";
import { galleryYear } from "./gallery-order";
function embedUrl(value: string | null) {
 try { const u=new URL(value || ""); if(u.hostname==="youtu.be")return `https://www.youtube-nocookie.com/embed/${u.pathname.slice(1)}`; if(["youtube.com","www.youtube.com"].includes(u.hostname))return `https://www.youtube-nocookie.com/embed/${u.searchParams.get("v")||u.pathname.split("/").pop()}`; if(u.hostname==="vimeo.com")return `https://player.vimeo.com/video/${u.pathname.split("/").pop()}`; } catch {} return "";
}
export default function GallerySection({ items, copy }: { items: GalleryItem[]; copy: Record<string,string> }) {
 const [decade,setDecade]=useState("all"),[order,setOrder]=useState("oldest"),[limit,setLimit]=useState(12),[selected,setSelected]=useState<number|null>(null);
 const dialog=useRef<HTMLDialogElement>(null);
 const c=(k:string)=>copy[`gallery.design.${k}`];
 const decades=[...new Set(items.map(galleryYear).filter((y):y is number=>y!==null).map(y=>Math.floor(y/10)*10))].sort((a,b)=>a-b);
 const filtered=items.filter(i=>decade==="all"||String(Math.floor((galleryYear(i)??-1)/10)*10)===decade).sort((a,b)=>{const x=galleryYear(a),y=galleryYear(b);return x===null?(y===null?a.id-b.id:1):y===null?-1:(order==="oldest"?x-y:y-x)||a.id-b.id;});
 const photos=filtered.filter(i=>i.kind==="image"&&i.objectKey),index=photos.findIndex(i=>i.id===selected),active=photos[index];
 return <section id="gallery" className="gallery-section gallery-designed-section">
 <div className="gallery-year-filters" role="group" aria-label="Filter by decade">{["all",...decades.map(String)].map(d=><button type="button" key={d} aria-pressed={decade===d} onClick={()=>{setDecade(d);setLimit(12);}}>{d==="all"?c("all"):d+"s"}</button>)}</div>
 <div className="gallery-toolbar"><h2>{c("title")}</h2><label><span className="gallery-sr-only">{c("sort")}</span><select value={order} onChange={e=>{setOrder(e.target.value);setLimit(12);}}><option value="oldest">{c("oldest")}</option><option value="newest">{c("newest")}</option></select></label></div>
 <div className="gallery-photo-grid">{filtered.slice(0,limit).map(item=><figure className="gallery-tile" key={item.id}>
 {item.kind==="image"&&item.objectKey&&<button className="gallery-photo-button" type="button" aria-label={`${c("open")}: ${item.title}`} onClick={()=>{setSelected(item.id);dialog.current?.showModal();}}><img src={`/api/gallery/photos/${item.objectKey}`} alt={item.title} loading="lazy"/></button>}
 {item.kind==="video"&&(embedUrl(item.externalUrl)?<iframe src={embedUrl(item.externalUrl)} title={item.title} loading="lazy" allowFullScreen/>:<a className="video-link" href={item.externalUrl||"#"} target="_blank" rel="noopener noreferrer">{copy["gallery.watchVideo"]}</a>)}
 <figcaption><span className="gallery-year">{galleryYear(item)??c("undated")}</span><strong>{item.title}</strong>{item.caption&&<span>{item.caption}</span>}</figcaption></figure>)}</div>
 {!filtered.length&&<p className="gallery-designed-empty">{items.length?c("none"):copy["gallery.empty"]}</p>}
 {limit<filtered.length&&<button className="gallery-load-more" type="button" onClick={()=>setLimit(limit+12)}>{c("more")} ↓</button>}
 <a className="gallery-book-link" href="/memory-book/">{copy["gallery.bookButton"]} →</a>
 <dialog className="gallery-viewer" aria-label={active?.title || c("open")} ref={dialog} onClick={e=>{if(e.target===e.currentTarget)dialog.current?.close();}}><button className="gallery-viewer-close" type="button" onClick={()=>dialog.current?.close()}>{c("close")} ×</button>{active&&<><img src={`/api/gallery/photos/${active.objectKey}`} alt={active.title}/><h2>{active.title}</h2>{active.caption&&<p>{active.caption}</p>}<div className="gallery-viewer-nav"><button type="button" disabled={index<=0} onClick={()=>setSelected(photos[index-1].id)}>← {c("previous")}</button><span>{index+1} / {photos.length}</span><button type="button" disabled={index>=photos.length-1} onClick={()=>setSelected(photos[index+1].id)}>{c("next")} →</button></div></>}</dialog>
 </section>;
}
