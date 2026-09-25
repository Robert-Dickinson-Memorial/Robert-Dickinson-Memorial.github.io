document.addEventListener("DOMContentLoaded", () => {
  const apiBase = String(window.MEMORIAL_API_BASE || "").replace(/\/$/, "");
  const form = document.querySelector("[data-migration-form]");
  let editableCopy = {};
  const message = document.querySelector("[data-migration-message]");
  const apiUrl = (path) => `${apiBase}${path}`;
  const objectUrl = (path, key) => apiUrl(`${path}/${String(key).split("/").map(encodeURIComponent).join("/")}`);

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
    const response = await fetch(apiUrl(path));
    if (!response.ok) throw new Error("Unable to load memorial updates.");
    return response.json();
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

  function lifePhotoFigure(photo) {
    const figure = node("figure", { className: "life-photo" });
    figure.append(node("img", { attrs: { src: objectUrl("/api/life-photos", photo.objectKey), alt: photo.alt || "", loading: "lazy" } }));
    if (photo.date || photo.caption) {
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
    const stack = node("div", { className: "life-photo-stack" });
    stack.append(...early.map(lifePhotoFigure));
    target.replaceChildren(stack);
  }
  function illuminateLifeTimeline() {
    const entries = document.querySelectorAll(".life-scroll-entry");
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
    }, { rootMargin: "0px 0px -18% 0px", threshold: 0 });
    entries.forEach((entry) => observer.observe(entry));
    return () => observer.disconnect();
  }
  function renderLifeTimeline(items, photos = []) {
    const target = document.querySelector("[data-life-timeline]");
    if (!(target instanceof HTMLElement) || !Array.isArray(items)) return;
    target.replaceChildren(...items.map((item, index) => {
      const article = node("article", { className: "life-scroll-entry" });
      article.append(node("span", { className: "life-scroll-year", text: item.year || "" }), node("h3", { text: item.title || "" }), node("p", { text: item.text || "" }));
      const photo = photos.find((photo) => photo.milestoneId === (item.id || `life-period-${index}`));
      if (photo) article.append(lifePhotoFigure(photo));
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
            const card = node(publication.url ? "a" : "article", {
              className: "landmark-paper-card",
              attrs: publication.url ? { href: publication.url, target: "_blank", rel: "noopener noreferrer" } : {},
            });
            const preview = publicationImageUrl(publication.image);
            if (preview) {
              card.append(node("img", { attrs: { src: preview, alt: publication.alt || `Publication preview for ${publication.title || ""}`, loading: "lazy" } }));
            } else {
              const fallback = node("div", { className: "landmark-paper-fallback" });
              fallback.append(node("span", { text: publication.year || "" }), node("strong", { text: publication.title || "" }), node("small", { text: publication.citation || "" }));
              card.append(fallback);
            }
            const caption = node("div", { className: "landmark-paper-caption" });
            caption.append(node("p", { text: publication.note || "" }));
            if (publication.url) caption.append(node("span", { className: "landmark-paper-link", text: "Read the publication ↗" }));
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
    editableCopy = content.pageCopy || {};
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
    const quoteList = document.querySelector("[data-community-quotes]");
    if (!(wallTarget instanceof HTMLElement) && !(quoteList instanceof HTMLElement)) return;
    const [{ memories = [] }, { content = {} }] = await Promise.all([
      getJson("/api/memories"),
      getJson("/api/content"),
    ]);
    const copy = content.pageCopy || editableCopy || {};

    if (quoteList instanceof HTMLElement && Array.isArray(content.communityQuotes)) {
      quoteList.replaceChildren(...content.communityQuotes.map((item) => {
        const li = node("li");
        li.append(
          node("blockquote", { text: `“${item.quote || ""}”` }),
          node("cite", { text: `— ${item.attribution || ""}` })
        );
        return li;
      }));
    }

    if (wallTarget instanceof HTMLElement) {
      if (!memories.length) {
        wallTarget.replaceChildren(node("p", { className: "memories-empty", text: copy["memories.emptyText"] || "Approved community memories will appear here." }));
      } else {
        wallTarget.replaceChildren(...memories.map((memory) => {
          const article = node("article", { className: "memory-card", attrs: { id: `memory-${memory.id}` } });
          if (memory.photoKey) article.append(node("img", { attrs: { src: objectUrl("/api/photos", memory.photoKey), alt: `Shared by ${memory.name}`, loading: "lazy" } }));
          article.append(node("div", { text: "❝", attrs: { "aria-hidden": "true" } }), node("h3", { text: memory.title }));
          if (memory.story) article.append(node("p", { text: memory.story }));
          if (memory.pdfKey || memory.socialUrl) {
            const attachments = node("div", { className: "memory-attachments" });
            if (memory.pdfKey) attachments.append(node("a", { text: `▤ ${copy["memories.pdfLink"] || "Read the shared PDF"}`, attrs: { href: objectUrl("/api/memory-files", memory.pdfKey), target: "_blank", rel: "noopener noreferrer" } }));
            if (memory.socialUrl) attachments.append(node("a", { text: `↗ ${copy["memories.socialLink"] || "View the shared public post"}`, attrs: { href: memory.socialUrl, target: "_blank", rel: "noopener noreferrer nofollow ugc" } }));
            article.append(attachments);
          }
          const footer = node("footer");
          footer.append(node("strong", { text: memory.name }), node("span", { text: memory.relationship }));
          article.append(footer);
          return article;
        }));
      }
    }
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
    mentor.append(node("blockquote", { text: copy["life.mentorQuote"] || "" }), node("p", { text: copy["life.mentorText"] || "" }));
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
    return;
  }

  Promise.allSettled([hydrateContent(), hydrateEvents(), hydrateGallery(), hydrateMemories(), hydrateMemoryBook()]);

  if (form instanceof HTMLFormElement) form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const formData = new FormData(form);
    const story = String(formData.get("story") || "").trim();
    const socialUrl = String(formData.get("socialUrl") || "").trim();
    const pdf = formData.get("pdf");
    if (!story && !socialUrl && !(pdf instanceof File && pdf.size > 0)) {
      showMessage("Please share your story as written text, a PDF, or a public post.");
      return;
    }
    const button = form.querySelector("button[type=submit]");
    if (button instanceof HTMLButtonElement) { button.disabled = true; button.textContent = editableCopy["memories.formSending"] || "Sending…"; }
    try {
      const response = await fetch(apiUrl("/api/memories"), { method: "POST", body: formData });
      const responseData = await response.json();
      if (!response.ok) throw new Error(responseData.error || "Unable to submit this memory.");
      form.reset(); showMessage(editableCopy["memories.successMessage"] || "Thank you. Your memory has been received for review.", true);
    } catch (error) {
      showMessage(error instanceof Error ? error.message : (editableCopy["memories.formError"] || "Please try again."));
    } finally {
      if (button instanceof HTMLButtonElement) { button.disabled = false; button.textContent = `${editableCopy["memories.formSubmit"] || "Submit for review"} →`; }
    }
  });
});
