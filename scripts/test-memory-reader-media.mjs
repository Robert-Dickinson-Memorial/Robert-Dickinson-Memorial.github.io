// Read-only smoke test of the built/public Memories UI, using the existing
// Playwright installation from the memory-book build. No records are written.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.MEMORIAL_BOOK_PLAYWRIGHT || 'playwright');
const target = process.argv[2] || '_site';
let server;
let origin = target;
if (!/^https?:\/\//.test(target)) {
  const root = path.resolve(target);
  const types = {'.html':'text/html', '.js':'text/javascript', '.css':'text/css', '.json':'application/json', '.jpg':'image/jpeg', '.png':'image/png', '.webp':'image/webp', '.svg':'image/svg+xml', '.mp4':'video/mp4', '.pdf':'application/pdf', '.woff2':'font/woff2'};
  server = http.createServer((request, response) => {
    try {
      let file = path.resolve(root, '.' + decodeURIComponent(new URL(request.url, 'http://localhost').pathname));
      if (!file.startsWith(root + path.sep) && file !== root) throw new Error('Invalid path');
      if (fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
      response.writeHead(200, {'content-type': types[path.extname(file)] || 'application/octet-stream'});
      fs.createReadStream(file).pipe(response);
    } catch { response.writeHead(404); response.end(); }
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  origin = `http://127.0.0.1:${server.address().port}`;
}
origin = origin.replace(/\/$/, '');
const browser = await chromium.launch({headless:true});
try {
  for (const width of [1440, 390]) {
    const page = await browser.newPage({viewport:{width, height:width > 600 ? 1000 : 844}});
    if (server) await page.addInitScript(() => { window.MEMORIAL_BOOK_SNAPSHOT = true; });
    await page.goto(origin + '/memories/', {waitUntil:'domcontentloaded'});
    await page.waitForFunction(() => Boolean(window[Symbol.for('rd-memorial.memory-reader-media.v1')]), {timeout:30000});
    await page.locator('.memory-card .memory-read-more').first().waitFor({timeout:45000});
    const photoId = await page.evaluate(() => {
      const cards = [...document.querySelectorAll('.memory-card')];
      const eligible = c => c.querySelector('.memory-read-more') && c.querySelector('.memory-card-media img') && !c.querySelector('.memory-card-media video');
      return cards.find(c => c.id === 'memory-23' && eligible(c))?.id || cards.find(eligible)?.id;
    });
    assert.ok(photoId, 'A published memory with a photograph is required for this test');
    const card = page.locator(`[id="${photoId}"]`);
    const source = await card.evaluate(c => ({
      story:c.querySelector('.memory-reader-story').textContent,
      images:[...new Set([...c.querySelectorAll('.memory-card-media img')].map(i=>i.currentSrc || i.src))]
    }));
    await card.locator('.memory-read-more').click();
    const reader = page.locator('.memory-reader--illustrated[open]');
    await reader.waitFor();
    assert.equal(await reader.locator('.memory-reader-story').textContent(), source.story, 'Full story text must not change');
    assert.equal(await reader.locator('.memory-story-photo').count(), source.images.length, 'All attached photographs must appear');
    assert.deepEqual(await reader.locator('.memory-story-photo').evaluateAll(images=>images.map(i=>i.src)), source.images, 'Use the same approved image URLs, not thumbnail copies');
    await page.waitForFunction(() => document.querySelector('.memory-story-photo')?.naturalWidth > 0, {timeout:30000});
    const fit = await reader.locator('.memory-story-photo').first().evaluate(i=>getComputedStyle(i).objectFit);
    assert.equal(fit, 'contain', 'Show the complete photograph, not a crop');
    await reader.locator('.memory-story-photo-button').first().click();
    const zoom = page.locator('.memory-photo-viewer[open]');
    await zoom.waitFor();
    await page.waitForFunction(() => document.querySelector('.memory-photo-image')?.naturalWidth > 0, {timeout:30000});
    const before = (await zoom.locator('.memory-photo-image').boundingBox()).width;
    await zoom.getByRole('button',{name:'Zoom in',exact:true}).click();
    assert.ok((await zoom.locator('.memory-photo-image').boundingBox()).width > before, 'Zoom in must enlarge the photograph');
    assert.equal(await zoom.locator('.memory-photo-original').getAttribute('href'), source.images[0]);
    await zoom.getByRole('button',{name:'Fit photograph to screen',exact:true}).click();
    if (source.images.length > 1) {
      await zoom.getByRole('button',{name:'Next photograph',exact:true}).click();
      assert.match(await zoom.locator('.memory-photo-counter').textContent(), /^Photo 2 of /);
    }
    await page.keyboard.press('Escape');
    await zoom.waitFor({state:'detached'});
    assert.equal(await reader.count(), 1, 'Closing zoom returns to the full story');
    assert.ok(await page.evaluate(()=>document.activeElement?.classList.contains('memory-story-photo-button')), 'Keyboard focus returns to the photograph');
    if (server) {
      await card.evaluate(c=>c.replaceWith(c.cloneNode(true)));
      assert.equal(await reader.count(),1,'A list refresh must not close the reader');
    }
    await page.keyboard.press('Escape');
    await reader.waitFor({state:'detached'});
    assert.equal(await page.evaluate(()=>document.activeElement?.closest('.memory-card')?.id),photoId);
    assert.equal(await page.evaluate(()=>document.documentElement.classList.contains('memory-media-reading')),false);
    // Preserve the previously requested video-only cover rule.
    const videoId = await page.evaluate(()=>[...document.querySelectorAll('.memory-card')].find(c=>c.querySelector('.memory-card-media video') && c.querySelector('.memory-read-more'))?.id);
    if (videoId) {
      await page.locator(`[id="${videoId}"] .memory-read-more`).click();
      await reader.waitFor();
      assert.equal(await reader.locator('video').count(),1);
      assert.equal(await reader.locator('img').count(),0);
      await page.keyboard.press('Escape');
      await reader.waitFor({state:'detached'});
    }
    console.log(`PASS ${width}px: full story and ${source.images.length} photo(s), real zoom, original-image link, Escape/focus restoration, video-only policy.`);
    if (process.env.MEMORIAL_READER_SCREENSHOTS) {
      await page.locator(`[id="${photoId}"] .memory-read-more`).click();
      await reader.waitFor();
      fs.mkdirSync(process.env.MEMORIAL_READER_SCREENSHOTS,{recursive:true});
      await page.screenshot({path:path.join(process.env.MEMORIAL_READER_SCREENSHOTS,`memory-reader-${width}.png`)});
      await page.keyboard.press('Escape');
    }
    await page.close();
  }
} finally {
  await browser.close();
  if (server) await new Promise(resolve=>server.close(resolve));
}
