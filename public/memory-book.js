/* One measured, printable book renderer for the live preview and generated PDF. */
const SITE = 'https://robert-dickinson-memorial.github.io';
const el = (tag, text, cls) => { const n=document.createElement(tag);if(text!==undefined&&text!==null)n.textContent=String(text);if(cls)n.className=cls;return n; };
const paragraphs = text => String(text||'').split(/\n\s*\n/).map(t=>t.trim()).filter(Boolean);
const year = item => Number((String(item.title||'').match(/(?:18|19|20|21)\d{2}/)||String(item.caption||'').match(/(?:18|19|20|21)\d{2}/)||[])[0])||9999;
export async function renderMemoryBook(target, data, options={}) {
  const {content={},memories=[],gallery=[],participation={}}=data;
  const copy=content.pageCopy||{},c=(key,fallback='')=>copy[key]??fallback;
  const assetRoot=options.assetRoot??'/assets/';
  const media=(route,key)=>options.mediaUrl?options.mediaUrl(route,key):`${route}/${String(key).split('/').map(encodeURIComponent).join('/')}`;
  const asset=id=>{const a=content.siteAssets?.[id];return a?(a.objectKey?media('/api/site-assets',a.objectKey):assetRoot+a.asset.replace(/^\//,'')):'';};
  const img=(src,alt='',cls='')=>{const n=el('img',null,cls);n.src=options.imageUrl?options.imageUrl(src):src;n.alt=alt;n.loading='eager';n.decoding='sync';return n;};
  const link=(text,href)=>{const a=el('a',text);try{const u=new URL(href,SITE);if(!['https:','http:'].includes(u.protocol))return el('span',text);a.href=u.href;}catch{return el('span',text);}return a;};
  const title=c('global.footerName','Robert E. Dickinson'), landscape=asset('bookCover')||asset('lifeBackground')||asset('horizon');
  const pages=[],toc=[],failed=[],stamp=options.generatedAt||new Date().toISOString();let current,body;
  target.className='keepsake-book';target.replaceChildren();target.dataset.ready='false';
  const sizes=new Map();
  const sources=[...Object.keys(content.siteAssets||{}).map(asset),...(content.lifePhotos||[]).map(p=>media('/api/life-photos',p.objectKey)),...gallery.filter(p=>p.kind==='image'&&p.objectKey).map(p=>media('/api/gallery/photos',p.objectKey)),...memories.filter(m=>m.photoKey).map(m=>media('/api/photos',m.photoKey))];
  await Promise.all([...new Set(sources.filter(Boolean))].map(src=>new Promise(resolve=>{const im=new Image();const timer=setTimeout(resolve,30000);im.onload=()=>{clearTimeout(timer);sizes.set(src,{width:im.naturalWidth,height:im.naturalHeight});resolve();};im.onerror=()=>{clearTimeout(timer);resolve();};im.src=options.imageUrl?options.imageUrl(src):src;})));
  // Request the actual characters before measuring; font loading must not repaginate later.
  await document.fonts.load('16px "Memorial CJK"', JSON.stringify(data));
  await document.fonts.ready;
  function photoPair(items,route){const pair=el('div',null,'kb-photo-pair');if(items.length===2&&items.every(p=>{const d=sizes.get(media(route,p.objectKey));return d&&d.width>d.height*1.1;}))pair.classList.add('kb-photo-pair-landscape');items.forEach(p=>pair.append(figure(media(route,p.objectKey),[p.date,p.caption||p.title].filter(Boolean).join(' · '),p.alt||p.title||'')));return pair;}

  function page(section,kind='') {
    const p=el('section',null,`kb-page ${kind}`);p.setAttribute('aria-label',section||title);
    const running=el('header',null,'kb-running');running.append(el('span',title),el('span',section));
    const b=el('div',null,'kb-body');p.append(running,b,el('footer',null,'kb-folio'));
    target.append(p);pages.push(p);current=p;body=b;return p;
  }
  function fits(){return body.scrollHeight<=body.clientHeight+1;}
  function append(n) {
    body.append(n);if(fits())return;
    const oversized=n.offsetHeight>body.clientHeight;
    n.remove();
    const previous=body.lastElementChild;
    if(previous?.matches('h2,h3')){previous.remove();page(current.getAttribute('aria-label'));body.append(previous);}
    else if(body.childNodes.length&&!oversized)page(current.getAttribute('aria-label'));
    body.append(n);if(fits())return;
    // Arbitrarily long plain text is split by measured words, never clipped or discarded.
    if(n.matches('p,blockquote,li')&&n.children.length===0){
      const words=n.textContent.match(/[\u3400-\u9fff]|[^\s\u3400-\u9fff]+\s*|\s+/gu)||[];n.remove();let rest=words;
      while(rest.length){let lo=1,hi=rest.length,best=0,probe=n.cloneNode(false);body.append(probe);
        while(lo<=hi){const mid=(lo+hi)>>1;probe.textContent=rest.slice(0,mid).join('');if(fits()){best=mid;lo=mid+1;}else hi=mid-1;}
        if(!best){probe.remove();if(body.childNodes.length){page(current.getAttribute('aria-label'));continue;}throw new Error('A text block cannot fit on a book page.');}
        probe.textContent=rest.slice(0,best).join('');rest=rest.slice(best);if(rest.length)page(current.getAttribute('aria-label'));
      }
    } else if(n.matches('figure')&&n.querySelector('figcaption')) {
      const caption=n.querySelector('figcaption');caption.remove();n.remove();append(n);append(el('p',caption.textContent,'kb-small'));
    } else if(n.children.length && !n.matches('figure,.kb-orbit')) {
      const children=[...n.childNodes];n.remove();for(const child of children)if(child.nodeType===1)append(child);else if(child.textContent.trim())append(el('p',child.textContent));
    } else {throw new Error('A photograph or layout block exceeds the printable page.');}
  }
  const prose=text=>paragraphs(text).forEach(t=>append(el('p',t,'kb-prose')));
  function heading(text,level=3){const h=el(`h${level}`,text);append(h);if(h.offsetTop+h.offsetHeight>body.clientHeight-95){h.remove();page(current.getAttribute('aria-label'));append(h);}}
  function section(name,kicker,intro){page(name);toc.push({name,page:pages.length});const h=el('div',null,'kb-section-heading');h.append(el('p',kicker,'kb-kicker'),el('h2',name));if(intro)h.append(el('p',intro,'kb-deck'));append(h);}
  function figure(src,caption,alt='',cls=''){const f=el('figure',null,`kb-figure ${cls}`);f.append(img(src,alt));if(caption)f.append(el('figcaption',caption));return f;}
  function quote(text,attribution){const q=el('div',null,'kb-quote');q.append(el('blockquote',text));if(attribution)q.append(el('cite',attribution));append(q);}
  function bodyGroup(...nodes){const group=el('div',null,'kb-group');group.append(...nodes);append(group);}

  page(title,'kb-cover');current.prepend(img(landscape,'','kb-cover-art'));
  const cover=el('div',null,'kb-cover-copy');cover.append(el('p',c('book.design.strapline','SCIENCE FOR A MORE LIVABLE PLANET'),'kb-kicker'),el('h1',`${c('book.coverNameLine1','Robert E.')} ${c('book.coverNameLine2','Dickinson')}`),el('p',c('book.coverDates','1940–2026'),'kb-cover-dates'),el('div','', 'kb-rule'),el('p',c('book.design.coverLine','A Life. A Legacy. A Brighter Tomorrow.'),'kb-cover-line'));body.append(cover);body.append(el('p',c('book.coverSubtitle'),'kb-cover-bottom'));

  page(title,'kb-frontispiece');append(figure(asset('portrait'),content.siteAssets?.portrait?.alt||title,title,'kb-portrait'));quote(c('home.portraitQuote'),c('home.portraitQuoteCaption'));
  page(c('book.design.contents','Contents'),'kb-contents');const contentsPage=current,contentsBody=body;body.append(el('p',c('book.design.strapline'),'kb-kicker'),el('h2',c('book.design.contents','Contents')));

  section(c('book.design.opening','A Life Remembered'),c('book.design.openingKicker','A commemorative book'),content.heroIntro);
  prose(c('book.design.welcome','Gathered from the memorial website, these pages bring together Robert’s life, his scientific contributions, and the voices and photographs of the people who knew him.'));
  quote(c('legacy.quote2018Text'),c('legacy.quote2018Attribution'));
  append(figure(asset('horizon'),c('book.design.openingImageCaption',''),'','kb-wide'));
  append(el('p',c('book.design.editionNote','This edition reflects the published memorial content available when it was created. The online memorial continues to grow.'),'kb-small'));
  append(el('p',`${c('book.design.editionLabel','Edition prepared')}: ${new Intl.DateTimeFormat('en-US',{dateStyle:'long',timeZone:'America/New_York'}).format(new Date(stamp))}`,'kb-small'));
  append(link(SITE.replace('https://',''),SITE));

  section(c('book.design.lifeTitle','A Life Well Lived'),c('nav.life','His Life'),c('life.heroIntro'));
  prose(content.obituaryStory);
  heading(c('life.mentorTitle','The Mentor He Was'));prose(c('life.mentorBody'));quote(c('life.mentorText'));
  const lifePhotos=content.lifePhotos||[],early=lifePhotos.filter(p=>!p.milestoneId||p.milestoneId==='childhood');
  function photoPages(items,label,route){
    for(let i=0;i<items.length;i+=2){page(label);append(el('p',label,'kb-kicker'));append(photoPair(items.slice(i,i+2),route));}
  }
  if(early.length)photoPages(early,c('life.childhoodTitle',c('life.timelineChildhoodLabel','Childhood in MN')),'/api/life-photos');
  const used=new Set(early.map(p=>p.id));
  for(const [index,m] of (content.lifeMilestones||[]).entries()){
    page(c('book.design.career','Life & Career'));bodyGroup(el('p',m.year,'kb-kicker'),el('h2',m.title));prose(m.text);
    const photos=lifePhotos.filter(p=>p.milestoneId===(m.id||`life-period-${index}`));photos.forEach(p=>used.add(p.id));
    for(let i=0;i<photos.length;i+=2)append(photoPair(photos.slice(i,i+2),'/api/life-photos'));
  }
  const otherLifePhotos=lifePhotos.filter(p=>!used.has(p.id));if(otherLifePhotos.length)photoPages(otherLifePhotos,c('book.design.lifePhotos','His Life in Photographs'),'/api/life-photos');

  section(c('nav.legacy','Scientific Legacy'),c('book.design.scienceKicker','A life in science'),c('home.legacyTitle'));
  prose(content.homeLegacyIntro);quote(c('legacy.quote1996Text'),c('legacy.quote1996Attribution'));
  append(figure(asset('horizon'),'','','kb-wide'));
  page(c('home.legacyIdeasTitle','Ideas That Endure'));toc.push({name:c('home.legacyIdeasTitle','Ideas That Endure'),page:pages.length});heading(c('home.legacyIdeasTitle','Ideas That Endure'),2);
  const orbit=el('div',null,'kb-orbit');orbit.append(img(asset('earth'),'Earth','kb-globe'));
  (content.legacyThreads||[]).forEach((t,i)=>{const n=el('div',null,`kb-thread kb-thread-${i+1}`);n.append(el('span','○'),el('h3',t.title));orbit.append(n);});append(orbit);
  const threadDetails=el('div',null,'kb-thread-details');for(const t of content.legacyThreads||[]){const detail=el('div');detail.append(el('h3',t.title),el('p',t.text));threadDetails.append(detail);}append(threadDetails);
  const frontiers=el('aside',null,'kb-frontiers');frontiers.append(el('strong',c('home.legacyMapSecondary','Other frontiers')),el('p',(content.homeFrontierLabels||[]).join(' · ')));append(frontiers);
  page(c('home.legacyImpactTitle','Impact that Lasts'));heading(c('home.legacyImpactTitle','Impact that Lasts'),2);for(const card of content.homeLegacyCards||[])bodyGroup(el('h3',card.title),el('p',card.text));
  for(const chapter of content.legacyChapters||[]){
    page(chapter.institution);bodyGroup(el('p',`${chapter.years} · ${chapter.institution}`,'kb-kicker'),el('h2',chapter.title));prose(chapter.summary);
    if(chapter.photo){const p=chapter.photo,src=p.objectKey?media('/api/chapter-photos',p.objectKey):p.asset?assetRoot+p.asset.replace(/^\//,''):'';if(src)append(figure(src,p.caption,p.alt,'kb-chapter-photo'));}
    heading(c('legacy.contributionsLabel','Key contributions'));for(const t of chapter.contributions||[])append(el('p',t,'kb-contribution'));
    heading(c('legacy.impactLabel','Legacy'));prose(chapter.impact);
    for(const p of chapter.publications?.length?chapter.publications:chapter.publication?[chapter.publication]:[]){
      const n=el('div',null,'kb-publication');n.append(el('p',`${c('legacy.publicationLabel','Landmark Publication')} · ${p.year||''}`,'kb-kicker'),el('h3',p.title),el('cite',p.citation),el('p',p.note));if(p.url)n.append(link(p.url,p.url));append(n);
    }
  }
  page(c('legacy.serviceKicker','Community Service'));heading(c('legacy.serviceKicker','Community Service'),2);
  for(const key of ['Leadership','Advice','Collaboration','Publishing'])bodyGroup(el('h3',c(`legacy.service${key}Title`)),el('p',c(`legacy.service${key}Text`)));
  heading(c('legacy.honorsKicker','Honors, Awards & Recognition'),2);for(const h of content.honors||[])bodyGroup(el('p',h.year,'kb-kicker'),el('h3',h.title),el('p',h.detail));

  section(c('book.design.memoriesTitle','In Their Words'),c('book.design.memoriesKicker','Stories and memories'),c('book.design.memoriesIntro','Stories, reflections, and gratitude from colleagues, students, friends, and family.'));
  const memoryPortraits=memories.filter(m=>m.photoKey).slice(0,3);
  if(memoryPortraits.length){const collage=el('div',null,'kb-memory-collage');memoryPortraits.forEach(m=>collage.append(figure(media('/api/photos',m.photoKey),m.name,m.name)));append(collage);}
  // Preserve the public memorial's editorial ordering, including pinned contributors.
  for(const memory of memories){
    page(c('book.design.memoriesTitle','In Their Words'));bodyGroup(el('p',memory.relationship||c('book.memoryPrefix','A memory from'),'kb-kicker'),el('h2',memory.title||memory.name),el('p',memory.name,'kb-byline'));
    if(memory.photoKey)append(figure(media('/api/photos',memory.photoKey),'',`${c('book.memoryPrefix','A memory from')} ${memory.name}`,'kb-memory-photo'));
    prose(memory.story);
    if(memory.pdfKey||memory.videoKey||memory.socialUrl){
      const links=el('div',null,'kb-online');links.append(el('p',c('book.design.onlineNote','Accompanying recordings and original attachments are available in the online memorial.')));
      if(memory.pdfKey)links.append(link(c('memories.pdfLink','Read the shared PDF'),new URL(media('/api/memory-files',memory.pdfKey),options.publicOrigin||SITE).href));
      if(memory.videoKey)links.append(link(c('book.design.watchVideo','Watch the shared video'),new URL(media('/api/memory-videos',memory.videoKey),options.publicOrigin||SITE).href));
      if(memory.socialUrl)links.append(link(c('memories.socialLink','View the shared public post'),memory.socialUrl));
      links.append(link(`${SITE.replace('https://','')}/memories/`,SITE+'/memories/'));append(links);
    }
  }
  if(!memories.length)prose(c('book.emptyText'));

  section(c('book.design.galleryTitle','A Life in Pictures'),c('nav.gallery','Gallery'),c('gallery.heroIntro'));
  const photos=gallery.filter(p=>p.kind==='image'&&p.objectKey).sort((a,b)=>year(a)-year(b)||a.id-b.id);
  if(photos.length)append(figure(media('/api/gallery/photos',photos[0].objectKey),photos[0].title,photos[0].title,'kb-gallery-opener'));
  for(let i=0;i<photos.length;i+=2){page(c('book.design.galleryTitle','A Life in Pictures'));append(photoPair(photos.slice(i,i+2).map(p=>({...p,caption:[p.title,p.caption].filter(Boolean).join(' · ')})),'/api/gallery/photos'));}
  const videos=gallery.filter(p=>p.kind==='video'&&p.externalUrl);if(videos.length){heading(c('book.design.recordings','Recordings'));for(const v of videos){bodyGroup(el('h3',v.title),el('p',v.caption||''),link(v.externalUrl,v.externalUrl));}}

  section(c('book.design.impactTitle','Ideas for a Brighter Tomorrow'),c('book.design.impactKicker','A lasting impact'),c('life.mentorText'));
  prose(c('life.mentorBody'));if(Number.isSafeInteger(participation.trees))append(el('p',`${participation.trees.toLocaleString()} ${c(participation.trees===1?'home.treeTotalOne':'home.treeTotalMany','trees dedicated in Robert’s memory')}`,'kb-tree-total'));
  prose(content.treeTribute);append(link(SITE.replace('https://','')+'/tree/',SITE+'/tree/'));
  page(c('book.design.thanksTitle','Thank You'),'kb-closing');toc.push({name:c('book.design.thanksTitle','Thank You'),page:pages.length});heading(c('book.design.thanksTitle','Thank You'),2);prose(c('book.design.thanksText','To all who shared their stories, photographs, and memories: thank you for helping keep Robert’s spirit alive.'));quote(c('book.endTitle'));append(link(SITE.replace('https://',''),SITE));current.prepend(img(landscape,'','kb-closing-art'));
  const contents=el('ol',null,'kb-toc');for(const entry of toc){const li=el('li');const a=link(entry.name,`#book-page-${entry.page}`);a.href=`#book-page-${entry.page}`;li.append(a,el('span',entry.page));contents.append(li);}contentsBody.append(contents,el('p',c('book.design.contentsNote','A life. A legacy. A community that carries both forward.'),'kb-contents-note'));
  pages.forEach((p,i)=>{p.id=`book-page-${i+1}`;const footer=p.querySelector('.kb-folio');footer.append(el('span',c('book.design.footer','Robert E. Dickinson · A Memorial Book')),el('span',i+1));});
  // A failed image is reported explicitly; PDF publication rejects missing media.
  await Promise.all([...target.querySelectorAll('img')].map(im=>new Promise(resolve=>{if(im.complete){if(!im.naturalWidth)failed.push(im.src);resolve();return;}const timer=setTimeout(()=>{failed.push(im.src);resolve();},30000);im.addEventListener('load',()=>{clearTimeout(timer);resolve();},{once:true});im.addEventListener('error',()=>{clearTimeout(timer);failed.push(im.src);resolve();},{once:true});}))); 
  const overflow=pages.map((p,i)=>({page:i+1,body:p.querySelector('.kb-body')})).filter(({body})=>body.scrollHeight>body.clientHeight+2||body.scrollWidth>body.clientWidth+2).map(x=>x.page);
  const normalize=text=>String(text||'').normalize('NFKC').replace(/\s+/g,'');
  const printedProse=normalize([...target.querySelectorAll('.kb-prose')].map(p=>p.textContent).join(''));
  const missingStories=memories.filter(m=>m.story&&!printedProse.includes(normalize(m.story)));
  if(missingStories.length)throw new Error('A memory was not completely included in the book.');
  target.dataset.ready='true';target.dataset.pages=String(pages.length);
  const result={pages:pages.length,generatedAt:stamp,failedImages:[...new Set(failed)],overflow,memories:memories.length,galleryPhotos:photos.length,lifePhotos:lifePhotos.length};
  target.dispatchEvent(new CustomEvent('bookready',{bubbles:true,detail:result}));return result;
}
