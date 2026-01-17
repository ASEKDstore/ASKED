# Icon & Favicon Setup

## Files Created/Updated

### Auto-detected by Next.js (in `src/app/`):
- ✅ `apps/web/src/app/icon.png` (512x512) - Auto-detected as app icon
- ✅ `apps/web/src/app/favicon.ico` - Auto-detected as favicon

### Public Assets (served from `/public`):
- ✅ `apps/web/public/icon.png` - Fallback icon (512x512)
- ✅ `apps/web/public/favicon.ico` - Fallback favicon (via app directory)
- ✅ `apps/web/public/og.png` - Open Graph image (1200x1200 recommended)
- ✅ `apps/web/public/site.webmanifest` - Web app manifest

### Configuration:
- ✅ `apps/web/src/app/layout.tsx` - Updated with comprehensive metadata

## Verification Checklist

After starting the dev server (`pnpm --filter web dev`), verify these URLs return 200:

1. **Icon files:**
   - [ ] http://localhost:3000/icon.png
   - [ ] http://localhost:3000/favicon.ico
   - [ ] http://localhost:3000/og.png

2. **Manifest:**
   - [ ] http://localhost:3000/site.webmanifest

3. **Browser tab:**
   - [ ] Open http://localhost:3000 in browser
   - [ ] Check browser tab shows ASKED icon

4. **Telegram Mini App:**
   - [ ] Open app in Telegram
   - [ ] Check header shows ASKED icon

5. **DevTools verification:**
   - [ ] Open DevTools → Network tab
   - [ ] Reload page
   - [ ] Verify `/icon.png`, `/favicon.ico`, `/site.webmanifest` load successfully (200 status)

## Metadata Configuration

The `layout.tsx` includes:
- `metadata.icons` - Multiple icon formats for different contexts
- `metadata.manifest` - Links to web app manifest
- `metadata.openGraph` - Social sharing images
- `metadata.twitter` - Twitter card configuration

## Notes

- Next.js automatically detects `icon.png` and `favicon.ico` in the `app` directory
- Files in `public/` are served at root path (`/icon.png`)
- Telegram may cache icons - allow time for updates or clear cache
- For production, ensure all files are included in build output









