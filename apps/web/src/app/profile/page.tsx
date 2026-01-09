'use client';

import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { AlertCircle, User as UserIcon, ArrowRight, Shield } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

import { HEADER_HEIGHT_PX } from '@/components/Header';
import { MyOrdersList } from '@/components/orders/MyOrdersList';
import { useTelegram } from '@/hooks/useTelegram';
import { api } from '@/lib/api';
import { getTokenFromUrl } from '@/lib/admin-nav';

// Use same background image as Home page
const BG_IMAGE_URL = '/home-bg.jpg';

export default function ProfilePage(): JSX.Element {
  const { initData, isTelegram } = useTelegram();

  // Calculate header height with safe area
  const headerTotalHeight = `calc(${HEADER_HEIGHT_PX}px + env(safe-area-inset-top, 0px))`;

  // Check for dev token (for preserving in admin link)
  const devToken = typeof window !== 'undefined' ? getTokenFromUrl() : null;
  const DEV_ADMIN_TOKEN = process.env.NEXT_PUBLIC_ADMIN_DEV_TOKEN ?? '';
  const hasDevToken = devToken && DEV_ADMIN_TOKEN !== '' && devToken === DEV_ADMIN_TOKEN;

  const {
    data: user,
    isLoading: isLoadingUser,
    error: userError,
  } = useQuery({
    queryKey: ['me', initData],
    queryFn: () => api.getMe(initData),
    enabled: !!initData && isTelegram,
    retry: false,
  });

  if (!isTelegram) {
    return (
      <div className="fixed inset-0 overflow-hidden">
        <div className="fixed inset-0 z-0">
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{
              backgroundImage: `url(${BG_IMAGE_URL})`,
              backgroundAttachment: 'fixed',
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/50 to-black/70" />
          <div
            className="absolute inset-0 backdrop-blur-[12px]"
            style={{
              WebkitBackdropFilter: 'blur(12px)',
            }}
          />
        </div>
        <div
          className="relative z-10 h-full overflow-y-auto overflow-x-hidden overscroll-none"
          style={{
            paddingTop: headerTotalHeight,
            paddingBottom: 'env(safe-area-inset-bottom, 0px)',
            WebkitOverflowScrolling: 'touch',
          }}
        >
          <div className="min-h-full flex items-center justify-center px-4 py-12">
            <div className="w-full max-w-md rounded-[24px] bg-black/30 backdrop-blur-xl border border-white/10 p-8 text-center">
              <AlertCircle className="w-16 h-16 text-white/40 mx-auto mb-4" />
              <h1 className="text-[24px] font-bold text-white mb-2">Откройте в Telegram</h1>
              <p className="text-white/60 text-[15px] leading-relaxed">
                Это приложение работает внутри Telegram. Откройте его через Telegram WebApp.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isLoadingUser) {
    return (
      <div className="fixed inset-0 overflow-hidden">
        <div className="fixed inset-0 z-0">
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{
              backgroundImage: `url(${BG_IMAGE_URL})`,
              backgroundAttachment: 'fixed',
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/50 to-black/70" />
        </div>
        <div
          className="relative z-10 h-full overflow-y-auto overflow-x-hidden overscroll-none flex items-center justify-center"
          style={{
            paddingTop: headerTotalHeight,
            paddingBottom: 'env(safe-area-inset-bottom, 0px)',
          }}
        >
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-white/30"></div>
        </div>
      </div>
    );
  }

  if (userError) {
    const apiError = userError as { message?: string; statusCode?: number };
    return (
      <div className="fixed inset-0 overflow-hidden">
        <div className="fixed inset-0 z-0">
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{
              backgroundImage: `url(${BG_IMAGE_URL})`,
              backgroundAttachment: 'fixed',
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/50 to-black/70" />
        </div>
        <div
          className="relative z-10 h-full overflow-y-auto overflow-x-hidden overscroll-none"
          style={{
            paddingTop: headerTotalHeight,
            paddingBottom: 'env(safe-area-inset-bottom, 0px)',
          }}
        >
          <div className="min-h-full flex items-center justify-center px-4 py-12">
            <div className="w-full max-w-md rounded-[24px] bg-black/30 backdrop-blur-xl border border-white/10 p-8 text-center">
              <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
              <h1 className="text-[24px] font-bold text-white mb-2">Ошибка загрузки</h1>
              <p className="text-white/60 text-[15px] mb-4">
                {apiError.message || 'Произошла ошибка'}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const displayName =
    user?.firstName && user?.lastName
      ? `${user.firstName} ${user.lastName}`
      : user?.firstName || user?.username || 'Пользователь';

  return (
    <div className="fixed inset-0 overflow-hidden">
      {/* Fixed Background Layers */}
      <div className="fixed inset-0 z-0">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url(${BG_IMAGE_URL})`,
            backgroundAttachment: 'fixed',
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/50 to-black/70" />
        <div
          className="absolute inset-0 backdrop-blur-[12px]"
          style={{
            WebkitBackdropFilter: 'blur(12px)',
          }}
        />
        <div
          className="absolute inset-0 opacity-[0.03] mix-blend-overlay"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='180' height='180' filter='url(%23n)' opacity='.35'/%3E%3C/svg%3E")`,
            backgroundSize: '180px 180px',
          }}
        />
      </div>

      {/* Scrollable Content */}
      <div
        className="relative z-10 h-full overflow-y-auto overflow-x-hidden overscroll-none"
        style={{
          paddingTop: headerTotalHeight,
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        <div className="min-h-full flex flex-col items-start pb-16 px-4">
          {/* Header */}
          <div className="w-full mb-6 pt-6">
            <h1 className="text-[clamp(28px,7vw,36px)] font-bold text-white">Профиль</h1>
          </div>

          {/* User Info Card */}
          <div className="w-full mb-6">
            <div className="rounded-[20px] bg-black/30 backdrop-blur-xl border border-white/10 p-6">
              <div className="flex items-center gap-4 mb-4">
                {user?.photoUrl ? (
                  <div className="relative w-16 h-16 rounded-full overflow-hidden flex-shrink-0">
                    <Image
                      src={user.photoUrl}
                      alt={displayName}
                      fill
                      className="object-cover"
                      sizes="64px"
                      unoptimized
                    />
                  </div>
                ) : (
                  <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
                    <UserIcon className="w-8 h-8 text-white/60" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h2 className="text-white font-semibold text-lg mb-1 truncate">{displayName}</h2>
                  {user?.username && (
                    <p className="text-white/60 text-sm truncate">@{user.username}</p>
                  )}
                </div>
              </div>
              {user?.telegramId && (
                <div className="pt-4 border-t border-white/10">
                  <p className="text-white/60 text-xs mb-1">Telegram ID</p>
                  <p className="text-white/80 text-sm font-mono">{user.telegramId}</p>
                </div>
              )}
            </div>
          </div>

          {/* Admin Panel Button - Show always (access is protected by admin routes) */}
          <div className="w-full mb-6">
            <Link href={hasDevToken && devToken ? `/admin?token=${encodeURIComponent(devToken)}` : '/admin'}>
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => {
                  try {
                    window.Telegram?.WebApp?.HapticFeedback?.impactOccurred?.('light');
                  } catch {
                    // Ignore if not in Telegram
                  }
                }}
                className="w-full rounded-[20px] bg-black/30 backdrop-blur-xl border border-white/10 p-4 flex items-center justify-between hover:bg-black/40 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                    <Shield className="w-5 h-5 text-white/80" />
                  </div>
                  <div className="text-left">
                    <p className="text-white font-medium text-sm">Войти в админку</p>
                    <p className="text-white/60 text-xs">Панель управления</p>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-white/60" />
              </motion.button>
            </Link>
          </div>

          {/* Мои заказы Section */}
          <div className="w-full">
            <MyOrdersList />

            {/* Admin Panel Button */}
            <div className="mt-4">
              <Link href={hasDevToken && devToken ? `/admin?token=${encodeURIComponent(devToken)}` : '/admin'}>
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  transition={{ duration: 0.18 }}
                  onClick={() => {
                    try {
                      window.Telegram?.WebApp?.HapticFeedback?.impactOccurred?.('light');
                    } catch {
                      // Ignore if not in Telegram
                    }
                  }}
                  className="w-full rounded-full bg-white/10 backdrop-blur-xl border border-white/10 shadow-sm py-3.5 px-4 text-white font-medium text-sm flex items-center justify-center gap-2 hover:bg-white/12 transition-all duration-200 active:scale-[0.97]"
                >
                  <span>Войти в админку</span>
                  <ArrowRight className="w-4 h-4" />
                </motion.button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
