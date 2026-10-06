/* Shared full-story reader for the app and GitHub Pages.
 * Reuse the approved content/media already rendered in the card. Never fetch or
 * change private submissions, re-extract PDFs, or resurrect removed photographs.
 */
const installed = Symbol.for("rd-memorial.memory-reader-media.v1");

function installMemoryReaderMedia() {
  if (window[installed]) return;
  window[installed] = true;
  const styleUrl = new URL("memory-reader-media.css", import.meta.url);
  styleUrl.search = new URL(import.meta.url).search;
  if (!document.querySelector('link[data-memory-reader-media]')) {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = styleUrl.href;
    link.dataset.memoryReaderMedia = "";
    document.head.append(link);
  }

  const el = (tag, className, text) => {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (text !== undefined) element.textContent = text;
    return element;
  };
  const button = (className, text, label = text) => {
    const b = el("button", className, text);
    b.type = "button";
    b.setAttribute("aria-label", label);
    return b;
  };
  const safeUrl = value => {
    try {
      const url = new URL(value, document.baseURI);
      return ["https:", "http:"].includes(url.protocol) ? url.href : "";
    } catch { return ""; }
  };
  const outside = (event, dialog) => {
    if (event.target !== dialog) return false;
    const box = dialog.getBoundingClientRect();
    return event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom;
  };
  let reader = null;
  let viewer = null;
  let sequence = 0;

  function openPhoto(photos, first, opener) {
    if (!reader?.open || !photos.length) return;
    viewer?.close();
    const dialog = el("dialog", "memory-photo-viewer");
    viewer = dialog;
    dialog.setAttribute("aria-label", "Enlarged photograph");
    const bar = el("div", "memory-photo-toolbar");
    const counter = el("span", "memory-photo-counter");
    counter.setAttribute("role", "status");
    counter.setAttribute("aria-live", "polite");
    const controls = el("div", "memory-photo-controls");
    const previous = button("", "←", "Previous photograph");
    const next = button("", "→", "Next photograph");
    previous.hidden = next.hidden = photos.length < 2;
    const minus = button("", "−", "Zoom out");
    const plus = button("", "+", "Zoom in");
    const fit = button("", "Fit", "Fit photograph to screen");
    const original = el("a", "memory-photo-original", "Open original ↗");
    original.target = "_blank";
    original.rel = "noopener noreferrer";
    const close = button("memory-photo-close", "Close ×", "Close photograph and return to story");
    controls.append(previous, next, minus, plus, fit, original, close);
    bar.append(counter, controls);
    const stage = el("div", "memory-photo-stage");
    stage.tabIndex = 0;
    stage.setAttribute("aria-label", "Photograph. Use zoom controls, then scroll or drag to explore.");
    const canvas = el("div", "memory-photo-canvas");
    const image = el("img", "memory-photo-image");
    image.alt = "";
    image.draggable = false;
    canvas.append(image);
    stage.append(canvas);
    const status = el("p", "memory-photo-status", "Loading photograph…");
    status.setAttribute("role", "status");
    dialog.append(bar, stage, status);
    document.body.append(dialog);
    let index = first, scale = 1, drag = null, moved = false;

    function sizeImage(reset = false) {
      if (!dialog.open || !image.naturalWidth) return;
      const base = Math.min((stage.clientWidth - 32) / image.naturalWidth,
        (stage.clientHeight - 32) / image.naturalHeight, 1);
      const factor = Math.max(base, .01) * scale;
      image.style.width = Math.round(image.naturalWidth * factor) + "px";
      image.style.height = Math.round(image.naturalHeight * factor) + "px";
      stage.classList.toggle("is-zoomed", scale > 1);
      minus.disabled = scale <= 1;
      plus.disabled = scale >= 4;
      status.textContent = scale === 1 ? "Click the photo or use + to zoom. Escape returns to the story."
        : `Zoom ${Math.round(scale * 100)}% · Scroll or drag to explore; Fit shows the whole photo.`;
      if (reset) { stage.scrollLeft = 0; stage.scrollTop = 0; }
    }
    function zoom(value) {
      const old = scale;
      const x = stage.scrollLeft + stage.clientWidth / 2;
      const y = stage.scrollTop + stage.clientHeight / 2;
      scale = Math.max(1, Math.min(4, value));
      sizeImage();
      stage.scrollLeft = x * scale / old - stage.clientWidth / 2;
      stage.scrollTop = y * scale / old - stage.clientHeight / 2;
    }
    function show(indexToShow) {
      index = Math.max(0, Math.min(photos.length - 1, indexToShow));
      scale = 1;
      image.style.width = image.style.height = "";
      image.alt = photos[index].alt;
      image.src = photos[index].src;
      original.href = photos[index].src;
      counter.textContent = `Photo ${index + 1} of ${photos.length}`;
      previous.disabled = index === 0;
      next.disabled = index === photos.length - 1;
      minus.disabled = true;
      plus.disabled = false;
      status.textContent = "Loading photograph…";
      stage.classList.remove("is-zoomed");
      stage.scrollLeft = stage.scrollTop = 0;
      if (image.complete && image.naturalWidth) sizeImage(true);
    }
    image.addEventListener("load", () => sizeImage(true));
    image.addEventListener("error", () => { status.textContent = "This photograph could not be loaded. Try Open original."; });
    image.addEventListener("click", () => { if (!moved && scale === 1) zoom(2); });
    stage.addEventListener("pointerdown", event => {
      moved = false;
      if (scale <= 1 || event.pointerType !== "mouse" || event.button !== 0) return;
      drag = { x: event.clientX, y: event.clientY, left: stage.scrollLeft, top: stage.scrollTop };
      stage.setPointerCapture(event.pointerId);
      event.preventDefault();
    });
    stage.addEventListener("pointermove", event => {
      if (!drag) return;
      const dx = event.clientX - drag.x, dy = event.clientY - drag.y;
      moved = moved || Math.abs(dx) + Math.abs(dy) > 4;
      stage.scrollLeft = drag.left - dx;
      stage.scrollTop = drag.top - dy;
    });
    stage.addEventListener("pointerup", () => { drag = null; });
    stage.addEventListener("pointercancel", () => { drag = null; });
    previous.onclick = () => show(index - 1);
    next.onclick = () => show(index + 1);
    minus.onclick = () => zoom(scale - .5);
    plus.onclick = () => zoom(scale + .5);
    fit.onclick = () => { scale = 1; sizeImage(true); };
    close.onclick = () => dialog.close();
    dialog.addEventListener("click", event => { if (outside(event, dialog)) dialog.close(); });
    dialog.addEventListener("keydown", event => {
      if (event.key === "ArrowLeft") { event.preventDefault(); previous.click(); }
      if (event.key === "ArrowRight") { event.preventDefault(); next.click(); }
      if (event.key === "+" || event.key === "=") { event.preventDefault(); plus.click(); }
      if (event.key === "-") { event.preventDefault(); minus.click(); }
    });
    const resize = new ResizeObserver(() => sizeImage());
    resize.observe(stage);
    dialog.addEventListener("close", () => {
      resize.disconnect();
      if (viewer === dialog) viewer = null;
      dialog.remove();
      if (reader?.open && opener.isConnected) opener.focus({ preventScroll: true });
    }, { once: true });
    dialog.showModal();
    show(first);
    close.focus({ preventScroll: true });
  }

  function openStory(card, opener) {
    const source = card.querySelector("dialog.memory-reader");
    const story = source?.querySelector(".memory-reader-story")?.textContent
      ?? card.querySelector(".memory-story")?.textContent ?? "";
    const title = source?.querySelector("h2")?.textContent ?? card.querySelector("h3")?.textContent ?? "Shared memory";
    const author = source?.querySelector(".memory-reader-author")?.textContent
      ?? card.querySelector(".memory-author")?.textContent ?? "";
    const media = card.querySelector(".memory-card-media");
    const video = media?.querySelector("video");
    // Video is the sole visual for video posts, including Liming Zhou's post.
    const photos = video ? [] : [...(media?.querySelectorAll("img") || [])]
      .map((img, i) => ({ src: safeUrl(img.currentSrc || img.src), alt: img.alt || `Shared photograph ${i + 1}` }))
      .filter((item, i, list) => item.src && list.findIndex(other => other.src === item.src) === i);
    const dialog = el("dialog", "memory-reader memory-reader--illustrated");
    const titleId = `memory-illustrated-title-${++sequence}`;
    dialog.setAttribute("aria-labelledby", titleId);
    dialog.dataset.memoryId = card.id;
    const toolbar = el("div", "memory-story-toolbar");
    toolbar.append(el("span", "memory-story-label", "Full story"));
    const close = button("memory-story-close", "Close ×", "Close full story");
    toolbar.append(close);
    const body = el("div", "memory-illustrated-body");
    const byline = el("p", "memory-reader-author", author);
    const heading = el("h2", "memory-illustrated-title", title);
    heading.id = titleId;
    body.append(byline, heading);
    if (photos.length) {
      const gallery = el("div", "memory-story-photos");
      gallery.setAttribute("aria-label", "Photographs shared with this memory");
      gallery.append(el("p", "memory-photo-help", "Click or tap a photograph to enlarge it."));
      photos.forEach((photo, i) => {
        const figure = el("figure", "memory-story-figure");
        const zoom = button("memory-story-photo-button", undefined, `Enlarge photo ${i + 1} of ${photos.length}: ${photo.alt}`);
        zoom.setAttribute("aria-haspopup", "dialog");
        const img = el("img", "memory-story-photo");
        img.src = photo.src;
        img.alt = photo.alt;
        img.loading = i === 0 ? "eager" : "lazy";
        img.decoding = "async";
        zoom.append(img);
        zoom.onclick = () => openPhoto(photos, i, zoom);
        // No PDF captions or filenames are injected into the story.
        const caption = el("figcaption", "memory-story-photo-caption", `Photo ${i + 1} of ${photos.length} · Click to enlarge`);
        figure.append(zoom, caption);
        gallery.append(figure);
      });
      body.append(gallery);
    } else if (video) {
      const src = safeUrl(video.currentSrc || video.src);
      if (src) {
        video.pause();
        const player = el("video", "memory-story-video");
        player.src = src;
        player.controls = true;
        player.playsInline = true;
        player.preload = "metadata";
        player.setAttribute("aria-label", title);
        body.append(player);
      }
    }
    if (story) body.append(el("p", "memory-reader-story", story));
    const links = el("div", "memory-story-links");
    card.querySelectorAll(".memory-attachments a[href]").forEach(original => {
      const url = safeUrl(original.href);
      if (!url) return;
      const link = el("a", "", original.textContent);
      link.href = url;
      link.target = "_blank";
      link.rel = "noopener noreferrer nofollow ugc";
      links.append(link);
    });
    if (links.childElementCount) body.append(links);
    dialog.append(toolbar, body);
    reader = dialog;
    document.body.append(dialog);
    document.documentElement.classList.add("memory-media-reading");
    close.onclick = () => dialog.close();
    dialog.addEventListener("click", event => { if (outside(event, dialog)) dialog.close(); });
    dialog.addEventListener("close", () => {
      viewer?.close();
      dialog.querySelectorAll("video").forEach(player => player.pause());
      if (reader === dialog) reader = null;
      document.documentElement.classList.remove("memory-media-reading");
      dialog.remove();
      // The underlying list can refresh while reading. Restore focus to its new button.
      const target = opener.isConnected ? opener : document.getElementById(card.id)?.querySelector(".memory-read-more");
      target?.focus({ preventScroll: true });
    }, { once: true });
    dialog.showModal();
    close.focus({ preventScroll: true });
    dialog.scrollTop = 0;
  }

  // Capture before either renderer's text-only reader handler. Keyboard activation
  // also emits click. A body-level reader remains open through live-list refreshes.
  document.addEventListener("click", event => {
    const opener = event.target instanceof Element ? event.target.closest("button.memory-read-more") : null;
    const card = opener?.closest("article.memory-card");
    if (!card || !card.querySelector("dialog.memory-reader") || reader?.open) return;
    try {
      openStory(card, opener);
      event.preventDefault();
      event.stopImmediatePropagation();
    } catch (error) {
      // Preserve the existing text reader when an older browser cannot enhance it.
      viewer?.close();
      if (reader) { reader.remove(); reader = null; }
      document.documentElement.classList.remove("memory-media-reading");
      console.warn("Photo reader unavailable; opening the standard story reader.", error);
    }
  }, true);
  window.addEventListener("popstate", () => { viewer?.close(); reader?.close(); });
  window.addEventListener("pagehide", () => { viewer?.close(); reader?.close(); });
}

installMemoryReaderMedia();
