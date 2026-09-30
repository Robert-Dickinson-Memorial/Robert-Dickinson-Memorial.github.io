# Shared portrait banners

Home, His Life, Scientific Legacy and Share A Memory now use the same saved `siteAssets.portrait` and `siteAssets.horizon`. The portrait occupies the same right-hand position at each viewport size, with CSS edge fades and no card frame. Original photographs remain unchanged. All existing page text is retained.

Owner controls: Manage memorial → Home → Shared banner images. Upload replacement updates the existing shared asset; Save image settings stores alt-text edits. Restore original uses the existing reset endpoint. The former homepage-only aspect-ratio selector was removed because all four banners now use a consistent responsive crop.

Both Worker rendering and Pages hydration consume the same saved assets. The Pages mirror build also inserts the saved wordmark and mirrored portrait/background into initial HTML, avoiding a fallback-image/name flash before hydration and retaining same-origin media delivery. Runtime updates continue to refresh from the content API. The static mirror updates on the existing publication schedule.

The nav wordmark uses a named cross-document view transition in supporting browsers; other browsers retain ordinary full-page navigation with the same initial name and styling. Reduced-motion preferences disable transition animation.

Backup: `backup/before-shared-portraits-2026-09-30`, commit `e49fab3842f54cb4bd8d3e36ff14485f318e92a3`. Earlier core/home/timeline backups are untouched.

Validation: production build, four-page desktop/mobile portrait-position and replacement-data checks, initial-HTML prerender escaping check, and narrow-screen navigation/layout checks. No production image replacements were performed during testing.
