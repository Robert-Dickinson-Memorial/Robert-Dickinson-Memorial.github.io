# Shared portrait banners

Home, His Life, Scientific Legacy and Share A Memory now use the same saved `siteAssets.portrait` and `siteAssets.horizon`. The portrait occupies the same left-hand position at each viewport size, with CSS edge fades and no card frame. Original photographs remain unchanged. All existing page text is retained.

Owner controls: Manage memorial → Home → Shared banner images. Upload replacement updates the existing shared asset; Save image settings stores alt-text edits. Restore original uses the existing reset endpoint. The former homepage-only aspect-ratio selector was removed because all four banners now use a consistent responsive crop.

Both Worker rendering and Pages hydration consume the same saved assets. The Pages mirror build also inserts the saved wordmark and mirrored portrait/background into initial HTML, avoiding a fallback-image/name flash before hydration and retaining same-origin media delivery. Runtime updates continue to refresh from the content API. The static mirror updates on the existing publication schedule.

The nav wordmark uses a named cross-document view transition in supporting browsers; other browsers retain ordinary full-page navigation with the same initial name and styling. Reduced-motion preferences disable transition animation.

Backup: `backup/before-shared-portraits-2026-09-30`, commit `e49fab3842f54cb4bd8d3e36ff14485f318e92a3`. Earlier core/home/timeline backups are untouched.

Validation: production build, four-page desktop/mobile portrait-position and replacement-data checks, initial-HTML prerender escaping check, and narrow-screen navigation/layout checks. No production image replacements were performed during testing.

## Follow-up: left portrait and persistent navigation

The shared portrait is now on the left on desktop and mobile. On GitHub Pages, normal navigation between the seven public tabs now retains the actual navigation element outside the replaced main content. This removes the full-document refresh that the previous visual transition alone did not prevent. Modified clicks, external links, downloads, management pages and the print book keep native behavior. A failed page request or changed deployment version falls back to native navigation.

Each page initialization owns an abort controller, global event listeners, refresh interval and timeline observers. They are cleaned up on navigation, and late asynchronous responses cannot query or repaint the new page. Relative document URLs are resolved before insertion; head URLs are anchored before changing history. Back/Forward, hash links, focus placement and the mobile menu are handled explicitly.

Validation: desktop/mobile navigation across all seven public pages retained the identical header node and document identity, with unchanged wordmark bounds; Back/Forward, the #share shortcut, memory readers, gallery viewer, and memory form controls remained functional. Four-page portrait alignment and editable-asset checks passed at 1440, 768, 390 and 320 pixels; production build passed.
