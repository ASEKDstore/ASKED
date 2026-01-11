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
import { formatPrice, formatDateTime } from '@/lib/utils';

// Use same background image as Home page
const BG_IMAGE_URL = '/home-bg.jpg';

export default function ProfilePage(): JSX.Element {
  const { initData, isTelegram } = useTelegram();

  // Calculate header height with safe area
  const headerTotalHeight = `calc(${HEADER_HEIGHT_PX}px + env(safe-area-inset-top, 0px))`;

  // Get dev token from environment variable for admin link
  const DEV_ADMIN_TOKEN = process.env.NEXT_PUBLIC_ADMIN_DEV_TOKEN ?? '';

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

  const {
    data: lastOrder,
    isLoading: isLoadingLastOrder,
    error: lastOrderError,
  } = useQuery({
    queryKey: ['orders', 'my', 'last', initData],
    queryFn: () => api.getMyLastOrder(initData),
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

          {/* Latest Order Card - Loading Skeleton */}
          {isLoadingLastOrder && (
            <div className="w-full mb-6">
              <div className="rounded-[20px] bg-black/30 backdrop-blur-xl border border-white/10 p-4 animate-pulse">
                <div className="h-4 bg-white/10 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-white/10 rounded w-1/2 mb-2"></div>
                <div className="h-4 bg-white/10 rounded w-1/3 mb-3"></div>
                <div className="pt-3 border-t border-white/10">
                  <div className="h-9 bg-white/10 rounded-full"></div>
                </div>
              </div>
            </div>
          )}

          {/* Latest Order Card - Error State (Dev Only) */}
          {!isLoadingLastOrder && lastOrderError && process.env.NODE_ENV !== 'production' && (
            <div className="w-full mb-6">
              <div className="rounded-[20px] bg-red-900/20 backdrop-blur-xl border border-red-500/30 p-3">
                <p className="text-red-400 text-xs font-medium mb-1">Ошибка загрузки последнего заказа</p>
                <p className="text-red-300/80 text-xs">
                  {lastOrderError instanceof Error
                    ? lastOrderError.message
                    : String(lastOrderError)}
                </p>
              </div>
            </div>
          )}

          {/* Latest Order Card */}
          {!isLoadingLastOrder && lastOrder && (
            <div className="w-full mb-6">
              <motion.div
                whileTap={{ scale: 0.98 }}
                className="rounded-[20px] bg-black/30 backdrop-blur-xl border border-white/10 p-4"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-semibold text-sm mb-1">
                      Заказ {lastOrder.number || `№${lastOrder.id.slice(0, 8)}`} —{' '}
                      {lastOrder.status === 'NEW' && 'Новый'}
                      {lastOrder.status === 'CONFIRMED' && 'Подтвержден'}
                      {lastOrder.status === 'IN_PROGRESS' && 'В работе'}
                      {lastOrder.status === 'DONE' && 'Выполнен'}
                      {lastOrder.status === 'CANCELED' && 'Отменен'}
                    </p>
                    <p className="text-white/60 text-xs mb-2">
                      {formatDateTime(lastOrder.createdAt)}
                    </p>
                    <p className="text-white font-medium text-sm">
                      {formatPrice(lastOrder.totalAmount, lastOrder.currency)}
                    </p>
                  </div>
                </div>
                <div className="pt-3 border-t border-white/10">
                  <button
                    onClick={() => {
                      try {
                        window.Telegram?.WebApp?.HapticFeedback?.impactOccurred?.('light');
                      } catch {
                        // Ignore if not in Telegram
                      }
                      // Scroll to orders list below
                      const ordersSection = document.getElementById('my-orders-section');
                      if (ordersSection) {
                        ordersSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      }
                    }}
                    className="w-full rounded-full px-4 py-2 bg-white/10 hover:bg-white/12 text-white font-medium text-sm transition-colors flex items-center justify-center gap-2"
                  >
                    Открыть
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
              {/* Debug info (dev only) */}
              {process.env.NODE_ENV !== 'production' && (
                <div className="text-xs text-white/40 mt-1 px-1 font-mono">
                  Debug: Order ID: {lastOrder.id.slice(0, 8)} | Status: {lastOrder.status}
                </div>
              )}
            </div>
          )}

          {/* Admin Panel Button - Show always (access is protected by admin routes) */}
          <div className="w-full mb-6">
            <Link href={DEV_ADMIN_TOKEN ? `/admin?token=${encodeURIComponent(DEV_ADMIN_TOKEN)}` : '/admin'}>
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
          <div id="my-orders-section" className="w-full">
            <MyOrdersList />
          </div>
        </div>
      </div>
    </div>
  );
}
