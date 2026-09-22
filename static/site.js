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
  }

  function applyTheme(content) {
    const main = document.querySelector("main");
    if (!(main instanceof HTMLElement)) return;
    if (typeof content.bodyFont === "string") main.dataset.bodyFont = content.bodyFont;
    if (typeof content.headingFont === "string") main.dataset.headingFont = content.headingFont;
  }

  function renderLifeTimeline(items) {
    const target = document.querySelector("[data-life-timeline]");
    if (!(target instanceof HTMLElement) || !Array.isArray(items)) return;
    target.replaceChildren(...items.map((item) => {
      const article = node("article");
      article.append(node("span", { text: item.year || "" }), node("h3", { text: item.title || "" }), node("p", { text: item.text || "" }));
      return article;
    }));
  }

  function renderHomeLegacy(topics, summaryItems) {
    const target = document.querySelector("[data-home-legacy-topics]");
    if (!(target instanceof HTMLElement) || !Array.isArray(topics)) return;
    const topicCards = target.querySelectorAll(".home-legacy-node");
    topics.forEach((topic, index) => {
      const card = topicCards[index];
      if (!(card instanceof HTMLElement)) return;
      const strong = card.querySelector("strong");
      const small = card.querySelector("small");
      if (strong) strong.textContent = topic.title || "";
      if (small) small.textContent = topic.note || "";
    });

    const summaryTarget = document.querySelector("[data-home-legacy-cards]");
    if (summaryTarget instanceof HTMLElement && Array.isArray(summaryItems)) {
      const summaryCards = summaryTarget.querySelectorAll(".chapter-card");
      summaryItems.forEach((item, index) => {
        const card = summaryCards[index];
        if (!(card instanceof HTMLElement)) return;
        const heading = card.querySelector("h3");
        const paragraph = card.querySelector("p");
        if (heading) heading.textContent = item.title || "";
        if (paragraph) paragraph.textContent = item.text || "";
      });
    }
  }

  function chapterPhotoUrl(photo) {
    if (!photo) return "";
    if (photo.objectKey) return objectUrl("/api/chapter-photos", photo.objectKey);
    if (photo.asset) return `/assets/${String(photo.asset).replace(/^\//, "")}`;
    return "";
  }

  function renderLegacy(content, copy) {
    const chapters = Array.isArray(content.legacyChapters) ? content.legacyChapters : [];
    if (!chapters.length) return;

    const scale = document.querySelector("[data-legacy-scale]");
    if (scale instanceof HTMLElement) {
      scale.replaceChildren(...chapters.map((chapter) => {
        const item = node("li");
        item.append(node("span", { text: chapter.number || "" }), node("strong", { text: chapter.institution || "" }), node("small", { text: chapter.scale || "" }));
        return item;
      }));
    }

    const nav = document.querySelector("[data-legacy-nav]");
    if (nav instanceof HTMLElement) {
      nav.replaceChildren(...chapters.map((chapter) => {
        const link = node("a", { attrs: { href: `#${chapter.id}` } });
        link.append(node("span", { text: chapter.number || "" }), node("b", { text: chapter.institution || "" }), node("small", { text: chapter.years || "" }));
        return link;
      }));
    }

    const target = document.querySelector("[data-legacy-journey]");
    if (target instanceof HTMLElement) {
      target.replaceChildren(...chapters.map((chapter) => {
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
        if (imageSrc || chapter.publication) {
          const evidence = node("div", { className: "journey-evidence" });
          if (imageSrc && chapter.photo) {
            const figure = node("figure");
            figure.append(node("img", { attrs: { src: imageSrc, alt: chapter.photo.alt || "", loading: "lazy" } }));
            const caption = node("figcaption", { text: chapter.photo.caption || "" });
            caption.append(node("small", { text: copy?.["legacy.photoCredit"] || "Photo shared for the Robert E. Dickinson memorial." }));
            figure.append(caption);
            evidence.append(figure);
          }
          if (chapter.publication) {
            const publication = node("article", { className: "landmark-publication" });
            const label = node("p", { className: "journey-label" });
            label.append(document.createTextNode((copy?.["legacy.publicationLabel"] || "Landmark publication") + " "), node("span", { text: "·" }), document.createTextNode(` ${chapter.publication.year || ""}`));
            publication.append(label, node("h4", { text: chapter.publication.title || "" }), node("cite", { text: chapter.publication.citation || "" }), node("p", { text: chapter.publication.note || "" }));
            evidence.append(publication);
          }
          article.append(evidence);
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

    renderHomeLegacy(content.homeLegacyTopics, content.homeLegacyCards);
    renderLifeTimeline(content.lifeMilestones);
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
    const target = document.querySelector("[data-memory-wall]");
    if (!(target instanceof HTMLElement)) return;
    const { memories = [] } = await getJson("/api/memories");
    if (!memories.length) {
      target.replaceChildren(node("p", { className: "memories-empty", text: editableCopy["memories.emptyText"] || "Approved community memories will appear here." }));
      return;
    }
    target.replaceChildren(...memories.map((memory) => {
      const article = node("article", { className: "memory-card" });
      if (memory.photoKey) article.append(node("img", { attrs: { src: objectUrl("/api/photos", memory.photoKey), alt: `Shared by ${memory.name}`, loading: "lazy" } }));
      article.append(node("div", { text: "❝", attrs: { "aria-hidden": "true" } }), node("h3", { text: memory.title }), node("p", { text: memory.story }));
      const footer = node("footer"); footer.append(node("strong", { text: memory.name }), node("span", { text: memory.relationship })); article.append(footer);
      return article;
    }));
  }

  async function hydrateMemoryBook() {
    const target = document.querySelector("[data-memory-book]");
    if (!(target instanceof HTMLElement)) return;
    const [{ content }, { memories = [] }] = await Promise.all([
      getJson("/api/content"),
      getJson("/api/memories"),
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
    const portrait = siteAssetUrl("portrait");
    const horizon = siteAssetUrl("horizon");
    const storyParagraphs = String(content.obituaryStory || "").split(/\n\s*\n/).filter(Boolean);
    const memorySpreads = Array.from({ length: Math.ceil(memories.length / 2) }, (_, index) => memories.slice(index * 2, index * 2 + 2));
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
    const quote = node("blockquote", { text: copy["home.portraitQuote"] || "" });
    homeCopy.append(quote);
    const homeLegacy = node("div", { className: "book-home-legacy" });
    homeLegacy.append(node("h3", { text: copy["home.legacyTitle"] || "Science that changed how we see Earth" }), node("p", { text: content.homeLegacyIntro || "" }));
    const themeGrid = node("div", { className: "book-theme-grid" });
    (content.homeLegacyTopics || []).forEach((topic) => {
      const article = node("article");
      article.append(node("strong", { text: topic.title || "" }), node("span", { text: topic.note || "" }));
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
    home.append(homeImage, homeCopy, node("span", { className: "book-page-number", text: copy["nav.home"] || "Home" }));
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

    const legacyOverview = node("section", { className: "book-spread book-legacy-overview-spread" });
    legacyOverview.append(node("p", { className: "book-running-title", text: `${copy["nav.legacy"] || "Scientific legacy"} · ${copy["global.footerName"] || "Robert E. Dickinson"}` }));
    const legacyHeading = node("div", { className: "book-section-heading" });
    legacyHeading.append(node("p", { className: "book-label", text: copy["legacy.heroKicker"] || "" }), node("h2", { text: copy["legacy.heroTitle"] || "" }), node("p", { text: copy["legacy.heroIntro"] || "" }));
    legacyOverview.append(legacyHeading);
    const threadGrid = node("div", { className: "book-thread-grid" });
    (content.legacyThreads || []).forEach((thread, index) => {
      const article = node("article");
      article.append(node("span", { text: String(index + 1).padStart(2, "0") }), node("h3", { text: thread.title || "" }), node("p", { text: thread.text || "" }));
      threadGrid.append(article);
    });
    legacyOverview.append(threadGrid, node("span", { className: "book-page-number", text: copy["nav.legacy"] || "Scientific legacy" }));
    pages.push(legacyOverview);

    (content.legacyChapters || []).forEach((chapter) => {
      const section = node("section", { className: "book-spread book-legacy-chapter-spread" });
      section.append(node("p", { className: "book-running-title", text: `${copy["nav.legacy"] || "Scientific legacy"} · ${chapter.institution || ""}` }));
      const header = node("header");
      const heading = node("div");
      heading.append(node("p", { className: "book-label", text: `${chapter.number || ""} · ${chapter.years || ""}` }), node("h2", { text: chapter.title || "" }), node("strong", { text: `${chapter.institution || ""} · ${chapter.scale || ""}` }));
      header.append(heading);
      const photoSrc = chapterPhotoUrl(chapter.photo);
      if (photoSrc && chapter.photo) {
        const figure = node("figure");
        figure.append(node("img", { attrs: { src: photoSrc, alt: chapter.photo.alt || "" } }), node("figcaption", { text: chapter.photo.caption || "" }));
        header.append(figure);
      }
      section.append(header, node("p", { className: "book-legacy-summary", text: chapter.summary || "" }));
      const details = node("div", { className: "book-legacy-details" });
      const contributions = node("div");
      contributions.append(node("h3", { text: copy["legacy.contributionsLabel"] || "Key contributions" }));
      const list = node("ul");
      (chapter.contributions || []).forEach((item) => list.append(node("li", { text: item })));
      contributions.append(list);
      const impact = node("blockquote");
      impact.append(node("h3", { text: copy["legacy.impactLabel"] || "Legacy" }), node("p", { text: chapter.impact || "" }));
      details.append(contributions, impact);
      section.append(details);
      if (chapter.publication) {
        const publication = node("div", { className: "book-publication" });
        publication.append(node("p", { className: "book-label", text: `${copy["legacy.publicationLabel"] || "Landmark publication"} · ${chapter.publication.year || ""}` }), node("h3", { text: chapter.publication.title || "" }), node("cite", { text: chapter.publication.citation || "" }), node("p", { text: chapter.publication.note || "" }));
        section.append(publication);
      }
      const tags = node("div", { className: "book-tags" });
      (chapter.threads || []).forEach((thread) => tags.append(node("span", { text: thread })));
      section.append(tags, node("span", { className: "book-page-number", text: chapter.institution || "" }));
      pages.push(section);
    });

    const honors = node("section", { className: "book-spread book-honors-spread" });
    honors.append(node("p", { className: "book-running-title", text: `${copy["nav.legacy"] || "Scientific legacy"} · ${copy["legacy.honorsKicker"] || "Honors, awards & recognition"}` }), node("h2", { text: copy["legacy.honorsKicker"] || "Honors, awards & recognition" }));
    const honorsGrid = node("div", { className: "book-honors-grid" });
    (content.honors || []).forEach((honor) => {
      const article = node("article");
      article.append(node("span", { text: honor.year || "" }), node("h3", { text: honor.title || "" }), node("p", { text: honor.detail || "" }));
      honorsGrid.append(article);
    });
    honors.append(honorsGrid, node("p", { className: "book-honors-note", text: content.honorsNote || "" }), node("span", { className: "book-page-number", text: "Honors" }));
    pages.push(honors);

    memorySpreads.forEach((spread, index) => {
      const section = node("section", { className: "book-spread book-message-spread" });
      section.append(node("p", { className: "book-running-title", text: `${copy["nav.memories"] || "Memories"} · ${copy["global.footerName"] || "Robert E. Dickinson"}` }), node("h2", { text: copy["memories.sectionTitle"] || copy["book.messagesTitle"] || "Stories that carry forward" }));
      const grid = node("div", { className: "book-message-grid" });
      spread.forEach((memory) => {
        const article = node("article");
        if (memory.photoKey) article.append(node("img", { attrs: { src: objectUrl("/api/photos", memory.photoKey), alt: `Shared by ${memory.name}` } }));
        article.append(node("p", { className: "book-label", text: `${copy["book.memoryPrefix"] || "A memory from"} ${memory.relationship || ""}` }), node("h3", { text: memory.title || "" }), node("p", { className: "book-story", text: memory.story || "" }));
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
    const button = form.querySelector("button[type=submit]");
    if (button instanceof HTMLButtonElement) { button.disabled = true; button.textContent = editableCopy["memories.formSending"] || "Sending…"; }
    try {
      const response = await fetch(apiUrl("/api/memories"), { method: "POST", body: new FormData(form) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to submit this memory.");
      form.reset(); showMessage(editableCopy["memories.successMessage"] || "Thank you. Your memory has been received for review.", true);
    } catch (error) {
      showMessage(error instanceof Error ? error.message : (editableCopy["memories.formError"] || "Please try again."));
    } finally {
      if (button instanceof HTMLButtonElement) { button.disabled = false; button.textContent = `${editableCopy["memories.formSubmit"] || "Submit for review"} →`; }
    }
  });
});
