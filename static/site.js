let disposeMemorialPage = () => {};
function initializeMemorialPage() {
  disposeMemorialPage();
  const lifecycle = new AbortController();
  const cleanups = [];
  disposeMemorialPage = () => { lifecycle.abort(); cleanups.forEach(cleanup => cleanup()); };
  // Delayed responses from a previous page must never repaint the current page.
  const pageDocument = {
    querySelector: selector => lifecycle.signal.aborted ? null : document.querySelector(selector),
    querySelectorAll: selector => lifecycle.signal.aborted ? [] : document.querySelectorAll(selector),
  };
  const listen = (target, event, handler) => target.addEventListener(event, handler, { signal: lifecycle.signal });
  async function pageFetch(url, options = {}) {
    if (lifecycle.signal.aborted) throw new DOMException("Page changed", "AbortError");
    const controller = new AbortController();
    const abort = () => controller.abort();
    const signals = [lifecycle.signal, options.signal].filter(Boolean);
    signals.forEach(signal => { if (signal.aborted) abort(); else signal.addEventListener("abort", abort, { once: true }); });
    try { return await fetch(url, { ...options, signal: controller.signal }); }
    finally { signals.forEach(signal => signal.removeEventListener("abort", abort)); }
  }

  let editableCopy = {};
  const treeText = (key, fallback) => editableCopy[`tree.ui.${key}`] ?? fallback;
  const apiBase = String(window.MEMORIAL_API_BASE || "").replace(/\/$/, "");
  const currentNavPage = location.pathname.split("/").filter(Boolean)[0] || "home";
  pageDocument.querySelectorAll(".site-nav [data-nav]").forEach(link => {
    const active = link.dataset.nav === currentNavPage;
    link.classList.toggle("active", active);
    if (active) link.setAttribute("aria-current", "page");
    else link.removeAttribute("aria-current");
  });
  const mobileMenu = pageDocument.querySelector(".mobile-nav");
  if (mobileMenu instanceof HTMLDetailsElement) {
    listen(document, "keydown", (event) => { if (event.key === "Escape") mobileMenu.open = false; });
    listen(document, "click", (event) => {
      if (mobileMenu.open && !mobileMenu.contains(event.target)) mobileMenu.open = false;
    });
  }
  const form = pageDocument.querySelector("[data-migration-form]");
  const treeForm = pageDocument.querySelector("[data-tree-dedication-form]");
  const tributeReturnBar = pageDocument.querySelector("[data-tribute-return-bar]");
  const tributeReturnLabel = pageDocument.querySelector("[data-tribute-return-label]");
  const tributeRouteLabels = {
    "chippewa-arbor-day": "Chippewa National Forest · Arbor Day Foundation",
    "chippewa-living-tribute": "Minnesota forests · A Living Tribute",
    "minnesota-living-tribute": "Minnesota forests · A Living Tribute",
    "global-one-tree-planted": "Where needed most · One Tree Planted",
    "chippewa-usda": "Chippewa requested · USDA Forest Service",
    "amazon-saving-the-amazon": "Amazon rainforest · Saving The Amazon",
    "brazil-black-jaguar": "Brazil · Black Jaguar Foundation",
  "amazon-tree-nation": "Amazon · Tree-Nation / Rioterra",
    "amazon-conservation": "Amazon · Amazon Conservation",
    "arizona-living-tribute": "Arizona · A Living Tribute",
    "georgia-living-tribute": "Georgia · A Living Tribute",
    "texas-living-tribute": "Texas · A Living Tribute",
    "colorado-csfs": "Colorado · Colorado State Forest Service",
    "california-living-tribute": "California · A Living Tribute",
    "massachusetts-tree-boston": "Boston, Massachusetts · Tree Boston",
    "massachusetts-esplanade": "Massachusetts · Esplanade Association",
    "new-england-neff": "New England · NEFF",
  };
  const updateTributeReturnBar = (route) => {
    if (!(tributeReturnBar instanceof HTMLElement)) return;
    if (!route || !tributeRouteLabels[route]) {
      tributeReturnBar.hidden = true;
      return;
    }
    if (tributeReturnLabel instanceof HTMLElement) tributeReturnLabel.textContent = treeText("returnSelected", "You chose {project}. Return here to record the trees or restoration gift.").replace("{project}", editableCopy[`tree.form.route.${route}`] || tributeRouteLabels[route]);
    tributeReturnBar.hidden = false;
  };
  updateTributeReturnBar(sessionStorage.getItem("livingTributeRoute"));
  listen(window, "livingTributeRouteSelected", (event) => updateTributeReturnBar(event.detail));
  listen(window, "livingTributeRecorded", () => updateTributeReturnBar(""));
  pageDocument.querySelectorAll("[data-contribution-route]").forEach((link) => {
    link.addEventListener("click", () => {
      const route = link.getAttribute("data-contribution-route");
      if (route) {
        sessionStorage.setItem("livingTributeRoute", route);
        window.dispatchEvent(new CustomEvent("livingTributeRouteSelected", { detail: route }));
      }
    });
  });
  const sharePanel = pageDocument.querySelector("details.memory-share-panel");
  const revealShareForm = () => {
    if (location.hash === "#share" && sharePanel instanceof HTMLDetailsElement) sharePanel.open = true;
  };
  revealShareForm();
  listen(window, "hashchange", revealShareForm);
  pageDocument.querySelectorAll('a[href="#share"]').forEach(link => link.addEventListener("click", () => {
    if (sharePanel instanceof HTMLDetailsElement) sharePanel.open = true;
  }));


  const message = pageDocument.querySelector("[data-migration-message]");
  const apiUrl = (path) => `${apiBase}${path}`;
  let mirroredMedia = {};
  let eventPortrait = "/assets/robert-dickinson.jpg";
  const livePayloads = new Map();
  const payloadSignatures = new Map();
  const objectUrl = (path, key) => {
    const resource = `${path}/${String(key).split("/").map(encodeURIComponent).join("/")}`;
    return mirroredMedia[resource] || apiUrl(resource);
  };

  function node(tag, options = {}) {
    const element = document.createElement(tag);
    if (options.className) element.className = options.className;
    if (options.text !== undefined) element.textContent = options.text;
    if (options.attrs) Object.entries(options.attrs).forEach(([key, value]) => element.setAttribute(key, value));
    return element;
  }

  function showMessage(text, success = false) {
    if (!(message instanceof HTMLElement)) return;
    message.hidden = false;
    message.textContent = text;
    message.classList.toggle("form-success", success);
    message.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  async function getJson(path) {
    if (livePayloads.has(path)) return livePayloads.get(path);
    // Events are edited frequently: prefer the saved record, retaining the mirror when unreachable.
    if (path === "/api/events" && !window.MEMORIAL_BOOK_SNAPSHOT) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 5000);
      try {
        const response = await pageFetch(apiUrl(path), { cache: "no-store", signal: controller.signal });
        if (response.ok) {
          const payload = await response.json();
          if (Array.isArray(payload.events)) {
            livePayloads.set(path, payload);
            payloadSignatures.set(path, JSON.stringify(payload));
            return payload;
          }
        }
      } catch {} finally { clearTimeout(timer); }
    }
    const snapshotPath = `/mirror${path}.json`;
    try {
      const response = await pageFetch(snapshotPath, { cache: "no-store" });
      if (response.ok) {
        const snapshot = await response.json();
        payloadSignatures.set(path, JSON.stringify(snapshot));
        return snapshot;
      }
    } catch {}
    const response = await pageFetch(apiUrl(path), { cache: "no-store" });
    if (!response.ok) throw new Error("Unable to load memorial updates.");
    return response.json();
  }

  async function refreshLive(path, renderers) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    try {
      const response = await pageFetch(apiUrl(path), { cache: "no-store", signal: controller.signal });
      if (!response.ok) return;
      const payload = await response.json();
      const listKey = { "/api/memories": "memories", "/api/gallery": "gallery", "/api/events": "events" }[path];
      if (path === "/api/participation") {
        if (!(Number.isFinite(payload?.memories) && Number.isFinite(payload?.trees))) return;
      } else if (listKey) {
        if (!Array.isArray(payload?.[listKey])) return;
      } else if (!payload?.content || typeof payload.content !== "object") {
        return;
      }
      const signature = JSON.stringify(payload);
      if (signature === payloadSignatures.get(path)) return;
      livePayloads.set(path, payload);
      payloadSignatures.set(path, signature);
      // Content must finish first: dependent renderers read its saved labels and image choices.
      for (const render of renderers) { try { await render(); } catch {} }
    } catch {
      // Visitors who cannot reach the service continue to see the same-site mirror.
    } finally {
      clearTimeout(timer);
    }
  }

  function applyPageCopy(copy) {
    if (!copy || typeof copy !== "object") return;
    pageDocument.querySelectorAll("[data-copy]").forEach((element) => {
      if (!(element instanceof HTMLElement)) return;
      const key = element.dataset.copy;
      if (key && typeof copy[key] === "string") {
        const text = key === "life.heroTitle" ? copy[key].replace(/\.\s+(?=A generous spirit)/i, ".\n") : copy[key];
        if (element.textContent !== text) element.textContent = text;
      }
    });
    pageDocument.querySelectorAll("[data-copy-href]").forEach((element) => {
      const key = element.getAttribute("data-copy-href");
      if (key && typeof copy[key] === "string") element.setAttribute("href", copy[key]);
    });
    pageDocument.querySelectorAll("[data-copy-geography]").forEach((element) => {
      const key = element.getAttribute("data-copy-geography");
      if (key && typeof copy[key] === "string") element.setAttribute("data-geography", copy[key]);
    });
    pageDocument.querySelectorAll("[data-copy-placeholder]").forEach((element) => {
      const key = element.getAttribute("data-copy-placeholder");
      if (key && typeof copy[key] === "string") element.setAttribute("placeholder", copy[key]);
    });
    window.dispatchEvent(new Event("memorialCopyUpdated"));
  }

  function applySiteAssets(content) {
    const assets = content && content.siteAssets;
    if (!assets || typeof assets !== "object") return;
    if (assets.portrait) eventPortrait = assets.portrait.objectKey ? objectUrl("/api/site-assets", assets.portrait.objectKey) : `/assets/${String(assets.portrait.asset || "robert-dickinson.jpg").replace(/^\//, "")}`;
    pageDocument.querySelectorAll("[data-site-asset]").forEach((element) => {
      if (!(element instanceof HTMLImageElement)) return;
      const id = element.dataset.siteAsset;
      const asset = id && assets[id];
      if (!asset) return;
      element.src = asset.objectKey ? objectUrl("/api/site-assets", asset.objectKey) : `/assets/${String(asset.asset || "").replace(/^\//, "")}`;
      element.alt = element.getAttribute("aria-hidden") === "true" ? "" : asset.alt || "";
    });
    const main = pageDocument.querySelector("main");
    ["horizon", "lifeBackground", "treeLandscapes"].forEach(id => {
      const asset = assets[id];
      if (!main || !asset) return;
      const src = asset.objectKey ? objectUrl("/api/site-assets", asset.objectKey) : `/assets/${String(asset.asset || "").replace(/^\//, "")}`;
      main.style.setProperty(`--site-${id}`, `url(${JSON.stringify(src)})`);
    });
    const hero = pageDocument.querySelector(".hero");
    if (hero instanceof HTMLElement) {
      hero.classList.remove("hero-portrait-landscape", "hero-portrait-portrait");
      hero.classList.add(assets.portrait?.layout === "portrait" ? "hero-portrait-portrait" : "hero-portrait-landscape");
    }
  }

  function applyTheme(content) {
    const main = pageDocument.querySelector("main");
    if (!(main instanceof HTMLElement)) return;
    if (typeof content.bodyFont === "string") main.dataset.bodyFont = content.bodyFont;
    if (typeof content.headingFont === "string") main.dataset.headingFont = content.headingFont;
  }

  function lifePhotoFigure(photo, showCaption = true) {
    const figure = node("figure", { className: "life-photo" });
    figure.append(node("img", { attrs: { src: objectUrl("/api/life-photos", photo.objectKey), alt: photo.alt || "", loading: "lazy" } }));
    if (showCaption && (photo.date || photo.caption)) {
      const caption = node("figcaption");
      if (photo.date) caption.append(node("span", { text: photo.date }));
      if (photo.caption) caption.append(node("p", { text: photo.caption }));
      figure.append(caption);
    }
    return figure;
  }
  function renderLifePhotos(photos) {
    const target = pageDocument.querySelector("[data-life-photos]");
    if (!(target instanceof HTMLElement)) return;
    const early = (Array.isArray(photos) ? photos : []).filter((photo) => !photo.milestoneId);
    if (!early.length) {
      target.replaceChildren(node("p", { className: "life-photos-empty", text: editableCopy["life.photosEmpty"] || "Photographs from Robert’s early years will be shared here." }));
      return;
    }
    target.replaceChildren(...early.map((photo) => lifePhotoFigure(photo)));
  }
  function illuminateLifeTimeline() {
    const entries = pageDocument.querySelectorAll(".life-reference-entry");
    if (!("IntersectionObserver" in window) || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      entries.forEach((entry) => entry.classList.add("is-reached"));
      return;
    }
    const observer = new IntersectionObserver((changes) => {
      changes.forEach((change) => {
        if (change.isIntersecting) {
          change.target.classList.add("is-reached");
          observer.unobserve(change.target);
        }
      });
    }, { rootMargin: "0px 0px -14% 0px", threshold: 0 });
    cleanups.push(() => observer.disconnect());
    entries.forEach((entry) => observer.observe(entry));
    return () => observer.disconnect();
  }
  function renderLifeTimeline(items, photos = []) {
    const target = pageDocument.querySelector("[data-life-timeline]");
    if (!(target instanceof HTMLElement) || !Array.isArray(items)) return;
    target.replaceChildren(...items.map((item, index) => {
      const article = node("article", { className: "life-scroll-entry life-reference-entry" });
      const date = node("div", { className: "life-reference-date" });
      date.append(node("span", { text: item.year || "" }));
      const photo = photos.find((candidate) => candidate.milestoneId === (item.id || `life-period-${index}`));
      const card = node("div", { className: photo ? "life-reference-card" : "life-reference-card life-reference-no-photo" });
      const copy = node("div", { className: "life-reference-card-copy" });
      copy.append(node("h3", { text: item.title || "" }), node("p", { text: item.text || "" }));
      card.append(copy);
      if (photo) {
        const media = node("div", { className: `life-reference-card-media${(item.id || `life-period-${index}`) === "life-period-6" ? " life-reference-card-media--ucla" : ""}` });
        media.append(lifePhotoFigure(photo));
        card.append(media);
      }
      article.append(date, card);
      return article;
    }));
    illuminateLifeTimeline();
  }

  // Fixed SVG paths only; all owner-authored text continues to use textContent.
  function homeIcon(kind, className = "home-contribution-icon") {
    const paths = {
      globe: '<circle cx="12" cy="12" r="9"/><ellipse cx="12" cy="12" rx="4" ry="9"/><path d="M3 12h18M5 6h14M5 18h14"/>',
      waves: '<path d="M2 6q3-4 6 0t6 0t6 0M2 12q3-4 6 0t6 0t6 0M2 18q3-4 6 0t6 0t6 0"/>',
      bars: '<path d="M3 21h18M5 21V12h3v9M11 21V7h3v14M17 21V3h3v18"/>',
      model: '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3"/><path d="M12 1v3m0 16v3M1 12h3m16 0h3M4 4l2 2m12 12 2 2M4 20l2-2M18 6l2-2"/>',
      leaf: '<path d="M4 21C4 9 12 3 21 3c0 10-7 17-15 14M4 21 16 9"/>',
      satellite: '<path d="m7 8 4-4 9 9-4 4zM3 10l3-3 4 4-3 3zM13 20l3-3 4 4-3 3zM9 17l-5 5M3 17l4 4"/>',
      cap: '<path d="m2 8 10-5 10 5-10 5zM6 10v7q6 5 12 0v-7M22 8v9"/>',
      people: '<circle cx="8" cy="7" r="3"/><circle cx="17" cy="8" r="2.5"/><path d="M1 21v-4a7 7 0 0 1 14 0v4M16 13a6 6 0 0 1 7 6v2"/>'
    };
    const span=node("span",{className,attrs:{"aria-hidden":"true"}});
    span.innerHTML=`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">${paths[kind] || paths.globe}</svg>`;
    return span;
  }
  async function hydrateHomePreviews() {
    const eventTarget=pageDocument.querySelector("[data-home-event]"), galleryTarget=pageDocument.querySelector("[data-home-gallery]");
    if (!eventTarget && !galleryTarget) return;
    await Promise.allSettled([
      (async()=>{if(!eventTarget)return; const {events=[]}=await getJson("/api/events");eventTarget.replaceChildren();
        if(!events.length){eventTarget.append(node("p",{text:editableCopy["home.eventsEmpty"] || "Memorial gatherings and scientific tributes will be shared here."}));return;}
        const event=events[0], card=node("div",{className:"home-event-preview"}), date=new Date(event.startAt);
        const calendar=node("time",{attrs:{datetime:event.startAt}});
        ["month","day","year"].forEach(part=>calendar.append(node("span",{className:`calendar-${part}`,text:new Intl.DateTimeFormat("en-US",{[part]:part==="month"?"short":"numeric",timeZone:"America/Los_Angeles"}).format(date)})));
        card.append(calendar);
        const body=node("div");body.append(node("strong",{text:event.title}),node("span",{text:(event.location||"").split("\n")[0]}));card.append(body,node("span",{className:"home-event-arrow",text:"›",attrs:{"aria-hidden":"true"}}));eventTarget.append(card);
      })(),
      (async()=>{if(!galleryTarget)return;const {gallery=[]}=await getJson("/api/gallery");galleryTarget.replaceChildren();
        gallery.filter(item=>item.kind==="image"&&item.objectKey).slice(0,4).forEach(item=>galleryTarget.append(node("img",{attrs:{src:objectUrl("/api/gallery/photos",item.objectKey),alt:item.title||"",loading:"lazy"}})));
      })()
    ]);
  }

  function renderHomeLegacy(threads, highlights, frontierLabels, copy) {
    const target = pageDocument.querySelector("[data-home-scientific-story]");
    const secondaryTarget = pageDocument.querySelector("[data-home-secondary]");
    const headingThreads = pageDocument.querySelector("[data-home-heading-threads]");
    const threadList = pageDocument.querySelector("[data-home-thread-list]");
    if (!Array.isArray(threads) || !Array.isArray(highlights)) return;
    const frontiers = Array.isArray(frontierLabels) ? frontierLabels : ["Tropical Deforestation", "Carbon & Nitrogen cycling", "Regional Climate Modeling", "Solar Geoengineering", "Canopy Radiative Transfer"];
    const diagramLabels = ["Atmospheric Dynamics", "Climate Change", "Climate Modeling", "Land-Atmosphere Interactions", "Satellite Remote Sensing", "A Coupled Earth"];

    const earthMap=pageDocument.querySelector("[data-home-earth-threads]");
    if(earthMap){
      earthMap.querySelectorAll(".home-thread-card").forEach(card=>card.remove());
      threads.forEach((thread,index)=>{const card=node("article",{className:`home-thread-card home-thread-card-${index+1}`}),body=node("div");body.append(node("h4",{text:thread.title||""}),node("p",{text:thread.text||""}));card.append(homeIcon(["waves","bars","model","leaf","satellite","globe"][index%6],"home-line-icon"),body);earthMap.append(card);});
      pageDocument.querySelectorAll(".home-redesign .tribute-action-icon").forEach((icon,i)=>icon.replaceChildren(homeIcon(i===0?"leaf":"people","")));
    }
    if (headingThreads instanceof HTMLElement) {
      headingThreads.replaceChildren(...threads.map((thread) => node("span", { text: thread.title || "", attrs: { title: thread.text || "" } })));
    }
    if (threadList instanceof HTMLElement) {
      threadList.replaceChildren(...diagramLabels.map((label) => node("li", { text: label })));
      const art = pageDocument.querySelector(".home-thread-art");
      if (art instanceof HTMLElement) art.setAttribute("aria-label", `Six connected research threads: ${diagramLabels.join(", ")}`);
    }

    if (!(target instanceof HTMLElement)) return;
    const stream = node("div", { className: "science-highlight-stream" });
    highlights.forEach((highlight, index) => {
      const article = node("article", { className: "science-highlight" });
      article.append(earthMap ? homeIcon(["globe","bars","leaf","cap"][index % 4]) : node("span", { className: "science-highlight-dot", attrs: { "aria-hidden": "true" } }));
      article.append(node("h3", { text: highlight.title || "" }), node("p", { text: highlight.text || "" }));
      stream.append(article);
    });

    const secondaryIntro = node("div", { className: "science-secondary-intro" });
    const label = copy?.["home.legacyMapSecondary"];
    secondaryIntro.append(node("span", { className: "science-secondary-label", text: !label || label === "Other frontiers" ? "Other frontiers with pioneer contribution" : label }));
    const secondaryTerms = node("div", { className: "science-secondary-terms" });
    frontiers.filter((title) => typeof title === "string" && title.trim()).forEach((title) => {
      secondaryTerms.append(node("span", { text: title }));
    });

    target.replaceChildren(stream);
    if (secondaryTarget instanceof HTMLElement) secondaryTarget.replaceChildren(secondaryIntro, secondaryTerms);
  }

  function chapterPhotoUrl(photo) {
    if (!photo) return "";
    if (photo.objectKey) return objectUrl("/api/chapter-photos", photo.objectKey);
    if (photo.asset) return `/assets/${String(photo.asset).replace(/^\//, "")}`;
    return "";
  }

  function chapterPublications(chapter) {
    if (Array.isArray(chapter?.publications) && chapter.publications.length) return chapter.publications;
    return chapter?.publication ? [chapter.publication] : [];
  }

  function publicationImageUrl(value) {
    return value ? `/assets/${String(value).replace(/^[/]+/, "")}` : "";
  }

  const officialIpccPdf = "https://www.ipcc.ch/site/assets/uploads/2018/02/ar4-wg1-chapter7-1.pdf";
  function publicationPdfUrl(publication) {
    const url = publication.pdfUrl || (String(publication.url || "").includes("ipcc.ch/report/ar4/wg1/coupling-between-changes") ? officialIpccPdf : "");
    return /^https:\/\//i.test(url) ? url : "";
  }

  function renderLegacy(content, copy) {
    const chapters = Array.isArray(content.legacyChapters) ? content.legacyChapters : [];
    if (!chapters.length) return;

    const scale = pageDocument.querySelector("[data-legacy-scale]");
    if (scale instanceof HTMLElement) {
      scale.replaceChildren(...chapters.map((chapter) => {
        const item = node("li");
        item.append(node("span", { text: chapter.number || "" }), node("strong", { text: chapter.scale || "" }), node("small", { text: chapter.institution || "" }));
        return item;
      }));
    }

    const nav = pageDocument.querySelector("[data-legacy-nav]");
    if (nav instanceof HTMLElement) {
      nav.replaceChildren(...chapters.map((chapter) => {
        const link = node("a", { attrs: { href: `#${chapter.id}` } });
        link.append(node("span", { text: chapter.number || "" }), node("b", { text: chapter.scale || "" }), node("small", { text: `${chapter.institution || ""} · ${chapter.years || ""}` }));
        return link;
      }));
    }

    const target = pageDocument.querySelector("[data-legacy-journey]");
    if (target instanceof HTMLElement) {
      target.replaceChildren(...chapters.map((chapter) => {
        const publications = chapterPublications(chapter);
        const article = node("article", { className: "journey-chapter", attrs: { id: chapter.id } });
        const header = node("header");
        const number = node("div", { className: "journey-number", text: chapter.number || "" });
        const titleBlock = node("div");
        const meta = node("p");
        meta.append(document.createTextNode(chapter.institution || ""), node("span", { text: " · " }), document.createTextNode(chapter.years || ""));
        titleBlock.append(meta, node("h3", { text: chapter.title || "" }));
        const focus = node("div", { className: "journey-scale" });
        focus.append(node("small", { text: copy?.["legacy.focusLabel"] || "Scientific focus" }), node("strong", { text: chapter.scale || "" }));
        header.append(number, titleBlock, focus);
        article.append(header, node("p", { className: "journey-summary", text: chapter.summary || "" }));

        const detail = node("div", { className: "journey-detail" });
        const contributions = node("div");
        contributions.append(node("p", { className: "journey-label", text: copy?.["legacy.contributionsLabel"] || "Key contributions" }));
        const list = node("ul");
        (chapter.contributions || []).forEach((item) => list.append(node("li", { text: item })));
        contributions.append(list);
        const legacy = node("blockquote");
        legacy.append(node("p", { className: "journey-label", text: copy?.["legacy.impactLabel"] || "Legacy" }), node("span", { text: chapter.impact || "" }));
        detail.append(contributions, legacy);
        article.append(detail);

        const imageSrc = chapterPhotoUrl(chapter.photo);
        if (publications.length) {
          const landmarkWork = node("section", { className: "landmark-work", attrs: { "aria-label": `Landmark publications from ${chapter.institution || ""}` } });
          landmarkWork.append(node("p", { className: "journey-label", text: copy?.["legacy.publicationLabel"] ?? "Landmark Publication" }));
          const grid = node("div", { className: `landmark-grid ${publications.length === 1 ? "single" : ""}` });
          publications.forEach((publication) => {
            const card = node("article", { className: "landmark-paper-card" });
            const preview = publicationImageUrl(publication.image);
            if (preview) {
              card.append(node("img", { attrs: { src: preview, alt: "", "aria-hidden": "true", loading: "lazy" } }));
            }
            const caption = node("div", { className: "landmark-paper-caption" });
            caption.append(node("span", { className: "landmark-paper-year", text: publication.year || "" }),
              node("h4", { text: publication.title || "" }), node("cite", { text: publication.citation || "" }),
              node("p", { text: publication.note || "" }));
            const actions = node("div", { className: "landmark-paper-actions" });
            if (/^https:\/\//i.test(publication.url || "")) actions.append(node("a", { text: copy?.["legacy.publicationLink"] ?? "Open publication page ↗", attrs: { href: publication.url, target: "_blank", rel: "noopener noreferrer" } }));
            const pdfUrl = publicationPdfUrl(publication);
            if (pdfUrl && pdfUrl !== publication.url) actions.append(node("a", { text: copy?.["legacy.pdfLink"] ?? "Open PDF ↗", attrs: { href: pdfUrl, target: "_blank", rel: "noopener noreferrer", type: "application/pdf" } }));
            if (actions.childNodes.length) caption.append(actions);
            card.append(caption);
            grid.append(card);
          });
          landmarkWork.append(grid);
          article.append(landmarkWork);
        }
        if (imageSrc && chapter.photo) {
          const figure = node("figure", { className: "journey-chapter-photo" });
          figure.append(node("img", { attrs: { src: imageSrc, alt: chapter.photo.alt || "", loading: "lazy" } }));
          const caption = node("figcaption", { text: chapter.photo.caption || "" });
          caption.append(node("small", { text: copy?.["legacy.photoCredit"] || "Photo shared for the Robert E. Dickinson memorial." }));
          figure.append(caption);
          article.append(figure);
        }

        const tags = node("div", { className: "journey-tags" });
        (chapter.threads || []).forEach((thread) => tags.append(node("span", { text: thread })));
        article.append(tags);
        return article;
      }));
    }

    const threadTarget = pageDocument.querySelector("[data-legacy-threads]");
    if (threadTarget instanceof HTMLElement && Array.isArray(content.legacyThreads)) {
      threadTarget.replaceChildren(...content.legacyThreads.map((thread, index) => {
        const article = node("article");
        article.append(node("span", { text: String(index + 1).padStart(2, "0") }), node("h4", { text: thread.title || "" }), node("p", { text: thread.text || "" }));
        return article;
      }));
    }

    const frontierTarget = pageDocument.querySelector("[data-legacy-frontiers]");
    if (frontierTarget instanceof HTMLElement && Array.isArray(content.secondaryLegacyTopics)) {
      frontierTarget.replaceChildren(...content.secondaryLegacyTopics.map((topic) => {
        const article = node("article");
        article.append(node("span", { text: "•", attrs: { "aria-hidden": "true" } }));
        const body = node("div");
        body.append(node("h4", { text: topic.title || "" }), node("p", { text: topic.text || "" }));
        article.append(body);
        return article;
      }));
    }

    const honors = pageDocument.querySelector("[data-legacy-honors]");
    if (honors instanceof HTMLElement && Array.isArray(content.honors)) {
      honors.replaceChildren(...content.honors.map((honor) => {
        const item = node("div", { className: "honor-item" });
        item.append(node("span", { text: honor.year || "" }), node("strong", { text: honor.title || "" }), node("small", { text: honor.detail || "" }));
        return item;
      }));
    }
    const honorsNote = pageDocument.querySelector("[data-honors-note]");
    if (honorsNote instanceof HTMLElement && typeof content.honorsNote === "string") honorsNote.textContent = content.honorsNote;
  }

  illuminateLifeTimeline();

  async function hydrateContent() {
    const { content } = await getJson("/api/content");
    if (!content || typeof content !== "object") return;
    editableCopy = { ...content.pageCopy };
    if (editableCopy["memories.formPhoto"] === "Add a photo") editableCopy["memories.formPhoto"] = "Add up to three photos";
    if (editableCopy["memories.formPhotoHelp"] === "JPG, PNG or WebP · up to 8 MB") editableCopy["memories.formPhotoHelp"] = "Up to 3 photos · JPG, PNG or WebP · 8 MB each";
    applyTheme(content);
    applyPageCopy(editableCopy);
    applySiteAssets(content);

    Object.entries(content).forEach(([key, value]) => {
      const targets = pageDocument.querySelectorAll(`[data-content="${key}"]`);
      targets.forEach((target) => {
        if (!(target instanceof HTMLElement) || typeof value !== "string") return;
        if (key === "obituaryStory") target.replaceChildren(...value.split(/\n\s*\n/).filter(Boolean).map((paragraph, index) => node("p", { className: index === 0 ? "lead" : "", text: paragraph })));
        else target.textContent = value;
      });
      const preview = pageDocument.querySelector(`[data-content-preview="${key}"]`);
      if (preview instanceof HTMLElement && typeof value === "string" && key === "obituaryStory") {
        const paragraphs = value.split(/\n\s*\n/).filter(Boolean).slice(0, 2).map((paragraph, index) => node("p", { className: index === 0 ? "lead" : "", text: paragraph }));
        const link = node("a", { className: "text-link", text: `${editableCopy["home.storyReadLink"] || "Read Robert’s full story"} →`, attrs: { href: "./life/" } });
        preview.replaceChildren(...paragraphs, link);
      }
    });

    renderHomeLegacy(content.legacyThreads, content.homeLegacyCards, content.homeFrontierLabels, content.pageCopy);
    renderLifeTimeline(content.lifeMilestones, content.lifePhotos || []);
    renderLifePhotos(content.lifePhotos);
    renderLegacy(content, content.pageCopy);
  }

  let eventFilter = "upcoming";
  async function hydrateEvents() {
    const target = pageDocument.querySelector("[data-events]");
    if (!(target instanceof HTMLElement)) return;
    const { events = [] } = await getJson("/api/events");
    const defaults = {"upcoming": "Upcoming", "past": "Past events", "all": "All events", "emptyUpcoming": "No upcoming events have been announced.", "emptyPast": "Past gatherings will appear here after they take place.", "emptyAll": "No events have been announced yet.", "calendar": "Add to calendar", "details": "Event information", "directions": "Get directions", "planning": "Planning to attend?", "planningIntro": "Find the information you need for joining us in person or online.", "venueTitle": "Venue & parking", "venueText": "The venue, address, and available parking information are listed with each event.", "onlineTitle": "Join online", "onlineText": "Use the livestream link on the event card to join remotely.", "rememberTitle": "Continue his legacy", "rememberText": "Remember Robert through a tree planted or a memory shared.", "tree": "Plant a Tree", "memory": "Share a Memory"};
    const c = key => editableCopy[`events.design.${key}`] ?? defaults[key];
    const date = (v, opts) => new Intl.DateTimeFormat("en-US", {timeZone:"America/Los_Angeles",...opts}).format(new Date(v));
    const bar=node("div",{className:"event-filter-bar",attrs:{role:"group","aria-label":"Filter events"}});
    ["upcoming","past","all"].forEach(f=>{const b=node("button",{text:c(f),attrs:{type:"button","aria-pressed":String(eventFilter===f)}});b.onclick=()=>{eventFilter=f;hydrateEvents();};bar.append(b);});
    const list=node("div",{className:"event-feature-list",attrs:{"aria-live":"polite"}});
    const visible=events.filter(e=>eventFilter==="all"||(eventFilter==="past")===(Date.parse(e.endAt||e.startAt)<Date.now()));
    if(!visible.length)list.append(node("p",{className:"events-empty",text:c("empty"+eventFilter[0].toUpperCase()+eventFilter.slice(1))}));
    visible.forEach(e=>{
      const article=node("article",{className:"event-feature"}),photo=node("div",{className:"event-feature-photo"});
      const img=node("img",{attrs:{src:eventPortrait,alt:"Robert E. Dickinson","data-site-asset":"portrait"}});
      const badge=node("div",{className:"event-date-badge"});badge.append(node("span",{text:date(e.startAt,{month:"short"})}),node("strong",{text:date(e.startAt,{day:"numeric"})}),node("span",{text:date(e.startAt,{year:"numeric"})}));photo.append(img,badge);
      const body=node("div",{className:"event-feature-copy"});body.append(node("p",{className:"section-kicker",text:c("details")}),node("h3",{text:e.title}),node("time",{text:date(e.startAt,{weekday:"long",month:"long",day:"numeric",year:"numeric"})+"\n"+date(e.startAt,{timeStyle:"short"})+(e.endAt?" – "+date(e.endAt,{timeStyle:"short"}):"")+" Pacific Time",attrs:{datetime:e.startAt}}));
      if(e.location)body.append(node("p",{className:"event-venue",text:e.location}));
      const actions=node("div",{className:"event-actions"});
      if(e.linkUrl)actions.append(node("a",{className:"event-primary",text:(e.linkLabel||editableCopy["events.defaultLink"]||"Event details")+" ↗",attrs:{href:e.linkUrl,target:"_blank",rel:"noopener noreferrer"}}));
      const cal=node("button",{text:c("calendar")+" ↓",attrs:{type:"button"}});cal.onclick=()=>{
        const escape=v=>v.replace(/\\/g,"\\\\").replace(/\r?\n/g,"\\n").replace(/,/g,"\\,").replace(/;/g,"\\;");
        const stamp=v=>new Date(v).toISOString().replace(/[-:]/g,"").replace(/\.\d{3}/,"");
        const lines=["BEGIN:VCALENDAR","VERSION:2.0","PRODID:-//Robert Dickinson Memorial//Events//EN","BEGIN:VEVENT",`UID:memorial-${e.id}@robert-dickinson-memorial.github.io`,`DTSTAMP:${stamp(new Date().toISOString())}`,`DTSTART:${stamp(e.startAt)}`,...(e.endAt?[`DTEND:${stamp(e.endAt)}`]:[]),`SUMMARY:${escape(e.title)}`,`LOCATION:${escape(e.location||"")}`,`DESCRIPTION:${escape((e.description||"")+"\n"+(e.linkUrl||""))}`,"END:VEVENT","END:VCALENDAR"];
        const url=URL.createObjectURL(new Blob([lines.join("\r\n")+"\r\n"],{type:"text/calendar;charset=utf-8"}));const a=node("a",{attrs:{href:url,download:`robert-dickinson-event-${e.id}.ics`}});a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
      };actions.append(cal);
      if(e.location)actions.append(node("a",{text:c("directions")+" ↗",attrs:{href:"https://www.google.com/maps/search/?api=1&query="+encodeURIComponent(e.location),target:"_blank",rel:"noopener noreferrer"}}));body.append(actions);
      if(e.description){const story=node("div",{className:"event-story"});e.description.split(/(https?:\/\/[^\s]+)/g).forEach(p=>{story.append(/^https?:\/\//.test(p)?node("a",{text:p==="https://robert-dickinson-memorial.github.io/"?"Robert’s memorial website ↗":p,attrs:{href:p,target:"_blank",rel:"noopener noreferrer"}}):document.createTextNode(p));});body.append(story);}
      article.append(photo,body);list.append(article);
    });
    const planning=node("aside",{className:"event-planning"});planning.append(node("h2",{text:c("planning")}),node("p",{text:c("planningIntro")}));const grid=node("div",{className:"event-planning-grid"});["venue","online","remember"].forEach(k=>{const item=node("div");item.append(node("h3",{text:c(k+"Title")}),node("p",{text:c(k+"Text")}));if(k==="remember"){const links=node("div",{className:"event-remembrance"});links.append(node("a",{text:c("tree")+" →",attrs:{href:"/tree/"}}),node("a",{text:c("memory")+" →",attrs:{href:"/memories/"}}));item.append(links);}grid.append(item);});planning.append(grid);target.replaceChildren(bar,list,planning);
  }

  function videoEmbedUrl(value) {
    try {
      const url = new URL(value);
      if (url.hostname === "youtu.be") return `https://www.youtube-nocookie.com/embed/${url.pathname.slice(1)}`;
      if (url.hostname.endsWith("youtube.com") && url.searchParams.get("v")) return `https://www.youtube-nocookie.com/embed/${url.searchParams.get("v")}`;
      if (url.hostname === "vimeo.com") return `https://player.vimeo.com/video/${url.pathname.split("/").filter(Boolean)[0]}`;
    } catch {}
    return "";
  }

  let galleryDecade = "all", galleryOrder = "oldest", galleryLimit = 12;
  const galleryYear = item => {
    for(const text of [item.title,item.caption||""]){const match=String(text).match(/(?:^|[^\d])((?:18|19|20|21)\d{2})(?!\d)/);if(match)return Number(match[1]);}return null;
  };
  async function hydrateGallery() {
    const target=pageDocument.querySelector("[data-gallery]");if(!(target instanceof HTMLElement)||target.querySelector('dialog[open]'))return;
    const {gallery=[]}=await getJson("/api/gallery");
    const defaults={"title": "Photos by year", "all": "All years", "oldest": "Oldest first", "newest": "Newest first", "sort": "Photo order", "more": "Load more photos", "undated": "Year unknown", "close": "Close", "previous": "Previous", "next": "Next", "open": "View full photograph", "none": "No photographs in this selection."},c=k=>editableCopy[`gallery.design.${k}`]??defaults[k];
    const decades=[...new Set(gallery.map(galleryYear).filter(y=>y!==null).map(y=>Math.floor(y/10)*10))].sort((a,b)=>a-b);
    const filtered=gallery.filter(i=>galleryDecade==="all"||String(Math.floor((galleryYear(i)??-1)/10)*10)===galleryDecade).sort((a,b)=>{const x=galleryYear(a),y=galleryYear(b);return x===null?(y===null?a.id-b.id:1):y===null?-1:(galleryOrder==="oldest"?x-y:y-x)||a.id-b.id;});
    const filters=node("div",{className:"gallery-year-filters",attrs:{role:"group","aria-label":"Filter by decade"}});
    ["all",...decades.map(String)].forEach(d=>{const b=node("button",{text:d==="all"?c("all"):d+"s",attrs:{type:"button","aria-pressed":String(galleryDecade===d)}});b.onclick=()=>{galleryDecade=d;galleryLimit=12;hydrateGallery();};filters.append(b);});
    const toolbar=node("div",{className:"gallery-toolbar"}),sort=node("select",{attrs:{"aria-label":c("sort")}});["oldest","newest"].forEach(o=>sort.append(node("option",{text:c(o),attrs:{value:o}})));sort.value=galleryOrder;sort.onchange=()=>{galleryOrder=sort.value;galleryLimit=12;hydrateGallery();};toolbar.append(node("h2",{text:c("title")}),sort);
    const grid=node("div",{className:"gallery-photo-grid"}),photos=filtered.filter(i=>i.kind==="image"&&i.objectKey),dialog=node("dialog",{className:"gallery-viewer",attrs:{"aria-label":c("open")}});
    let selected=0,opener;
    function drawViewer(){const item=photos[selected];const close=node("button",{className:"gallery-viewer-close",text:c("close")+" ×",attrs:{type:"button"}});close.onclick=()=>dialog.close();dialog.replaceChildren(close,node("img",{attrs:{src:objectUrl("/api/gallery/photos",item.objectKey),alt:item.title}}),node("h2",{text:item.title}));if(item.caption)dialog.append(node("p",{text:item.caption}));const nav=node("div",{className:"gallery-viewer-nav"}),prev=node("button",{text:"← "+c("previous"),attrs:{type:"button"}}),next=node("button",{text:c("next")+" →",attrs:{type:"button"}});prev.disabled=selected===0;next.disabled=selected===photos.length-1;prev.onclick=()=>{selected--;drawViewer();};next.onclick=()=>{selected++;drawViewer();};nav.append(prev,node("span",{text:`${selected+1} / ${photos.length}`}),next);dialog.append(nav);}
    dialog.addEventListener("click",e=>{if(e.target===dialog)dialog.close();});dialog.addEventListener("close",()=>opener?.focus());
    filtered.slice(0,galleryLimit).forEach(item=>{
      const figure=node("figure",{className:"gallery-tile"});
      if(item.kind==="image"&&item.objectKey){const button=node("button",{className:"gallery-photo-button",attrs:{type:"button","aria-label":c("open")+": "+item.title}});button.append(node("img",{attrs:{src:objectUrl("/api/gallery/photos",item.objectKey),alt:item.title,loading:"lazy"}}));button.onclick=()=>{opener=button;selected=photos.findIndex(p=>p.id===item.id);drawViewer();dialog.showModal();};figure.append(button);}
      if(item.kind==="video"&&item.externalUrl){const embed=videoEmbedUrl(item.externalUrl);figure.append(embed?node("iframe",{attrs:{src:embed,title:item.title,loading:"lazy",allowfullscreen:""}}):node("a",{className:"video-link",text:editableCopy["gallery.watchVideo"]||"Watch video ↗",attrs:{href:item.externalUrl,target:"_blank",rel:"noopener noreferrer"}}));}
      const caption=node("figcaption");caption.append(node("span",{className:"gallery-year",text:galleryYear(item)??c("undated")}),node("strong",{text:item.title}));if(item.caption)caption.append(node("span",{text:item.caption}));figure.append(caption);grid.append(figure);
    });
    target.replaceChildren(filters,toolbar,grid,dialog);
    if(!filtered.length)target.append(node("p",{className:"gallery-designed-empty",text:gallery.length?c("none"):(editableCopy["gallery.empty"]||"No photos have been added yet.")}));
    if(galleryLimit<filtered.length){const more=node("button",{className:"gallery-load-more",text:c("more")+" ↓",attrs:{type:"button"}});more.onclick=()=>{galleryLimit+=12;hydrateGallery();};target.append(more);}
    target.append(node("a",{className:"gallery-book-link",text:(editableCopy["gallery.bookButton"]||"Turn photos into a book")+" →",attrs:{href:"/memory-book/"}}));
  }

  let memorySnippetObserver;
  cleanups.push(() => memorySnippetObserver?.disconnect());
  async function hydrateMemories() {
    const wallTarget = pageDocument.querySelector("[data-memory-wall]");
    if (!(wallTarget instanceof HTMLElement)) return;
    const [{ memories = [] }, { content = {} }] = await Promise.all([
      getJson("/api/memories"),
      getJson("/api/content"),
    ]);
    const copy = content.pageCopy || editableCopy || {};

    if (wallTarget instanceof HTMLElement) {
      if (!memories.length) {
        wallTarget.replaceChildren(node("p", { className: "memories-empty", text: copy["memories.emptyText"] || "Approved community memories will appear here." }));
      } else {
        const priority = (memory) => memory.id === 11 ? 0 :
          /^(haishan|hanshan) chen$/i.test(String(memory.name || "").trim().replace(/\s+/g, " ")) ? 1 :
          /^david schimel$/i.test(String(memory.name || "").trim().replace(/\s+/g, " ")) ? 2 :
          /^xubin zeng$/i.test(String(memory.name || "").trim().replace(/\s+/g, " ")) ? 3 :
          /^kaicun wang$/i.test(String(memory.name || "").trim().replace(/\s+/g, " ")) ? 4 : 5;
        const orderedMemories = [...memories].sort((a, b) =>
          priority(a) - priority(b) ||
          String(a.createdAt || "").localeCompare(String(b.createdAt || "")) ||
          Number(a.id || 0) - Number(b.id || 0));
        wallTarget.replaceChildren(...orderedMemories.map((memory) => {
          const article = node("article", { className: "memory-card", attrs: { id: `memory-${memory.id}` } });
          const author = node("header", { className: "memory-author" });
          const initials = memory.name.trim().split(/\s+/).filter(Boolean).slice(0, 2).map(part => part[0]).join("");
          const identity = node("div");
          identity.append(node("strong", { text: memory.name }), node("span", { text: memory.relationship }));
          author.append(node("span", { className: "memory-author-mark", text: initials, attrs: { "aria-hidden": "true" } }), identity);
          article.append(author);
          const media = node("div", { className: "memory-card-media" });
          if (memory.videoKey) {
            media.append(node("video", { attrs: { src: objectUrl("/api/memory-videos", memory.videoKey), controls: "", playsinline: "", preload: "metadata", class: "memory-video", "aria-label": memory.title } }));
          } else {
            for (const key of [memory.photoKey, memory.photo2Key, memory.photo3Key].filter(Boolean)) media.append(node("img", { attrs: { src: objectUrl("/api/photos", key), alt: `Shared by ${memory.name}`, loading: "lazy" } }));
          }
          if (media.childElementCount) article.append(media);
          article.append(node("h3", { text: memory.title }));
          if (memory.story) {
            const longStory = memory.story.length > 420;
            const story = node("p", { className: `memory-story${longStory ? " is-collapsed" : ""}`, text: memory.story, attrs: { id: `memory-story-${memory.id}` } });
            const storySpace = node("div", { className: "memory-story-space" });
            storySpace.append(story);
            article.append(storySpace);
            {
              const reader = node("dialog", { className: "memory-reader", attrs: { "aria-labelledby": `memory-reader-title-${memory.id}` } });
              const close = node("button", { className: "memory-reader-close", text: "Close ×", attrs: { type: "button", "aria-label": "Close full memory" } });
              reader.append(close, node("p", { className: "memory-reader-author", text: `${memory.name} · ${memory.relationship}` }),
                node("h2", { text: memory.title, attrs: { id: `memory-reader-title-${memory.id}` } }),
                node("p", { className: "memory-reader-story", text: memory.story }));
              const toggle = node("button", { className: "memory-read-more", text: "Read full story", attrs: { type: "button", "aria-haspopup": "dialog" } });
              toggle.addEventListener("click", () => reader.showModal());
              close.addEventListener("click", () => reader.close());
              reader.addEventListener("click", (event) => { if (event.target === reader) reader.close(); });
              reader.addEventListener("close", () => toggle.focus());
              storySpace.append(toggle);
              article.append(reader);
            }
          }
          if (memory.videoKey) article.append(node("a", { text: "Watch the shared video ↗", attrs: { href: objectUrl("/api/memory-videos", memory.videoKey), target: "_blank", rel: "noopener noreferrer" } }));
          if (memory.pdfKey || memory.socialUrl) {
            const attachments = node("div", { className: "memory-attachments" });
            if (memory.pdfKey) attachments.append(node("a", { text: `▤ ${copy["memories.pdfLink"] || "Read the shared PDF"}`, attrs: { href: objectUrl("/api/memory-files", memory.pdfKey), target: "_blank", rel: "noopener noreferrer" } }));
            if (memory.socialUrl) attachments.append(node("a", { text: `↗ ${copy["memories.socialLink"] || "View the shared public post"}`, attrs: { href: memory.socialUrl, target: "_blank", rel: "noopener noreferrer nofollow ugc" } }));
            article.append(attachments);
          }
          return article;
        }));
        memorySnippetObserver?.disconnect();
        const spaces = [...wallTarget.querySelectorAll(".memory-story-space")];
        const fitSnippet = (space) => {
          const story = space.querySelector(".memory-story");
          if (!story || !space.isConnected || lifecycle.signal.aborted) return;
          const lineHeight = parseFloat(getComputedStyle(story).lineHeight);
          const action = space.querySelector(".memory-read-more");
          const actionHeight = action ? action.getBoundingClientRect().height + 8 : 0;
          const lines = Math.max(1, Math.floor((space.getBoundingClientRect().height - actionHeight - 0.5) / lineHeight));
          story.style.webkitLineClamp = String(lines);
        };
        memorySnippetObserver = new ResizeObserver(entries => entries.forEach(entry => fitSnippet(entry.target)));
        spaces.forEach(space => { fitSnippet(space); memorySnippetObserver.observe(space); });
        document.fonts.ready.then(() => spaces.forEach(fitSnippet));

      }
    }
  }

  async function hydrateParticipation() {
    if (!pageDocument.querySelector("[data-participation-count]")) return;
    const counts = await getJson("/api/participation");
    pageDocument.querySelectorAll("[data-participation-count]").forEach((element) => {
      const kind = element.getAttribute("data-participation-count");
      const count = counts[kind];
      if (!Number.isSafeInteger(count) || count < 0) return;
      let label = kind === "trees"
        ? (editableCopy[count === 1 ? "home.treeTotalOne" : "home.treeTotalMany"] ?? `${count === 1 ? "tree dedicated" : "trees dedicated"} in Robert’s memory`)
        : (editableCopy[count === 1 ? "home.memoryTotalOne" : "home.memoryTotalMany"] ?? (count === 1 ? "memory shared" : "memories shared"));
      if (kind === "trees" && Number.isSafeInteger(counts.restorationGifts) && counts.restorationGifts > 0) label += " · " + (editableCopy[counts.restorationGifts === 1 ? "home.restorationTotalOne" : "home.restorationTotalMany"] ?? "{count} additional restoration gifts").replace("{count}", counts.restorationGifts);
      if (element.hasAttribute("data-count-only")) {
        element.textContent = count.toLocaleString();
        const gifts = pageDocument.querySelector("[data-restoration-total]");
        if (gifts) gifts.textContent = counts.restorationGifts > 0 ? treeText("restorationTotal", "Plus {count} forest-restoration gifts").replace("{count}", counts.restorationGifts) : "";
      } else element.replaceChildren(node("strong", { text: count }), document.createTextNode(` ${label}`));
      element.hidden = false;
    });
  }


  let bookRenderSequence = 0;
  let bookRenderQueue = Promise.resolve();
  async function hydrateMemoryBook() {
    const target = pageDocument.querySelector("[data-memory-book]");
    if (!target) return;
    const sequence = ++bookRenderSequence;
    const status = pageDocument.querySelector("[data-book-status]");
    const button = pageDocument.querySelector("[data-book-print]");
    const [{content}, {memories=[]}, {gallery=[]}, participation] = await Promise.all([
      getJson("/api/content"), getJson("/api/memories"), getJson("/api/gallery"), getJson("/api/participation").catch(()=>({}))
    ]);
    if (sequence !== bookRenderSequence || lifecycle.signal.aborted) return;
    const version = new URL(document.querySelector('script[src*="site.js"]').src).search;
    const {renderMemoryBook} = await import('/memory-book.js' + version);
    if (sequence !== bookRenderSequence || lifecycle.signal.aborted) return;
    if (button) button.disabled = true;
    try {
      const printImages = await pageFetch("/memory-book/print-images.json",{cache:"no-store"}).then(r=>r.ok?r.json():{}).catch(()=>({}));
      const result = await (bookRenderQueue = bookRenderQueue.catch(()=>{}).then(()=>{
        if(sequence!==bookRenderSequence||lifecycle.signal.aborted)return null;
        return renderMemoryBook(target,{content,memories,gallery,participation},{mediaUrl:objectUrl,imageUrl:src=>printImages[src]||src,generatedAt:window.MEMORIAL_BOOK_GENERATED_AT});
      }));
      if(!result)return;
      if (sequence !== bookRenderSequence || lifecycle.signal.aborted) return;
      window.__memorialBookReady = result;
      const c=content.pageCopy||{};
      if (status) status.textContent=result.failedImages.length ? (c["book.design.imageWarning"]||"Some photographs could not load. Please refresh before printing.") : (c["book.design.ready"]||"{pages} pages ready to print.").replace("{pages}",result.pages);
      if (button) button.disabled=Boolean(result.failedImages.length || result.overflow.length);
    } catch(error) {
      window.__memorialBookError=String(error);
      if(status)status.textContent=content.pageCopy?.["book.design.error"]||"The book could not be prepared. Please try refreshing.";
      throw error;
    }
  }
  const bookPrint=pageDocument.querySelector("[data-book-print]");
  if(bookPrint)listen(bookPrint,"click",()=>window.print());
  const bookRefresh=pageDocument.querySelector("[data-book-refresh]");
  if(bookRefresh)listen(bookRefresh,"click",async()=>{await refreshPublicData();await hydrateMemoryBook();});
  const scaleBook=()=>{const viewport=pageDocument.querySelector('.keepsake-viewport');if(viewport)viewport.style.setProperty('--book-preview-scale',Math.min(1,viewport.clientWidth/816));};
  scaleBook();listen(window,'resize',scaleBook);

  if (!apiBase) {
    if (form instanceof HTMLFormElement) form.addEventListener("submit", (event) => { event.preventDefault(); showMessage("Online submissions are temporarily paused while the private review service is being connected. No information was sent or stored."); });
    if (treeForm instanceof HTMLFormElement) treeForm.addEventListener("submit", (event) => { event.preventDefault(); const status = treeForm.querySelector("[data-tree-dedication-message]"); if (status) { status.textContent = treeText("formUnavailable", "Dedication reporting is temporarily unavailable."); status.hidden = false; } });
    return;
  }

  if (treeForm instanceof HTMLFormElement) {
    const routeSelect = treeForm.querySelector("[data-tree-route-select]");
    const countField = treeForm.querySelector("[data-tree-count-field]");
    const countInput = countField?.querySelector('input[name="treeCount"]');
    const countGuidance = treeForm.querySelector("[data-tree-count-guidance]");
    const geographyGuidance = treeForm.querySelector("[data-tree-geography-guidance]");

    const updateTreeRoute = () => {
      if (!(routeSelect instanceof HTMLSelectElement)) return;
      const selected = routeSelect.selectedOptions[0];
      const type = selected?.dataset.type || "";
      const isTree = type === "tree";
      const geography = selected?.dataset.geography || "";
      if (geographyGuidance instanceof HTMLElement) {
        geographyGuidance.hidden = !geography;
        geographyGuidance.textContent = geography ? `${treeText("formLocation", "Location recorded:")} ${geography}` : "";
      }
      if (countField instanceof HTMLElement) countField.hidden = type === "restoration";
      if (countInput instanceof HTMLInputElement) {
        countInput.required = isTree;
        if (!isTree) {
          countInput.value = "1";
          countInput.max = "10000";
        } else if (selected?.value === "massachusetts-tree-boston") {
          countInput.min = "1";
          countInput.max = "1";
          countInput.value = "1";
        } else {
          countInput.min = "1";
          countInput.max = "10000";
          if (!countInput.value) countInput.value = "1";
        }
      }
      if (countGuidance instanceof HTMLElement) {
        if (!type) {
          countGuidance.hidden = true;
          countGuidance.textContent = "";
        } else if (isTree) {
          countGuidance.hidden = false;
          countGuidance.textContent = selected?.value === "massachusetts-tree-boston"
            ? treeText("formGuidanceBoston", "Choose one of Tree Boston’s listed one-tree options ($100, $500, or $1,000), then record 1 tree. Other donation amounts should not be converted into a tree count.")
            : treeText("formGuidanceTrees", "Enter only the exact number of trees stated by the provider or, for Colorado’s official fund, the quantity implied by its published $2-per-seedling conversion.");
        } else {
          countGuidance.hidden = false;
          countGuidance.textContent = treeText("formGuidanceGift", "This provider does not assign a defensible exact tree quantity. Your successful gift will be preserved as a forest-restoration contribution and will not be converted into a guessed number of trees.");
        }
      }
    };

    if (routeSelect instanceof HTMLSelectElement) {
      const rawSavedRoute = sessionStorage.getItem("livingTributeRoute");
      const savedRoute = rawSavedRoute === "chippewa-living-tribute" ? "minnesota-living-tribute" : rawSavedRoute;
      if (savedRoute && Array.from(routeSelect.options).some((option) => option.value === savedRoute)) routeSelect.value = savedRoute;
      routeSelect.addEventListener("change", updateTreeRoute);
      listen(window, "livingTributeRouteSelected", (event) => {
        const rawRoute = event.detail;
        const route = rawRoute === "chippewa-living-tribute" ? "minnesota-living-tribute" : rawRoute;
        if (typeof route === "string" && Array.from(routeSelect.options).some((option) => option.value === route)) {
          routeSelect.value = route;
          updateTreeRoute();
        }
      });
      updateTreeRoute();
      listen(window, "memorialCopyUpdated", updateTreeRoute);
    }

    treeForm.querySelectorAll("[data-tree-step]").forEach((button) => button.addEventListener("click", () => {
      if (!(countInput instanceof HTMLInputElement)) return;
      countInput.value = String(Math.min(Number(countInput.max), Math.max(1, (Number(countInput.value) || 1) + Number(button.dataset.treeStep))));
    }));
    let treeSubmitting = false;
    treeForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      if (treeSubmitting) return;
      treeSubmitting = true;
      const status = treeForm.querySelector("[data-tree-dedication-message]");
      const button = treeForm.querySelector('button[type="submit"]');
      const data = new FormData(treeForm);
      const selected = routeSelect instanceof HTMLSelectElement ? routeSelect.selectedOptions[0] : null;
      const isTree = selected?.dataset.type === "tree";
      if (status instanceof HTMLElement) status.classList.remove("is-success", "is-error");
      if (button) { button.disabled = true; button.textContent = treeText("formBusy", "Recording…"); }
      try {
        const response = await pageFetch(apiUrl("/api/participation"), {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            name: data.get("name"),
            email: data.get("email"),
            route: data.get("route"),
            treeCount: isTree ? data.get("treeCount") : null,
            confirmationRef: data.get("confirmationRef"),
            confirmed: data.get("confirmed") === "on",
            website: data.get("website"),
          }),
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || treeText("formError", "Unable to record the tribute. Please try again."));
        treeForm.reset();
        sessionStorage.removeItem("livingTributeRoute");
        window.dispatchEvent(new CustomEvent("livingTributeRecorded"));
        updateTreeRoute();
        refreshLive("/api/participation", [hydrateParticipation]);
        if (status instanceof HTMLElement) {
          status.textContent = result.contributionType === "tree"
            ? "✓ " + treeText("formSuccessTrees", "Thank you — your contribution has been successfully recorded. Your trees are now included in Robert’s living-tribute total.")
            : "✓ " + treeText("formSuccessGift", "Thank you — your contribution has been successfully recorded in Robert’s living tribute.");
          status.classList.add("is-success");
          window.setTimeout(() => status.scrollIntoView({ behavior: "smooth", block: "center" }), 0);
        }
      } catch (error) {
        if (status instanceof HTMLElement) {
          status.textContent = error.message || "Please try again.";
          status.classList.add("is-error");
        }
      } finally {
        if (status) status.hidden = false;
        treeSubmitting = false;
        if (button) { button.disabled = false; button.textContent = treeText("formSubmit", "Record my trees →"); }
      }
    });
  }

  const mirrorReady = pageFetch("/mirror/manifest.json", { cache: "no-store" })
    .then((response) => response.ok ? response.json() : { media: {} })
    .then((manifest) => { mirroredMedia = manifest.media || {}; })
    .catch(() => {});
  const liveRefreshers = [
    ["/api/content", [hydrateContent, hydrateMemories, hydrateMemoryBook, hydrateEvents, hydrateGallery, hydrateHomePreviews, hydrateParticipation], true],
    ["/api/events", [hydrateEvents, hydrateHomePreviews], Boolean(pageDocument.querySelector("[data-events], [data-home-event]"))],
    ["/api/gallery", [hydrateGallery, hydrateMemoryBook, hydrateHomePreviews], Boolean(pageDocument.querySelector("[data-gallery], [data-memory-book], [data-home-gallery]"))],
    ["/api/memories", [hydrateMemories, hydrateMemoryBook], Boolean(pageDocument.querySelector("[data-memory-wall], [data-memory-book]"))],
    ["/api/participation", [hydrateParticipation], Boolean(pageDocument.querySelector("[data-participation-count]"))],
  ];
  let refreshInProgress = false;
  let initialHydrated = false;
  async function refreshPublicData() {
    if (window.MEMORIAL_BOOK_SNAPSHOT || !initialHydrated || refreshInProgress || document.visibilityState === "hidden") return;
    refreshInProgress = true;
    try {
      await Promise.allSettled(liveRefreshers.filter(([, , active]) => active).map(([path, renderers]) => refreshLive(path, renderers)));
    } finally {
      refreshInProgress = false;
    }
  }
  mirrorReady.then(async () => {
    if (lifecycle.signal.aborted) return;
    await hydrateContent().catch(() => {});
    await Promise.allSettled([hydrateEvents(), hydrateGallery(), hydrateMemories(), hydrateMemoryBook(), hydrateParticipation()]);
    await hydrateHomePreviews();
    initialHydrated = true;
    refreshPublicData();
  });
  listen(window, "focus", refreshPublicData);
  listen(document, "visibilitychange", refreshPublicData);
  const refreshTimer = setInterval(refreshPublicData, 60000);
  cleanups.push(() => clearInterval(refreshTimer));

  const privatePreview = pageDocument.querySelector("[data-private-preview]");
  let editAccess = null;
  let previewBlobs = [];
  cleanups.push(() => previewBlobs.forEach(URL.revokeObjectURL));
  const accessFromHash = () => {
    const match = location.hash.match(/^#preview=(\d+)\.([a-f0-9]{64})$/);
    return match ? { id: Number(match[1]), token: match[2] } : null;
  };
  const previewRequest = (path) => pageFetch(apiUrl(path), { headers: { authorization: `Bearer ${editAccess.token}` }, cache: "no-store" });
  async function showPrivatePreview(scroll = false) {
    if (!(privatePreview instanceof HTMLElement) || !editAccess) return;
    previewBlobs.forEach(URL.revokeObjectURL);
    previewBlobs = [];
    const response = await previewRequest(`/api/memory-preview?id=${editAccess.id}`);
    const data = await response.json();
    if (!response.ok) {
      privatePreview.hidden = false;
      privatePreview.replaceChildren(node("p", { text: data.error || "Private preview unavailable." }));
      editAccess = null;
      return;
    }
    const memory = data.memory;
    const heading = node("div", { className: "private-preview-heading" });
    const copy = node("div");
    copy.append(node("p", { className: "section-kicker", text: "Private preview · awaiting review" }),
      node("h2", { text: "Your memory, as it will appear" }),
      node("p", { text: "Only someone with your private link can see this preview. You can revise it until the owner reviews it." }));
    heading.append(copy);
    const card = node("article", { className: "memory-card private-preview-card" });
    const byline = node("header", { className: "memory-author" });
    byline.append(node("span", { className: "memory-author-mark", text: memory.name.trim().split(/\s+/).slice(0, 2).map(part => part[0]).join("") }),
      node("div", { text: `${memory.name} · ${memory.relationship}` }));
    card.append(byline);
    const mediaKind = memory.videoName ? "video" : memory.photoName ? "photo" : null;
    if (mediaKind) {
      const mediaResponse = await previewRequest(`/api/memory-preview?id=${editAccess.id}&media=${mediaKind}`);
      if (mediaResponse.ok) {
        const url = URL.createObjectURL(await mediaResponse.blob());
        previewBlobs.push(url);
        card.append(mediaKind === "video"
          ? node("video", { attrs: { src: url, controls: "", playsinline: "", preload: "metadata", class: "memory-video" } })
          : node("img", { attrs: { src: url, alt: `Shared by ${memory.name}` } }));
      }
    }
    for (const [index, name] of [memory.photoName, memory.photo2Name, memory.photo3Name].entries()) {
      if (memory.videoName || !name || (index === 0 && mediaKind === "photo")) continue;
      const res = await previewRequest(`/api/memory-preview?id=${editAccess.id}&media=${index === 0 ? "photo" : "photo" + (index + 1)}`);
      if (res.ok) {
        const url = URL.createObjectURL(await res.blob()); previewBlobs.push(url);
        card.append(node("img", { attrs: { src: url, alt: `Photo ${index + 1} shared by ${memory.name}` } }));
      }
    }
    card.append(node("h3", { text: memory.title }));
    if (memory.story) card.append(node("p", { className: "memory-story", text: memory.story }));
    const links = node("div", { className: "memory-attachments" });
    if (memory.pdfName) {
      const pdf = node("button", { className: "private-preview-link", text: `▤ Open PDF · ${memory.pdfName}`, attrs: { type: "button" } });
      pdf.addEventListener("click", async () => {
        const windowForPdf = window.open("", "_blank");
        try {
          const res = await previewRequest(`/api/memory-preview?id=${editAccess.id}&media=pdf`);
          if (!res.ok) throw new Error("PDF preview unavailable.");
          const url = URL.createObjectURL(await res.blob());
          previewBlobs.push(url);
          if (windowForPdf) windowForPdf.location.href = url;
          else pdf.textContent = "Please allow popups to view the PDF";
        } catch { if (windowForPdf) windowForPdf.close(); pdf.textContent = "PDF preview unavailable"; }
      });
      links.append(pdf);
    }
    if (memory.socialUrl) links.append(node("a", { text: "↗ View shared public post", attrs: { href: memory.socialUrl, target: "_blank", rel: "noopener noreferrer nofollow ugc" } }));
    if (links.childNodes.length) card.append(links);
    const actions = node("div", { className: "private-preview-actions" });
    const revise = node("button", { text: "Edit this memory", attrs: { type: "button" } });
    revise.addEventListener("click", () => {
      if (!(form instanceof HTMLFormElement)) return;
      for (const key of ["name", "relationship", "title", "story", "socialUrl"]) {
        const field = form.elements.namedItem(key);
        if (field instanceof HTMLInputElement || field instanceof HTMLTextAreaElement) field.value = memory[key] || "";
      }
      const consent = form.elements.namedItem("consent");
      if (consent instanceof HTMLInputElement) consent.checked = true;
      if (sharePanel instanceof HTMLDetailsElement) sharePanel.open = true;
      const button = form.querySelector("button[type=submit]");
      if (button) button.textContent = "Save revised memory →";
      form.scrollIntoView({ behavior: "smooth", block: "start" });
    });
    const privateLink = node("button", { text: "Copy private edit link", attrs: { type: "button" } });
    privateLink.addEventListener("click", async () => {
      try { await navigator.clipboard.writeText(`${location.origin}/memories/#preview=${editAccess.id}.${editAccess.token}`); privateLink.textContent = "Private link copied"; }
      catch { privateLink.textContent = "Copy the address in your browser to return to this preview"; }
    });
    actions.append(revise, privateLink);
    privatePreview.replaceChildren(heading, card, actions,
      node("p", { className: "private-preview-note", text: "Keep your private link. After approval, your memory will appear below with the community stories." }));
    privatePreview.hidden = false;
    if (sharePanel instanceof HTMLDetailsElement) sharePanel.open = false;
    if (scroll) privatePreview.scrollIntoView({ behavior: "smooth", block: "start" });
  }
  editAccess = accessFromHash();
  if (editAccess) showPrivatePreview();
  listen(window, "hashchange", () => {
    const access = accessFromHash();
    if (access) { editAccess = access; showPrivatePreview(true); }
  });

  if (form instanceof HTMLFormElement) form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const formData = new FormData(form);
    if (editAccess) { formData.set("editId", String(editAccess.id)); formData.set("editToken", editAccess.token); }
    const photos = formData.getAll("photo").filter(file => file instanceof File && file.size > 0);
    if (photos.length > 3 || photos.some(file => file.size > 8 * 1024 * 1024)) { showMessage("Choose up to three photos, each up to 8 MB."); return; }
    const story = String(formData.get("story") || "").trim();
    const socialUrl = String(formData.get("socialUrl") || "").trim();
    const video = formData.get("video");
    if (video instanceof File && video.size > 50 * 1024 * 1024) { showMessage("Please choose a video up to 50 MB."); return; }
    const pdf = formData.get("pdf");
    if (pdf instanceof File && pdf.size > 15 * 1024 * 1024) { showMessage("Please choose a PDF up to 15 MB."); return; }
    if (!story && !socialUrl && !(pdf instanceof File && pdf.size > 0) && !(video instanceof File && video.size > 0)) {
      showMessage("Please share your story as written text, a PDF, video, or a public post.");
      return;
    }
    const button = form.querySelector("button[type=submit]");
    if (button instanceof HTMLButtonElement) { button.disabled = true; button.textContent = editableCopy["memories.formSending"] || "Sending…"; }
    try {
      const response = await pageFetch(apiUrl("/api/memories"), { method: "POST", body: formData });
      const responseData = await response.json();
      if (!response.ok) throw new Error(responseData.error || "Unable to submit this memory.");
      editAccess = { id: responseData.id, token: responseData.editToken };
      history.replaceState(null, "", `#preview=${editAccess.id}.${editAccess.token}`);
      form.reset();
      if (message instanceof HTMLElement) message.hidden = true;
      await showPrivatePreview(true);
    } catch (error) {
      showMessage(error instanceof Error ? error.message : (editableCopy["memories.formError"] || "Please try again."));
    } finally {
      if (button instanceof HTMLButtonElement) { button.disabled = false; button.textContent = editAccess ? "Save revised memory →" : `${editableCopy["memories.formSubmit"] || "Submit for review"} →`; }
    }
  });
}

