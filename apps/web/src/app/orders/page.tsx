'use client';

import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { AlertCircle, ShoppingBag, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

import { HEADER_HEIGHT_PX } from '@/components/Header';
import { OrderDetailsDrawer } from '@/components/orders/OrderDetailsDrawer';
import { useTelegram } from '@/hooks/useTelegram';
import { api } from '@/lib/api';
import { formatPrice, formatDateTime } from '@/lib/utils';

// Use same background image as Home page
const BG_IMAGE_URL = '/home-bg.jpg';

const statusLabels: Record<string, string> = {
  NEW: 'Новый',
  CONFIRMED: 'Подтвержден',
  IN_PROGRESS: 'В работе',
  DONE: 'Выполнен',
  CANCELED: 'Отменен',
};

export default function OrdersPage(): JSX.Element {
  const { initData, isTelegram } = useTelegram();
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Calculate header height with safe area
  const headerTotalHeight = `calc(${HEADER_HEIGHT_PX}px + env(safe-area-inset-top, 0px))`;

  const {
    data: ordersData,
    isLoading: isLoadingOrders,
    error: ordersError,
  } = useQuery({
    queryKey: ['orders', 'my', initData],
    queryFn: () => api.getMyOrders(initData),
    enabled: !!initData && isTelegram,
    retry: false,
  });

  const handleOpenOrder = (orderId: string) => {
    try {
      window.Telegram?.WebApp?.HapticFeedback?.impactOccurred?.('light');
    } catch {
      // Ignore if not in Telegram
    }
    setSelectedOrderId(orderId);
    setIsDrawerOpen(true);
  };

  const handleCloseOrder = () => {
    setIsDrawerOpen(false);
    setSelectedOrderId(null);
  };

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

  return (
    <>
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
              <h1 className="text-[clamp(28px,7vw,36px)] font-bold text-white">Мои заказы</h1>
            </div>

            {/* Loading State */}
            {isLoadingOrders && (
              <div className="w-full text-center py-12">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-white/30"></div>
                <p className="mt-4 text-white/60 text-sm">Загрузка заказов...</p>
              </div>
            )}

            {/* Error State */}
            {ordersError && (
              <div className="w-full rounded-[20px] bg-red-900/20 backdrop-blur-xl border border-red-500/30 p-6 text-center">
                <p className="text-red-300 text-sm mb-4">Ошибка загрузки заказов</p>
                <p className="text-red-300/60 text-xs">
                  {ordersError instanceof Error ? ordersError.message : 'Попробуйте обновить страницу'}
                </p>
              </div>
            )}

            {/* Empty State */}
            {!isLoadingOrders && !ordersError && (!ordersData || ordersData.items.length === 0) && (
              <div className="w-full rounded-[20px] bg-black/30 backdrop-blur-xl border border-white/10 p-8 text-center">
                <ShoppingBag className="w-12 h-12 text-white/40 mx-auto mb-3" />
                <p className="text-white/60 text-sm mb-4">У вас пока нет заказов</p>
                <Link href="/catalog">
                  <button className="rounded-full px-6 py-2.5 bg-white/12 hover:bg-white/16 text-white font-medium backdrop-blur-xl border border-white/10 transition-colors text-sm">
                    Перейти в каталог
                  </button>
                </Link>
              </div>
            )}

            {/* Orders List */}
            {!isLoadingOrders && !ordersError && ordersData && ordersData.items.length > 0 && (
              <div className="w-full space-y-3">
                {ordersData.items.map((order) => (
                  <motion.div
                    key={order.id}
                    whileTap={{ scale: 0.98 }}
                    className="rounded-[20px] bg-black/30 backdrop-blur-xl border border-white/10 p-4"
                  >
                    {/* Title Line */}
                    <p className="text-white font-semibold text-sm mb-2">
                      Заказ {order.number || `№${order.id.slice(0, 8)}`} —{' '}
                      {statusLabels[order.status] || order.status}
                    </p>

                    {/* Date */}
                    <p className="text-white/60 text-xs mb-2">
                      Дата: {formatDateTime(order.createdAt)}
                    </p>

                    {/* Total */}
                    <div className="flex items-center justify-between pt-3 border-t border-white/10 mb-3">
                      <span className="text-white/60 text-sm">На сумму:</span>
                      <span className="text-white font-semibold text-sm">
                        {formatPrice(order.totalAmount, order.currency)}
                      </span>
                    </div>

                    {/* Open Button */}
                    <button
                      onClick={() => handleOpenOrder(order.id)}
                      className="w-full rounded-full px-4 py-2.5 bg-white/10 hover:bg-white/12 text-white font-medium text-sm transition-colors flex items-center justify-center gap-2"
                    >
                      Открыть
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Order Details Drawer */}
      <OrderDetailsDrawer
        isOpen={isDrawerOpen}
        onClose={handleCloseOrder}
        orderId={selectedOrderId}
      />
    </>
  );
}
