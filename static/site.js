document.addEventListener("DOMContentLoaded", () => {
  const apiBase = String(window.MEMORIAL_API_BASE || "").replace(/\/$/, "");
  const form = document.querySelector("[data-migration-form]");
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

  async function hydrateContent() {
    const { content } = await getJson("/api/content");
    Object.entries(content || {}).forEach(([key, value]) => {
      const target = document.querySelector(`[data-content="${key}"]`);
      if (target instanceof HTMLElement && typeof value === "string") {
        if (key === "obituaryStory") target.replaceChildren(...value.split(/\n\s*\n/).filter(Boolean).map((paragraph, index) => node("p", { className: index === 0 ? "lead" : "", text: paragraph })));
        else target.textContent = value;
      }
      const preview = document.querySelector(`[data-content-preview="${key}"]`);
      if (preview instanceof HTMLElement && typeof value === "string" && key === "obituaryStory") {
        const paragraphs = value.split(/\n\s*\n/).filter(Boolean).slice(0, 2).map((paragraph, index) => node("p", { className: index === 0 ? "lead" : "", text: paragraph }));
        const link = node("a", { className: "text-link", text: "Read Robert’s full story →", attrs: { href: "./life/" } });
        preview.replaceChildren(...paragraphs, link);
      }
    });
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
      if (event.linkUrl) article.append(node("a", { text: event.linkLabel || "View details", attrs: { href: event.linkUrl, target: "_blank", rel: "noopener noreferrer" } }));
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
        else figure.append(node("a", { className: "video-link", text: "Watch video ↗", attrs: { href: item.externalUrl, target: "_blank", rel: "noopener noreferrer" } }));
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
      target.replaceChildren(node("p", { className: "memories-empty", text: "Approved community memories will appear here." }));
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
    if (button instanceof HTMLButtonElement) { button.disabled = true; button.textContent = "Submitting…"; }
    try {
      const response = await fetch(apiUrl("/api/memories"), { method: "POST", body: new FormData(form) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to submit this memory.");
      form.reset(); showMessage("Thank you. Your memory and photograph were sent privately for review.", true);
    } catch (error) {
      showMessage(error instanceof Error ? error.message : "Unable to submit this memory. Please try again.");
    } finally {
      if (button instanceof HTMLButtonElement) { button.disabled = false; button.textContent = "Submit for review →"; }
    }
  });
});
