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

  if (!apiBase) {
    if (form instanceof HTMLFormElement) form.addEventListener("submit", (event) => { event.preventDefault(); showMessage("Online submissions are temporarily paused while the private review service is being connected. No information was sent or stored."); });
    return;
  }

  Promise.allSettled([hydrateContent(), hydrateEvents(), hydrateGallery(), hydrateMemories()]);

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
