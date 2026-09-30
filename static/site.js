document.addEventListener("DOMContentLoaded", () => {
  const apiBase = String(window.MEMORIAL_API_BASE || "").replace(/\/$/, "");
  const mobileMenu = document.querySelector(".mobile-nav");
  if (mobileMenu instanceof HTMLDetailsElement) {
    document.addEventListener("keydown", (event) => { if (event.key === "Escape") mobileMenu.open = false; });
    document.addEventListener("click", (event) => {
      if (mobileMenu.open && !mobileMenu.contains(event.target)) mobileMenu.open = false;
    });
  }
  const form = document.querySelector("[data-migration-form]");
  const treeForm = document.querySelector("[data-tree-dedication-form]");
  const tributeReturnBar = document.querySelector("[data-tribute-return-bar]");
  const tributeReturnLabel = document.querySelector("[data-tribute-return-label]");
  const tributeRouteLabels = {
    "chippewa-arbor-day": "Chippewa National Forest · Arbor Day Foundation",
    "chippewa-living-tribute": "Minnesota forests · A Living Tribute",
    "minnesota-living-tribute": "Minnesota forests · A Living Tribute",
    "global-one-tree-planted": "Where needed most · One Tree Planted",
    "chippewa-usda": "Chippewa requested · USDA Forest Service",
    "amazon-tree-nation": "Amazon · Tree-Nation / Rioterra",
    "amazon-conservation": "Amazon · Amazon Conservation",
    "arizona-living-tribute": "Arizona · A Living Tribute",
    "georgia-living-tribute": "Georgia · A Living Tribute",
    "texas-living-tribute": "Texas · A Living Tribute",
    "colorado-csfs": "Colorado · Colorado State Forest Service",
    "california-living-tribute": "California · A Living Tribute",
    "massachusetts-esplanade": "Massachusetts · Esplanade Association",
    "new-england-neff": "New England · NEFF",
  };
  const updateTributeReturnBar = (route) => {
    if (!(tributeReturnBar instanceof HTMLElement)) return;
    if (!route || !tributeRouteLabels[route]) {
      tributeReturnBar.hidden = true;
      return;
    }
    if (tributeReturnLabel instanceof HTMLElement) tributeReturnLabel.textContent = `You chose ${tributeRouteLabels[route]}. Return here to record the trees or restoration gift.`;
    tributeReturnBar.hidden = false;
  };
  updateTributeReturnBar(sessionStorage.getItem("livingTributeRoute"));
  window.addEventListener("livingTributeRouteSelected", (event) => updateTributeReturnBar(event.detail));
  window.addEventListener("livingTributeRecorded", () => updateTributeReturnBar(""));
  document.querySelectorAll("[data-contribution-route]").forEach((link) => {
    link.addEventListener("click", () => {
      const route = link.getAttribute("data-contribution-route");
      if (route) {
        sessionStorage.setItem("livingTributeRoute", route);
        window.dispatchEvent(new CustomEvent("livingTributeRouteSelected", { detail: route }));
      }
    });
  });
  const sharePanel = document.querySelector("details.memory-share-panel");
  const revealShareForm = () => {
    if (location.hash === "#share" && sharePanel instanceof HTMLDetailsElement) sharePanel.open = true;
  };
  revealShareForm();
  window.addEventListener("hashchange", revealShareForm);
  document.querySelectorAll('a[href="#share"]').forEach(link => link.addEventListener("click", () => {
    if (sharePanel instanceof HTMLDetailsElement) sharePanel.open = true;
  }));

  let editableCopy = {};
  const message = document.querySelector("[data-migration-message]");
  const apiUrl = (path) => `${apiBase}${path}`;
  let mirroredMedia = {};
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
    const snapshotPath = `/mirror${path}.json`;
    try {
      const response = await fetch(snapshotPath, { cache: "no-store" });
      if (response.ok) {
        const snapshot = await response.json();
        payloadSignatures.set(path, JSON.stringify(snapshot));
        return snapshot;
      }
    } catch {}
    const response = await fetch(apiUrl(path), { cache: "no-store" });
    if (!response.ok) throw new Error("Unable to load memorial updates.");
    return response.json();
  }

  async function refreshLive(path, renderers) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    try {
      const response = await fetch(apiUrl(path), { cache: "no-store", signal: controller.signal });
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
      await Promise.allSettled(renderers.map((render) => render()));
    } catch {
      // Visitors who cannot reach the service continue to see the same-site mirror.
    } finally {
      clearTimeout(timer);
    }
  }

  function applyPageCopy(copy) {
    if (!copy || typeof copy !== "object") return;
    document.querySelectorAll("[data-copy]").forEach((element) => {
      if (!(element instanceof HTMLElement)) return;
      const key = element.dataset.copy;
      if (key && typeof copy[key] === "string") element.textContent = copy[key];
    });
    document.querySelectorAll("[data-copy-href]").forEach((element) => {
      const key = element.getAttribute("data-copy-href");
      if (key && typeof copy[key] === "string") element.setAttribute("href", copy[key]);
    });
    document.querySelectorAll("[data-copy-placeholder]").forEach((element) => {
      const key = element.getAttribute("data-copy-placeholder");
      if (key && typeof copy[key] === "string") element.setAttribute("placeholder", copy[key]);
    });
  }

  function applySiteAssets(content) {
    const assets = content && content.siteAssets;
    if (!assets || typeof assets !== "object") return;
    document.querySelectorAll("[data-site-asset]").forEach((element) => {
      if (!(element instanceof HTMLImageElement)) return;
      const id = element.dataset.siteAsset;
      const asset = id && assets[id];
      if (!asset) return;
      element.src = asset.objectKey ? objectUrl("/api/site-assets", asset.objectKey) : `/assets/${String(asset.asset || "").replace(/^\//, "")}`;
      element.alt = asset.alt || "";
    });
    const hero = document.querySelector(".hero");
    if (hero instanceof HTMLElement) {
      hero.classList.remove("hero-portrait-landscape", "hero-portrait-portrait");
      hero.classList.add(assets.portrait?.layout === "portrait" ? "hero-portrait-portrait" : "hero-portrait-landscape");
    }
  }

  function applyTheme(content) {
    const main = document.querySelector("main");
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
    const target = document.querySelector("[data-life-photos]");
    if (!(target instanceof HTMLElement)) return;
    const early = (Array.isArray(photos) ? photos : []).filter((photo) => !photo.milestoneId);
    if (!early.length) {
      target.replaceChildren(node("p", { className: "life-photos-empty", text: editableCopy["life.photosEmpty"] || "Photographs from Robert’s early years will be shared here." }));
      return;
    }
    target.replaceChildren(...early.map((photo) => lifePhotoFigure(photo)));
  }
  function illuminateLifeTimeline() {
    const entries = document.querySelectorAll(".life-reference-entry");
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
    entries.forEach((entry) => observer.observe(entry));
    return () => observer.disconnect();
  }
  function renderLifeTimeline(items, photos = []) {
    const target = document.querySelector("[data-life-timeline]");
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

  function renderHomeLegacy(threads, highlights, frontierLabels, copy) {
    const target = document.querySelector("[data-home-scientific-story]");
    const secondaryTarget = document.querySelector("[data-home-secondary]");
    const headingThreads = document.querySelector("[data-home-heading-threads]");
    const threadList = document.querySelector("[data-home-thread-list]");
    if (!Array.isArray(threads) || !Array.isArray(highlights)) return;
    const frontiers = Array.isArray(frontierLabels) ? frontierLabels : ["Tropical Deforestation", "Carbon & Nitrogen cycling", "Regional Climate Modeling", "Solar Geoengineering", "Canopy Radiative Transfer"];
    const diagramLabels = ["Atmospheric Dynamics", "Climate Change", "Climate Modeling", "Land-Atmosphere Interactions", "Satellite Remote Sensing", "A Coupled Earth"];

    if (headingThreads instanceof HTMLElement) {
      headingThreads.replaceChildren(...threads.map((thread) => node("span", { text: thread.title || "", attrs: { title: thread.text || "" } })));
    }
    if (threadList instanceof HTMLElement) {
      threadList.replaceChildren(...diagramLabels.map((label) => node("li", { text: label })));
      const art = document.querySelector(".home-thread-art");
      if (art instanceof HTMLElement) art.setAttribute("aria-label", `Six connected research threads: ${diagramLabels.join(", ")}`);
    }

    if (!(target instanceof HTMLElement)) return;
    const stream = node("div", { className: "science-highlight-stream" });
    highlights.forEach((highlight) => {
      const article = node("article", { className: "science-highlight" });
      article.append(node("span", { className: "science-highlight-dot", attrs: { "aria-hidden": "true" } }));
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

    const scale = document.querySelector("[data-legacy-scale]");
    if (scale instanceof HTMLElement) {
      scale.replaceChildren(...chapters.map((chapter) => {
        const item = node("li");
        item.append(node("span", { text: chapter.number || "" }), node("strong", { text: chapter.scale || "" }), node("small", { text: chapter.institution || "" }));
        return item;
      }));
    }

    const nav = document.querySelector("[data-legacy-nav]");
    if (nav instanceof HTMLElement) {
      nav.replaceChildren(...chapters.map((chapter) => {
        const link = node("a", { attrs: { href: `#${chapter.id}` } });
        link.append(node("span", { text: chapter.number || "" }), node("b", { text: chapter.scale || "" }), node("small", { text: `${chapter.institution || ""} · ${chapter.years || ""}` }));
        return link;
      }));
    }

    const target = document.querySelector("[data-legacy-journey]");
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
          landmarkWork.append(node("p", { className: "journey-label", text: "Landmark Publication" }));
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
            if (/^https:\/\//i.test(publication.url || "")) actions.append(node("a", { text: "Open publication page ↗", attrs: { href: publication.url, target: "_blank", rel: "noopener noreferrer" } }));
            const pdfUrl = publicationPdfUrl(publication);
            if (pdfUrl && pdfUrl !== publication.url) actions.append(node("a", { text: "Open PDF ↗", attrs: { href: pdfUrl, target: "_blank", rel: "noopener noreferrer", type: "application/pdf" } }));
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

    const threadTarget = document.querySelector("[data-legacy-threads]");
    if (threadTarget instanceof HTMLElement && Array.isArray(content.legacyThreads)) {
      threadTarget.replaceChildren(...content.legacyThreads.map((thread, index) => {
        const article = node("article");
        article.append(node("span", { text: String(index + 1).padStart(2, "0") }), node("h4", { text: thread.title || "" }), node("p", { text: thread.text || "" }));
        return article;
      }));
    }

    const frontierTarget = document.querySelector("[data-legacy-frontiers]");
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

    const honors = document.querySelector("[data-legacy-honors]");
    if (honors instanceof HTMLElement && Array.isArray(content.honors)) {
      honors.replaceChildren(...content.honors.map((honor) => {
        const item = node("div", { className: "honor-item" });
        item.append(node("span", { text: honor.year || "" }), node("strong", { text: honor.title || "" }), node("small", { text: honor.detail || "" }));
        return item;
      }));
    }
    const honorsNote = document.querySelector("[data-honors-note]");
    if (honorsNote instanceof HTMLElement && typeof content.honorsNote === "string") honorsNote.textContent = content.honorsNote;
  }

  illuminateLifeTimeline();

  async function hydrateContent() {
    const { content } = await getJson("/api/content");
    if (!content || typeof content !== "object") return;
    editableCopy = { ...content.pageCopy };
    if (editableCopy["nav.tree"] === "Living Tribute") editableCopy["nav.tree"] = "Plant a Tree";
    if (editableCopy["nav.memories"] === "Memories") editableCopy["nav.memories"] = "Share A Memory";
    applyTheme(content);
    applyPageCopy(editableCopy);
    applySiteAssets(content);

    Object.entries(content).forEach(([key, value]) => {
      const targets = document.querySelectorAll(`[data-content="${key}"]`);
      targets.forEach((target) => {
        if (!(target instanceof HTMLElement) || typeof value !== "string") return;
        if (key === "obituaryStory") target.replaceChildren(...value.split(/\n\s*\n/).filter(Boolean).map((paragraph, index) => node("p", { className: index === 0 ? "lead" : "", text: paragraph })));
        else target.textContent = value;
      });
      const preview = document.querySelector(`[data-content-preview="${key}"]`);
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

  async function hydrateEvents() {
    const target = document.querySelector("[data-events]");
    if (!(target instanceof HTMLElement)) return;
    const { events = [] } = await getJson("/api/events");
    if (!events.length) return;
    const list = node("div", { className: "events-list" });
    events.forEach((event) => {
      const article = node("article", { className: "event-card" });
      article.append(node("time", { text: new Date(event.startAt).toLocaleString(), attrs: { datetime: event.startAt } }), node("h3", { text: event.title }));
      if (event.location) article.append(node("p", { className: "event-location", text: event.location }));
      if (event.description) article.append(node("p", { text: event.description }));
      if (event.linkUrl) article.append(node("a", { text: event.linkLabel || editableCopy["events.defaultLink"] || "Event details", attrs: { href: event.linkUrl, target: "_blank", rel: "noopener noreferrer" } }));
      list.append(article);
    });
    target.replaceChildren(list);
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

  async function hydrateGallery() {
    const target = document.querySelector("[data-gallery]");
    if (!(target instanceof HTMLElement)) return;
    const { gallery = [] } = await getJson("/api/gallery");
    if (!gallery.length) return;
    const grid = node("div", { className: "gallery-grid" });
    gallery.forEach((item) => {
      const figure = node("figure", { className: "gallery-card" });
      if (item.kind === "image" && item.objectKey) figure.append(node("img", { attrs: { src: objectUrl("/api/gallery/photos", item.objectKey), alt: item.title, loading: "lazy" } }));
      if (item.kind === "video" && item.externalUrl) {
        const embed = videoEmbedUrl(item.externalUrl);
        if (embed) figure.append(node("iframe", { attrs: { src: embed, title: item.title, loading: "lazy", allowfullscreen: "" } }));
        else figure.append(node("a", { className: "video-link", text: editableCopy["gallery.watchVideo"] || "Watch video ↗", attrs: { href: item.externalUrl, target: "_blank", rel: "noopener noreferrer" } }));
      }
      const caption = node("figcaption"); caption.append(node("strong", { text: item.title }));
      if (item.caption) caption.append(node("span", { text: item.caption }));
      figure.append(caption); grid.append(figure);
    });
    target.replaceChildren(grid);
  }

  async function hydrateMemories() {
    const wallTarget = document.querySelector("[data-memory-wall]");
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
          /^(haishan|hanshan) chen$/i.test(String(memory.name || "").trim().replace(/\s+/g, " ")) ? 1 : 2;
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
          if (memory.videoKey) article.append(node("video", { attrs: { src: objectUrl("/api/memory-videos", memory.videoKey), controls: "", playsinline: "", preload: "metadata", class: "memory-video", "aria-label": memory.title } }));
          else if (memory.photoKey) article.append(node("img", { attrs: { src: objectUrl("/api/photos", memory.photoKey), alt: `Shared by ${memory.name}`, loading: "lazy" } }));
          article.append(node("h3", { text: memory.title }));
          if (memory.story) {
            const longStory = memory.story.length > 420;
            const story = node("p", { className: `memory-story${longStory ? " is-collapsed" : ""}`, text: memory.story, attrs: { id: `memory-story-${memory.id}` } });
            article.append(story);
            if (longStory) {
              const reader = node("dialog", { className: "memory-reader", attrs: { "aria-labelledby": `memory-reader-title-${memory.id}` } });
              const close = node("button", { className: "memory-reader-close", text: "Close ×", attrs: { type: "button", "aria-label": "Close full memory" } });
              reader.append(close, node("p", { className: "memory-reader-author", text: `${memory.name} · ${memory.relationship}` }),
                node("h2", { text: memory.title, attrs: { id: `memory-reader-title-${memory.id}` } }),
                node("p", { className: "memory-reader-story", text: memory.story }));
              const toggle = node("button", { className: "memory-read-more", text: "Read full memory", attrs: { type: "button", "aria-haspopup": "dialog" } });
              toggle.addEventListener("click", () => reader.showModal());
              close.addEventListener("click", () => reader.close());
              reader.addEventListener("click", (event) => { if (event.target === reader) reader.close(); });
              reader.addEventListener("close", () => toggle.focus());
              article.append(toggle, reader);
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
      }
    }
  }

  async function hydrateParticipation() {
    if (!document.querySelector("[data-participation-count]")) return;
    const counts = await getJson("/api/participation");
    document.querySelectorAll("[data-participation-count]").forEach((element) => {
      const kind = element.getAttribute("data-participation-count");
      const count = counts[kind];
      if (!Number.isSafeInteger(count) || count < 0) return;
      const label = kind === "trees"
        ? `${count === 1 ? "tree dedicated" : "trees dedicated"} in Robert’s memory${Number.isSafeInteger(counts.restorationGifts) && counts.restorationGifts > 0 ? ` · ${counts.restorationGifts} additional restoration ${counts.restorationGifts === 1 ? "gift" : "gifts"}` : ""}`
        : `${count === 1 ? "memory shared" : "memories shared"}`;
      element.replaceChildren(node("strong", { text: count }), document.createTextNode(` ${label}`));
      element.hidden = false;
    });
  }


  async function hydrateMemoryBook() {
    const target = document.querySelector("[data-memory-book]");
    if (!(target instanceof HTMLElement)) return;
    const [{ content }, { memories = [] }, { gallery = [] }] = await Promise.all([
      getJson("/api/content"),
      getJson("/api/memories"),
      getJson("/api/gallery"),
    ]);
    const copy = content.pageCopy || {};
    const siteAssetUrl = (id) => {
      const asset = content.siteAssets?.[id];
      if (!asset) return "";
      return asset.objectKey ? objectUrl("/api/site-assets", asset.objectKey) : `/assets/${String(asset.asset || "").replace(/^\//, "")}`;
    };
    const chapterPhotoUrl = (photo) => {
      if (!photo) return "";
      if (photo.objectKey) return objectUrl("/api/chapter-photos", photo.objectKey);
      if (photo.asset) return `/assets/${String(photo.asset).replace(/^\//, "")}`;
      return "";
    };
    const lifePhotoUrl = (photo) => photo?.objectKey ? objectUrl("/api/life-photos", photo.objectKey) : "";
    const galleryPhotoUrl = (item) => item?.objectKey ? objectUrl("/api/gallery/photos", item.objectKey) : "";
    const publicationPreviewUrl = (publication) => publication?.image ? `/assets/${String(publication.image).replace(/^\//, "")}` : "";
    const chunk = (items, size) => Array.from({ length: Math.ceil(items.length / size) }, (_, index) => items.slice(index * size, index * size + size));
    const portrait = siteAssetUrl("portrait");
    const horizon = siteAssetUrl("horizon");
    const storyParagraphs = String(content.obituaryStory || "").split(/\n\s*\n/).filter(Boolean);
    const bookMemories = [...memories].sort((a, b) => String(a.createdAt || "").localeCompare(String(b.createdAt || "")) || Number(a.id || 0) - Number(b.id || 0));
    const memorySpreads = chunk(bookMemories, 2);
    const lifePhotoSpreads = chunk(Array.isArray(content.lifePhotos) ? content.lifePhotos : [], 3);
    const galleryPhotos = (Array.isArray(gallery) ? gallery : []).filter((item) => item.kind === "image" && item.objectKey);
    const gallerySpreads = chunk(galleryPhotos, 4);
    const honorSpreads = chunk(Array.isArray(content.honors) ? content.honors : [], 12);
    const pages = [];

    const cover = node("header", { className: "book-spread book-cover-spread" });
    const coverCopy = node("div", { className: "book-cover-copy" });
    const coverName = node("h1");
    coverName.append(document.createTextNode(copy["book.coverNameLine1"] || "Robert E."), node("br"), document.createTextNode(copy["book.coverNameLine2"] || "Dickinson"));
    coverCopy.append(node("p", { text: copy["book.coverKicker"] || "Community memories" }), coverName, node("span", { text: copy["book.coverDates"] || "1940–2026" }), node("small", { text: copy["book.coverSubtitle"] || "A life in science, mentorship, and friendship" }));
    cover.append(coverCopy, node("img", { attrs: { src: portrait, alt: content.siteAssets?.portrait?.alt || "" } }));
    pages.push(cover);

    const home = node("section", { className: "book-spread book-home-spread" });
    const homeImage = node("div", { className: "book-home-image" });
    homeImage.append(node("img", { attrs: { src: horizon, alt: content.siteAssets?.horizon?.alt || "" } }), node("img", { attrs: { src: portrait, alt: content.siteAssets?.portrait?.alt || "" } }));
    const homeCopy = node("div", { className: "book-home-copy" });
    homeCopy.append(node("p", { className: "book-running-title", text: `${copy["nav.home"] || "Home"} · ${copy["global.footerName"] || "Robert E. Dickinson"}` }), node("p", { className: "book-label", text: copy["home.heroEyebrow"] || "" }), node("h2", { text: `${copy["home.heroNameLine1"] || "Robert E."} ${copy["home.heroNameLine2"] || "Dickinson"}` }), node("p", { className: "book-lead", text: content.heroIntro || "" }));
    homeCopy.append(node("blockquote", { text: copy["home.portraitQuote"] || "" }));
    const homeLegacy = node("div", { className: "book-home-legacy" });
    homeLegacy.append(node("h3", { text: copy["home.legacyTitle"] || "" }), node("p", { text: content.homeLegacyIntro || "" }));
    const themeGrid = node("div", { className: "book-theme-grid" });
    (content.legacyThreads || []).forEach((thread) => {
      const article = node("article");
      article.append(node("strong", { text: thread.title || "" }), node("span", { text: thread.text || "" }));
      themeGrid.append(article);
    });
    homeLegacy.append(themeGrid);
    const cardGrid = node("div", { className: "book-home-card-grid" });
    (content.homeLegacyCards || []).forEach((card) => {
      const article = node("article");
      article.append(node("h4", { text: card.title || "" }), node("p", { text: card.text || "" }));
      cardGrid.append(article);
    });
    homeLegacy.append(cardGrid);
    homeCopy.append(homeLegacy);
    home.append(homeImage, homeCopy, node("span", { className: "book-page-number", text: "Home" }));
    pages.push(home);

    const life = node("section", { className: "book-spread book-life-spread" });
    life.append(node("p", { className: "book-running-title", text: `${copy["nav.life"] || "His life"} · ${copy["global.footerName"] || "Robert E. Dickinson"}` }));
    const lifeHeading = node("div", { className: "book-section-heading" });
    lifeHeading.append(node("p", { className: "book-label", text: copy["life.heroKicker"] || "" }), node("h2", { text: copy["life.heroTitle"] || "" }), node("p", { text: copy["life.heroIntro"] || "" }));
    life.append(lifeHeading);
    const lifeStory = node("div", { className: "book-life-story" });
    storyParagraphs.forEach((paragraph) => lifeStory.append(node("p", { text: paragraph })));
    life.append(lifeStory);
    const mentor = node("aside", { className: "book-mentor-note" });
    mentor.append(node("h3", { text: copy["life.mentorTitle"] || "The mentor he was" }), node("p", { text: copy["life.mentorBody"] || "" }), node("strong", { text: copy["life.mentorText"] || "" }));
    life.append(mentor, node("span", { className: "book-page-number", text: copy["nav.life"] || "His life" }));
    pages.push(life);

    lifePhotoSpreads.forEach((spread, index) => {
      const section = node("section", { className: "book-spread book-life-photo-spread" });
      section.append(node("p", { className: "book-running-title", text: `${copy["nav.life"] || "His life"} · Photographs` }));
      const heading = node("div", { className: "book-photo-heading" });
      const titleWrap = node("div");
      titleWrap.append(node("p", { className: "book-label", text: copy["life.photosKicker"] || "His life in photographs" }), node("h2", { text: index === 0 ? "A life beyond the timeline" : "His life, continued" }));
      heading.append(titleWrap, node("p", { text: "Photographs shared on the His Life page, carried into the memory book." }));
      section.append(heading);
      const grid = node("div", { className: `book-life-photo-grid count-${spread.length}` });
      spread.forEach((photo) => {
        const figure = node("figure");
        figure.append(node("img", { attrs: { src: lifePhotoUrl(photo), alt: photo.alt || "", loading: "lazy" } }));
        if (photo.date || photo.caption) {
          const caption = node("figcaption");
          if (photo.date) caption.append(node("strong", { text: photo.date }));
          if (photo.caption) caption.append(node("span", { text: photo.caption }));
          figure.append(caption);
        }
        grid.append(figure);
      });
      section.append(grid, node("span", { className: "book-page-number", text: `His life · Photos ${index + 1}` }));
      pages.push(section);
    });

    const timeline = node("section", { className: "book-spread book-timeline-spread" });
    timeline.append(node("p", { className: "book-running-title", text: `${copy["nav.life"] || "His life"} · Education & career` }), node("h2", { text: "Education & career timeline" }));
    const timelineGrid = node("div", { className: "book-timeline-grid" });
    (content.lifeMilestones || []).forEach((item) => {
      const article = node("article");
      article.append(node("span", { text: item.year || "" }), node("h3", { text: item.title || "" }), node("p", { text: item.text || "" }));
      timelineGrid.append(article);
    });
    timeline.append(timelineGrid, node("span", { className: "book-page-number", text: "Timeline" }));
    pages.push(timeline);

    const legacy = node("section", { className: "book-spread book-legacy-overview-spread book-legacy-map-spread" });
    legacy.append(node("p", { className: "book-running-title", text: `${copy["nav.legacy"] || "Scientific legacy"} · ${copy["global.footerName"] || "Robert E. Dickinson"}` }));
    const legacyHeading = node("div", { className: "book-legacy-map-heading" });
    const legacyTitle = node("div");
    const legacyH2 = node("h2");
    legacyH2.append(document.createTextNode("Broader "), node("em", { text: "and" }), document.createTextNode(" deeper"));
    legacyTitle.append(node("p", { className: "book-label", text: copy["legacy.chaptersLabel"] || "Scientific Contribution Chronicle" }), legacyH2);
    legacyHeading.append(legacyTitle, node("p", { text: copy["legacy.heroIntro"] || "" }));
    legacy.append(legacyHeading);
    const arc = node("div", { className: "book-legacy-arc", attrs: { "aria-label": "Robert Dickinson scientific contribution chronicle" } });
    (content.legacyChapters || []).forEach((chapter) => {
      const article = node("article");
      article.append(node("span", { text: chapter.number || "" }), node("small", { text: chapter.years || "" }), node("h3", { text: chapter.institution || "" }), node("p", { text: chapter.scale || "" }));
      arc.append(article);
    });
    legacy.append(arc);
    const direction = node("div", { className: "book-legacy-direction" });
    direction.append(node("strong", { text: "Broadening the scientific question →" }), node("span", { text: "atmosphere · climate · land · vegetation · coupled Earth system" }));
    legacy.append(direction);
    const ribbon = node("div", { className: "book-legacy-thread-ribbon" });
    (content.legacyThreads || []).forEach((thread) => ribbon.append(node("span", { text: thread.title || "" })));
    legacy.append(ribbon, node("span", { className: "book-page-number", text: "Scientific legacy" }));
    pages.push(legacy);

    (content.legacyChapters || []).forEach((chapter) => {
      const publications = chapterPublications(chapter);
      const section = node("section", { className: "book-spread book-legacy-chapter-spread" });
      section.append(node("p", { className: "book-running-title", text: `${copy["nav.legacy"] || "Scientific legacy"} · ${chapter.institution || ""}` }));
      const hero = node("header", { className: "book-legacy-chapter-hero" });
      hero.append(node("div", { className: "book-legacy-number", text: chapter.number || "" }));
      const title = node("div", { className: "book-legacy-chapter-title" });
      title.append(node("p", { className: "book-label", text: `${chapter.years || ""} · ${chapter.institution || ""}` }), node("h2", { text: chapter.title || "" }), node("strong", { text: chapter.scale || "" }));
      hero.append(title);
      const photo = chapterPhotoUrl(chapter.photo);
      if (photo && chapter.photo) {
        const figure = node("figure");
        figure.append(node("img", { attrs: { src: photo, alt: chapter.photo.alt || "" } }), node("figcaption", { text: chapter.photo.caption || "" }));
        hero.append(figure);
      }
      section.append(hero, node("p", { className: "book-legacy-summary", text: chapter.summary || "" }));
      const details = node("div", { className: "book-legacy-details" });
      const contributions = node("div");
      contributions.append(node("h3", { text: copy["legacy.contributionsLabel"] || "Key contributions" }));
      const list = node("ul");
      (chapter.contributions || []).forEach((item) => list.append(node("li", { text: item })));
      contributions.append(list);
      const impact = node("blockquote");
      impact.append(node("span", { text: "Enduring legacy" }), node("p", { text: chapter.impact || "" }));
      details.append(contributions, impact);
      section.append(details);

      if (publications.length) {
        const landmarkGrid = node("div", { className: `book-landmark-grid count-${publications.length}` });
        publications.forEach((publication) => {
          const card = node("article", { className: "book-landmark-card" });
          const preview = publicationPreviewUrl(publication);
          if (preview) card.append(node("img", { attrs: { src: preview, alt: publication.alt || `Publication preview for ${publication.title || ""}` } }));
          const body = node("div");
          body.append(node("p", { className: "book-label", text: `${copy["legacy.publicationLabel"] || "Landmark Publication"} · ${publication.year || ""}` }), node("h3", { text: publication.title || "" }), node("cite", { text: publication.citation || "" }), node("p", { text: publication.note || "" }));
          card.append(body);
          landmarkGrid.append(card);
        });
        section.append(landmarkGrid);
      }
      section.append(node("span", { className: "book-page-number", text: chapter.institution || "" }));
      pages.push(section);
    });

    honorSpreads.forEach((spread, index) => {
      const honors = node("section", { className: "book-spread book-honors-spread" });
      const honorsTitle = copy["legacy.honorsKicker"] || "Honors, awards & recognition";
      honors.append(node("p", { className: "book-running-title", text: `${copy["nav.legacy"] || "Scientific legacy"} · ${honorsTitle}` }), node("h2", { text: honorsTitle + (honorSpreads.length > 1 ? " · " + (index + 1) : "") }));
      const honorsGrid = node("div", { className: "book-honors-grid" });
      spread.forEach((honor) => {
        const article = node("article");
        article.append(node("span", { text: honor.year || "" }), node("h3", { text: honor.title || "" }), node("p", { text: honor.detail || "" }));
        honorsGrid.append(article);
      });
      honors.append(honorsGrid);
      if (index === honorSpreads.length - 1) honors.append(node("p", { className: "book-honors-note", text: content.honorsNote || "" }));
      honors.append(node("span", { className: "book-page-number", text: `Honors ${index + 1}` }));
      pages.push(honors);
    });

    gallerySpreads.forEach((spread, index) => {
      const section = node("section", { className: "book-spread book-gallery-photo-spread" });
      section.append(node("p", { className: "book-running-title", text: `${copy["nav.gallery"] || "Gallery"} · ${copy["global.footerName"] || "Robert E. Dickinson"}` }));
      const heading = node("div", { className: "book-photo-heading" });
      const titleWrap = node("div");
      titleWrap.append(node("p", { className: "book-label", text: copy["gallery.sectionKicker"] || "Images and voices" }), node("h2", { text: index === 0 ? (copy["gallery.sectionTitle"] || "Photo & video gallery") : `${copy["gallery.sectionTitle"] || "Photo & video gallery"} · ${index + 1}` }));
      heading.append(titleWrap, node("p", { text: copy["gallery.heroIntro"] || "" }));
      section.append(heading);
      const grid = node("div", { className: `book-gallery-photo-grid count-${spread.length}` });
      spread.forEach((item) => {
        const src = galleryPhotoUrl(item);
        if (!src) return;
        const figure = node("figure");
        figure.append(node("img", { attrs: { src, alt: item.title || "", loading: "lazy" } }));
        const caption = node("figcaption");
        caption.append(node("strong", { text: item.title || "" }));
        if (item.caption) caption.append(node("span", { text: item.caption }));
        figure.append(caption);
        grid.append(figure);
      });
      section.append(grid, node("span", { className: "book-page-number", text: `Gallery · ${index + 1}` }));
      pages.push(section);
    });

    memorySpreads.forEach((spread, index) => {
      const section = node("section", { className: "book-spread book-message-spread" });
      section.append(node("p", { className: "book-running-title", text: `${copy["nav.memories"] || "Memories"} · ${copy["global.footerName"] || "Robert E. Dickinson"}` }), node("h2", { text: copy["memories.sectionTitle"] || copy["book.messagesTitle"] || "Stories that carry forward" }));
      const grid = node("div", { className: "book-message-grid" });
      spread.forEach((memory) => {
        const article = node("article");
        if (memory.photoKey) article.append(node("img", { attrs: { src: objectUrl("/api/photos", memory.photoKey), alt: `Shared by ${memory.name}` } }));
        article.append(node("p", { className: "book-label", text: `${copy["book.memoryPrefix"] || "A memory from"} ${memory.relationship || ""}` }), node("h3", { text: memory.title || "" }));
        if (memory.story) article.append(node("p", { className: "book-story", text: memory.story }));
        if (memory.videoKey) article.append(node("a", { text: "Watch the shared video ↗", attrs: { href: objectUrl("/api/memory-videos", memory.videoKey), target: "_blank", rel: "noopener noreferrer" } }));
        if (memory.pdfKey || memory.socialUrl) {
          const links = node("p", { className: "book-memory-links" });
          if (memory.pdfKey) links.append(node("a", { text: `${copy["memories.pdfLink"] || "Read the shared PDF"} ↗`, attrs: { href: objectUrl("/api/memory-files", memory.pdfKey), target: "_blank", rel: "noopener noreferrer" } }));
          if (memory.socialUrl) links.append(node("a", { text: `${copy["memories.socialLink"] || "View the shared public post"} ↗`, attrs: { href: memory.socialUrl, target: "_blank", rel: "noopener noreferrer nofollow ugc" } }));
          article.append(links);
        }
        const footer = node("footer");
        footer.append(node("strong", { text: memory.name || "" }), node("span", { text: memory.relationship || "" }));
        article.append(footer);
        grid.append(article);
      });
      section.append(grid, node("span", { className: "book-page-number", text: `Memories ${index + 1}` }));
      pages.push(section);
    });

    if (!memories.length) {
      const empty = node("section", { className: "book-spread book-empty" });
      empty.append(node("h2", { text: copy["book.emptyTitle"] || "The book is ready to grow." }), node("p", { text: copy["memories.emptyText"] || "Approved memories will automatically appear here." }));
      pages.push(empty);
    }

    const end = node("footer", { className: "book-spread book-end-spread" });
    end.append(node("span", { text: "∞" }), node("h2", { text: copy["book.endTitle"] || "His questions continue." }), node("p", { text: copy["book.endFooter"] || "Robert E. Dickinson Memorial · 1940–2026" }));
    pages.push(end);
    target.replaceChildren(...pages);
  }

  if (!apiBase) {
    if (form instanceof HTMLFormElement) form.addEventListener("submit", (event) => { event.preventDefault(); showMessage("Online submissions are temporarily paused while the private review service is being connected. No information was sent or stored."); });
    if (treeForm instanceof HTMLFormElement) treeForm.addEventListener("submit", (event) => { event.preventDefault(); const status = treeForm.querySelector("[data-tree-dedication-message]"); if (status) { status.textContent = "Dedication reporting is temporarily unavailable."; status.hidden = false; } });
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
        geographyGuidance.textContent = geography ? `Location recorded: ${geography}` : "";
      }
      if (countField instanceof HTMLElement) countField.hidden = !isTree;
      if (countInput instanceof HTMLInputElement) {
        countInput.required = isTree;
        if (!isTree) countInput.value = "";
      }
      if (countGuidance instanceof HTMLElement) {
        if (!type) {
          countGuidance.hidden = true;
          countGuidance.textContent = "";
        } else if (isTree) {
          countGuidance.hidden = false;
          countGuidance.textContent = "Enter only the number of trees stated by the provider or, for Colorado’s official fund, the quantity implied by its published $2-per-seedling conversion.";
        } else {
          countGuidance.hidden = false;
          countGuidance.textContent = "This provider does not assign a defensible exact tree quantity. Your successful gift will be preserved as a forest-restoration contribution and will not be converted into a guessed number of trees.";
        }
      }
    };

    if (routeSelect instanceof HTMLSelectElement) {
      const rawSavedRoute = sessionStorage.getItem("livingTributeRoute");
      const savedRoute = rawSavedRoute === "chippewa-living-tribute" ? "minnesota-living-tribute" : rawSavedRoute;
      if (savedRoute && Array.from(routeSelect.options).some((option) => option.value === savedRoute)) routeSelect.value = savedRoute;
      routeSelect.addEventListener("change", updateTreeRoute);
      window.addEventListener("livingTributeRouteSelected", (event) => {
        const rawRoute = event.detail;
        const route = rawRoute === "chippewa-living-tribute" ? "minnesota-living-tribute" : rawRoute;
        if (typeof route === "string" && Array.from(routeSelect.options).some((option) => option.value === route)) {
          routeSelect.value = route;
          updateTreeRoute();
        }
      });
      updateTreeRoute();
    }

    treeForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const status = treeForm.querySelector("[data-tree-dedication-message]");
      const button = treeForm.querySelector('button[type="submit"]');
      const data = new FormData(treeForm);
      const selected = routeSelect instanceof HTMLSelectElement ? routeSelect.selectedOptions[0] : null;
      const isTree = selected?.dataset.type === "tree";
      if (status instanceof HTMLElement) status.classList.remove("is-success", "is-error");
      if (button) button.disabled = true;
      try {
        const response = await fetch(apiUrl("/api/participation"), {
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
        if (!response.ok) throw new Error(result.error || "Unable to record the living tribute.");
        treeForm.reset();
        sessionStorage.removeItem("livingTributeRoute");
        window.dispatchEvent(new CustomEvent("livingTributeRecorded"));
        updateTreeRoute();
        if (status instanceof HTMLElement) {
          status.textContent = result.contributionType === "tree"
            ? "✓ Thank you — your contribution has been successfully recorded. Your trees are now included in Robert’s living-tribute total."
            : "✓ Thank you — your contribution has been successfully recorded in Robert’s living tribute.";
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
        if (button) button.disabled = false;
      }
    });
  }

  const mirrorReady = fetch("/mirror/manifest.json", { cache: "no-store" })
    .then((response) => response.ok ? response.json() : { media: {} })
    .then((manifest) => { mirroredMedia = manifest.media || {}; })
    .catch(() => {});
  const liveRefreshers = [
    ["/api/content", [hydrateContent, hydrateMemories, hydrateMemoryBook], true],
    ["/api/events", [hydrateEvents], Boolean(document.querySelector("[data-events]"))],
    ["/api/gallery", [hydrateGallery, hydrateMemoryBook], Boolean(document.querySelector("[data-gallery], [data-memory-book]"))],
    ["/api/memories", [hydrateMemories, hydrateMemoryBook], Boolean(document.querySelector("[data-memory-wall], [data-memory-book]"))],
    ["/api/participation", [hydrateParticipation], Boolean(document.querySelector("[data-participation-count]"))],
  ];
  let refreshInProgress = false;
  let initialHydrated = false;
  async function refreshPublicData() {
    if (!initialHydrated || refreshInProgress || document.visibilityState === "hidden") return;
    refreshInProgress = true;
    try {
      await Promise.allSettled(liveRefreshers.filter(([, , active]) => active).map(([path, renderers]) => refreshLive(path, renderers)));
    } finally {
      refreshInProgress = false;
    }
  }
  mirrorReady.then(async () => {
    await Promise.allSettled([hydrateContent(), hydrateEvents(), hydrateGallery(), hydrateMemories(), hydrateMemoryBook(), hydrateParticipation()]);
    initialHydrated = true;
    refreshPublicData();
  });
  window.addEventListener("focus", refreshPublicData);
  document.addEventListener("visibilitychange", refreshPublicData);
  setInterval(refreshPublicData, 60000);

  const privatePreview = document.querySelector("[data-private-preview]");
  let editAccess = null;
  let previewBlobs = [];
  const accessFromHash = () => {
    const match = location.hash.match(/^#preview=(\d+)\.([a-f0-9]{64})$/);
    return match ? { id: Number(match[1]), token: match[2] } : null;
  };
  const previewRequest = (path) => fetch(apiUrl(path), { headers: { authorization: `Bearer ${editAccess.token}` }, cache: "no-store" });
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
  window.addEventListener("hashchange", () => {
    const access = accessFromHash();
    if (access) { editAccess = access; showPrivatePreview(true); }
  });

  if (form instanceof HTMLFormElement) form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const formData = new FormData(form);
    if (editAccess) { formData.set("editId", String(editAccess.id)); formData.set("editToken", editAccess.token); }
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
      const response = await fetch(apiUrl("/api/memories"), { method: "POST", body: formData });
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
});
