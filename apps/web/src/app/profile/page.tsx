'use client';

import { useQuery } from '@tanstack/react-query';
import { AlertCircle, User as UserIcon, ShoppingBag } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

import { HEADER_HEIGHT_PX } from '@/components/Header';
import { useTelegram } from '@/hooks/useTelegram';
import { api } from '@/lib/api';
import { formatPrice } from '@/lib/utils';

// Use same background image as Home page
const BG_IMAGE_URL = '/home-bg.jpg';

const statusLabels: Record<string, string> = {
  NEW: 'Новый',
  CONFIRMED: 'Подтвержден',
  IN_PROGRESS: 'В работе',
  DONE: 'Выполнен',
  CANCELED: 'Отменен',
};

const statusColors: Record<string, string> = {
  NEW: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  CONFIRMED: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
  IN_PROGRESS: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
  DONE: 'bg-green-500/20 text-green-300 border-green-500/30',
  CANCELED: 'bg-red-500/20 text-red-300 border-red-500/30',
};

export default function ProfilePage(): JSX.Element {
  const { initData, isTelegram } = useTelegram();

  // Calculate header height with safe area
  const headerTotalHeight = `calc(${HEADER_HEIGHT_PX}px + env(safe-area-inset-top, 0px))`;

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
    data: ordersData,
    isLoading: isLoadingOrders,
  } = useQuery({
    queryKey: ['orders', 'my', initData],
    queryFn: () => api.getMyOrders(initData),
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

          {/* Мои заказы Section */}
          <div className="w-full">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-white font-semibold text-xl">Мои заказы</h2>
              {ordersData && ordersData.items.length > 0 && (
                <span className="text-white/60 text-sm">
                  {ordersData.items.length} {ordersData.items.length === 1 ? 'заказ' : 'заказов'}
                </span>
              )}
            </div>

            {isLoadingOrders ? (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-white/30"></div>
                <p className="mt-4 text-white/60 text-sm">Загрузка заказов...</p>
              </div>
            ) : ordersData && ordersData.items.length > 0 ? (
              <div className="space-y-3">
                {ordersData.items.map((order) => (
                  <div
                    key={order.id}
                    className="rounded-[20px] bg-black/30 backdrop-blur-xl border border-white/10 p-4"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="text-white/60 text-xs mb-1">Заказ №{order.id.slice(0, 8)}</p>
                        <p className="text-white font-medium text-sm">
                          {new Date(order.createdAt).toLocaleDateString('ru-RU', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                          })}
                        </p>
                      </div>
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-medium border ${statusColors[order.status] || statusColors.NEW}`}
                      >
                        {statusLabels[order.status] || order.status}
                      </span>
                    </div>
                    <div className="flex items-center justify-between pt-3 border-t border-white/10">
                      <span className="text-white/60 text-sm">Сумма</span>
                      <span className="text-white font-semibold">{formatPrice(order.totalAmount)}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-[20px] bg-black/30 backdrop-blur-xl border border-white/10 p-8 text-center">
                <ShoppingBag className="w-12 h-12 text-white/40 mx-auto mb-3" />
                <p className="text-white/60 text-sm mb-4">У вас пока нет заказов</p>
                <Link href="/catalog">
                  <button className="rounded-full px-6 py-2.5 bg-white/12 hover:bg-white/16 text-white font-medium backdrop-blur-xl border border-white/10 transition-colors text-sm">
                    Перейти в каталог
                  </button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
