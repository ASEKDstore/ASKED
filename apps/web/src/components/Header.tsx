'use client';

import { User, Bell } from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';

import { useTelegramUser } from '@/hooks/useTelegramUser';
import { useUnreadNotifications } from '@/hooks/useUnreadNotifications';

import { MenuToggleIcon } from './MenuToggleIcon';
import { ProfileSheet } from './ProfileSheet';
import { SideMenu } from './SideMenu';

const HEADER_HEIGHT = 56;
const HEADER_PADDING_Y = 12;

export function Header(): JSX.Element {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useTelegramUser();
  const { unreadCount } = useUnreadNotifications();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  // Note: error and isAuthError are available from useUnreadNotifications
  // but not used in UI to avoid showing auth errors to users
  // They are logged in dev mode via API client

  // Focus trap: focus menu container when opened
  useEffect(() => {
    if (isMenuOpen) {
      const menuElement = document.querySelector('[data-menu-container]') as HTMLElement;
      menuElement?.focus();
    }
  }, [isMenuOpen]);

  const handleLogoClick = () => {
    if (pathname !== '/') {
      router.push('/');
    }
  };


  const handleMenuToggle = () => {
    setIsMenuOpen((prev) => !prev);
    // Close profile if menu is opening
    if (!isMenuOpen) {
      setIsProfileOpen(false);
    }
  };

  const handleProfileOpen = () => {
    setIsProfileOpen(true);
    // Close menu if opening profile
    if (isMenuOpen) {
      setIsMenuOpen(false);
    }
  };

  const userName = user?.first_name || 'Гость';
  const displayName =
    user?.first_name && user?.last_name
      ? `${user.first_name} ${user.last_name}`
      : userName;

  // Don't show header on admin pages
  if (pathname?.startsWith('/admin')) {
    return <></>;
  }

  return (
    <>
      <header
        className="fixed top-0 left-0 right-0 z-40 flex items-center justify-center px-4 pointer-events-none"
        style={{
          paddingTop: `calc(env(safe-area-inset-top, 0px) + ${HEADER_PADDING_Y}px)`,
          height: `calc(${HEADER_HEIGHT}px + env(safe-area-inset-top, 0px) + ${HEADER_PADDING_Y * 2}px)`,
        }}
      >
        {/* Glass Island Pill */}
        <div
          className="w-full max-w-[95vw] flex items-center justify-between px-5 py-3 rounded-[28px] bg-black/40 backdrop-blur-2xl shadow-[0_8px_32px_rgba(0,0,0,0.3)] pointer-events-auto"
          style={{
            minHeight: `${HEADER_HEIGHT}px`,
          }}
        >
          {/* Left: Logo */}
          <button
            onClick={handleLogoClick}
            className="flex items-center justify-center active:opacity-70 transition-opacity duration-150"
            aria-label="Home"
          >
            <span className="text-white font-semibold text-[clamp(14px,4vw,16px)] tracking-tight">
              ASKED
            </span>
          </button>

          {/* Center: User Name + Notifications */}
          <div className="flex items-center gap-2 flex-1 min-w-0 max-w-[200px] mx-2">
            <button
              onClick={handleProfileOpen}
              className="flex items-center gap-2 px-3 py-1.5 active:opacity-70 transition-opacity duration-150 min-w-0 flex-1"
              aria-label="Profile"
              aria-expanded={isProfileOpen}
            >
              <User className="w-[clamp(14px,3.5vw,16px)] h-[clamp(14px,3.5vw,16px)] text-white/90 flex-shrink-0" />
              <span className="text-white text-[clamp(13px,3.5vw,15px)] font-medium truncate">
                {displayName}
              </span>
              {unreadCount > 0 && (
                <span className="flex items-center justify-center min-w-[18px] h-[18px] px-1.5 rounded-full bg-red-500 text-white text-[10px] font-semibold flex-shrink-0">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </button>
            <button
              onClick={() => router.push('/notifications')}
              className="relative flex items-center justify-center w-9 h-9 active:opacity-70 transition-opacity duration-150 text-white"
              aria-label="Notifications"
            >
              <Bell className="w-[clamp(16px,4vw,18px)] h-[clamp(16px,4vw,18px)]" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1.5 rounded-full bg-red-500 text-white text-[10px] font-semibold">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </button>
          </div>

          {/* Right: Menu Toggle - Only show when menu is closed */}
          {!isMenuOpen && (
            <button
              onClick={handleMenuToggle}
              className="flex items-center justify-center w-9 h-9 active:opacity-70 transition-opacity duration-150 text-white"
              aria-label="Open menu"
              aria-expanded={false}
            >
              <MenuToggleIcon isOpen={false} />
            </button>
          )}
        </div>
      </header>

      <SideMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
      <ProfileSheet isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} />
    </>
  );
}

export const HEADER_HEIGHT_PX = HEADER_HEIGHT + HEADER_PADDING_Y * 2;

