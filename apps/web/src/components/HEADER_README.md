# Header, SideMenu, and ProfileSheet Components

## Overview

This document describes the header navigation system for the ASKED Mini App, including the Header, SideMenu (burger menu), and ProfileSheet components.

## Components

### Header (`components/Header.tsx`)

Fixed header at the top of the page with:
- **Left**: ASKED logo (navigates to `/`)
- **Center**: User name from Telegram (opens ProfileSheet)
- **Right**: Burger menu icon (opens SideMenu)

The header is automatically hidden on admin pages (`/admin/*`).

### SideMenu (`components/SideMenu.tsx`)

Slide-in menu from the left with navigation items:
- Главная (`/`)
- Корзина (`/cart`)
- Каталог (`/catalog`)
- Lab mod (`/lab`)
- Отзывы (`/reviews`)
- Divider
- О нас (`/about`)
- Доки (`/docs`)
- Помощь (`/help`)
- Сотрудничество (`/partners`)

### ProfileSheet (`components/ProfileSheet.tsx`)

Slide-in profile sheet from the bottom showing:
- User avatar (from Telegram `photo_url` or placeholder)
- User name and username
- Telegram ID
- Buttons: "Мои заказы" and "Войти в админку" (if admin access)

## Adding New Menu Items

To add a new menu item to the SideMenu:

1. Open `apps/web/src/components/SideMenu.tsx`
2. Find the `menuItems` array
3. Add a new item object:

```typescript
const menuItems: MenuItem[] = [
  // ... existing items
  { label: 'Новый пункт', icon: YourIcon, href: '/your-route' },
];
```

4. Import the icon from `lucide-react` at the top of the file
5. Create the corresponding route page in `apps/web/src/app/your-route/page.tsx`

### Adding a Divider

To add a divider line in the menu:

```typescript
{ label: '', icon: Minus, href: '', divider: true },
```

## Styling

All components use:
- Dark/glass theme with backdrop blur
- Safe-area insets for iPhone notch support
- Framer Motion for smooth animations
- Tailwind CSS for styling

## Header Height

The header height is exported as `HEADER_HEIGHT_PX` constant (64px). Pages should add padding-top to avoid content overlap:

```typescript
import { HEADER_HEIGHT_PX } from '@/components/Header';

<div
  style={{ paddingTop: `calc(${HEADER_HEIGHT_PX}px + 2rem + env(safe-area-inset-top, 0px))` }}
>
  {/* Your content */}
</div>
```

## Dependencies

- `framer-motion` - For animations
- `lucide-react` - For icons
- `next/navigation` - For routing

## Accessibility

- Keyboard support (ESC to close overlays)
- ARIA labels on buttons
- Focus trap in overlays (via Overlay component)

## Notes

- The Header is automatically included in `app/layout.tsx`
- ProfileSheet shows admin button only if `?token` is in URL or in development mode
- All overlays close on backdrop click or ESC key press




