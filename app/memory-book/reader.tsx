"use client";
import {useEffect,useRef,useState} from "react";
import {renderMemoryBook} from "../../public/memory-book.js";
import type {SiteContent,GalleryItem} from "../site-data";
export default function BookReader({data}:{data:{content:SiteContent;gallery:GalleryItem[];memories:unknown[];participation:unknown}}){
 const target=useRef<HTMLElement>(null),viewport=useRef<HTMLDivElement>(null);
 const [ready,setReady]=useState(false),[status,setStatus]=useState(data.content.pageCopy["book.design.loading"]);
 const c=data.content.pageCopy;
 useEffect(()=>{let active=true;const scale=()=>viewport.current?.style.setProperty('--book-preview-scale',String(Math.min(1,(viewport.current?.clientWidth||816)/816)));scale();window.addEventListener('resize',scale);
 const css=document.createElement('link');css.rel='stylesheet';css.href='https://robert-dickinson-memorial.github.io/memory-book.css';css.onload=async()=>{try{if(!active||!target.current)return;const result=await renderMemoryBook(target.current,data,{assetRoot:'/'});if(active){setReady(!result.failedImages.length&&!result.overflow.length);setStatus(result.failedImages.length?c['book.design.imageWarning']:c['book.design.ready'].replace('{pages}',String(result.pages)));}}catch{if(active)setStatus(c['book.design.error']);}};document.head.append(css);
 return()=>{active=false;window.removeEventListener('resize',scale);css.remove();};},[data,c]);
 return <main className="keepsake-shell"><div className="keepsake-toolbar"><a href="https://robert-dickinson-memorial.github.io/">{c['book.toolbarReturn']}</a><a className="kb-download" href="https://robert-dickinson-memorial.github.io/memory-book/Robert-E-Dickinson-Memory-Book.pdf">{c['book.design.download']}</a><button disabled={!ready} onClick={()=>window.print()}>{c['book.print']}</button><button onClick={()=>window.location.reload()}>{c['book.design.refresh']}</button></div><p className="keepsake-status">{c['book.design.snapshotNote']}</p><p className="keepsake-status" role="status">{status}</p><div ref={viewport} className="keepsake-viewport"><article ref={target} className="keepsake-book"/></div></main>;
}