// Public Pages navigation keeps the actual header node mounted, not a snapshot.
// Management, downloads, the print book and external destinations stay native.
function installMemorialNavigation() {
  const routes = new Set(["/", "/life/", "/legacy/", "/events/", "/gallery/", "/memories/", "/tree/"]);
  const canonical = path => path === "/" ? path : path.replace(/\/$/, "") + "/";
  const nav = document.querySelector(".site-nav");
  const main = document.querySelector("main");
  if (!nav || !main || !routes.has(canonical(location.pathname))) return;
  // The homepage uses relative head URLs. Anchor them before pushState changes
  // the document base URL, including the stylesheet version comparison below.
  document.head.querySelectorAll("[href], [src]").forEach(element => {
    for (const attr of ["href", "src"]) {
      const value = element.getAttribute(attr);
      if (value) element.setAttribute(attr, new URL(value, location.href).href);
    }
  });
  document.body.insertBefore(nav, main);
  let displayedPath = canonical(location.pathname);
  let pending = null;
  history.scrollRestoration = "manual";

  async function navigate(url, back = false, scroll = null) {
    pending?.abort();
    const request = new AbortController();
    pending = request;
    try {
      const response = await fetch(url.pathname + url.search, { signal: request.signal, cache: "no-cache" });
      if (!response.ok) throw new Error("Page unavailable");
      const markup = await response.text();
      if (request.signal.aborted) return;
      const next = new DOMParser().parseFromString(markup, "text/html");
      const nextMain = next.querySelector("main");
      if (!nextMain || !nextMain.querySelector(".site-nav")) throw new Error("Native page required");
      const stylesheet = next.querySelector('link[rel="stylesheet"]');
      const currentStylesheet = document.querySelector('link[rel="stylesheet"]');
      // A new deployment may require new CSS and JavaScript; load it normally.
      if (!stylesheet || new URL(stylesheet.getAttribute("href"), url).href !== currentStylesheet?.href) throw new Error("New deployment");
      nextMain.querySelector(".site-nav").remove();
      // Preserve page-relative asset/link URLs when importing another document.
      nextMain.querySelectorAll("[href], [src], [poster], [action]").forEach(element => {
        for (const attr of ["href", "src", "poster", "action"]) {
          const value = element.getAttribute(attr);
          if (value && !value.startsWith("#")) element.setAttribute(attr, new URL(value, url).href);
        }
      });
      disposeMemorialPage();
      if (!back) {
        history.replaceState({ ...history.state, memorialScroll: [scrollX, scrollY] }, "");
        history.pushState({ memorialScroll: [0, 0] }, "", url);
      }
      const page = canonical(url.pathname).split("/").filter(Boolean)[0];
      if (page && page !== "tree") document.documentElement.dataset.page = page;
      else delete document.documentElement.dataset.page;
      document.title = next.title;
      const description = next.querySelector('meta[name="description"]');
      if (description) document.querySelector('meta[name="description"]')?.setAttribute("content", description.content);
      document.querySelector("main").replaceWith(document.importNode(nextMain, true));
      displayedPath = canonical(url.pathname);
      nav.querySelector("details")?.removeAttribute("open");
      initializeMemorialPage();
      const heading = [...document.querySelectorAll("main h1")].find(element => element.getClientRects().length);
      if (heading) { heading.setAttribute("tabindex", "-1"); heading.focus({ preventScroll: true }); }
      let anchor = null;
      try { anchor = url.hash && document.getElementById(decodeURIComponent(url.hash.slice(1))); } catch {}
      if (anchor) anchor.scrollIntoView({ behavior: "instant" });
      else window.scrollTo({ left: scroll?.[0] || 0, top: scroll?.[1] || 0, behavior: "instant" });
    } catch (error) {
      if (!request.signal.aborted) location.assign(url.href);
    }
  }
  document.addEventListener("click", event => {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const link = event.target instanceof Element ? event.target.closest("a[href]") : null;
    if (!link || link.hasAttribute("download") || (link.target && link.target !== "_self")) return;
    const url = new URL(link.href);
    if (url.origin !== location.origin || !routes.has(canonical(url.pathname)) || url.search) return;
    if (canonical(url.pathname) === displayedPath && canonical(location.pathname) === displayedPath) {
      pending?.abort();
      if (!url.hash) { event.preventDefault(); nav.querySelector("details")?.removeAttribute("open"); window.scrollTo({ top: 0, behavior: "instant" }); }
      return;
    }
    event.preventDefault();
    url.pathname = canonical(url.pathname);
    navigate(url);
  });
  window.addEventListener("popstate", event => {
    if (canonical(location.pathname) === displayedPath) return;
    if (!routes.has(canonical(location.pathname))) { location.reload(); return; }
    navigate(new URL(location.href), true, event.state?.memorialScroll);
  });
}

document.addEventListener("DOMContentLoaded", () => {
  installMemorialNavigation();
  initializeMemorialPage();
});
