# Public Assets

This directory contains static assets served at the root path.

## Icon Setup

To set the application favicon:

1. Add a square PNG image (512x512 pixels recommended) as `icon.png`
2. The icon will automatically be used as:
   - Favicon in browser tabs
   - App icon in Telegram Mini App header
   - Apple touch icon for iOS devices

**Note:** Telegram may cache the icon. If you update the icon:
- Clear Telegram cache or wait for cache expiration
- Use a different filename or add a query parameter to force refresh
- The icon is configured in `src/app/layout.tsx` via `metadata.icons`







