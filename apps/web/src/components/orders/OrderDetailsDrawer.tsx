'use client';

import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { X, MapPin, Phone, User } from 'lucide-react';

import { useTelegram } from '@/hooks/useTelegram';
import { useTelegramBackButton } from '@/hooks/useTelegramBackButton';
import { api } from '@/lib/api';
import { formatPrice, formatDateTime } from '@/lib/utils';

import { Overlay } from '../Overlay';

interface OrderDetailsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string | null;
}

const drawerSpringConfig = {
  type: 'spring' as const,
  damping: 42,
  stiffness: 450,
  mass: 0.9,
};

const exitSpringConfig = {
  type: 'spring' as const,
  damping: 40,
  stiffness: 400,
  mass: 0.8,
};

const DRAG_THRESHOLD = 0.28;
const VELOCITY_THRESHOLD = 400;

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

export function OrderDetailsDrawer({ isOpen, onClose, orderId }: OrderDetailsDrawerProps): JSX.Element {
  const { initData, isTelegram } = useTelegram();

  // Handle Telegram WebApp BackButton
  useTelegramBackButton(isOpen, onClose);

  const { data: order, isLoading, error } = useQuery({
    queryKey: ['order', orderId, initData],
    queryFn: () => api.getMyOrder(initData, orderId!),
    enabled: !!orderId && !!initData && isTelegram && isOpen,
    retry: false,
  });

  const handleDragEnd = (_: unknown, info: PanInfo) => {
    const sheetHeight = 600; // Approximate drawer height
    const threshold = sheetHeight * DRAG_THRESHOLD;
    const shouldClose = info.offset.y > threshold || info.velocity.y > VELOCITY_THRESHOLD;

    if (shouldClose) {
      onClose();
    }
  };

  const sheetVariants = {
    hidden: {
      y: '100%',
      opacity: 0,
      transition: exitSpringConfig,
    },
    visible: {
      y: 0,
      opacity: 1,
      transition: drawerSpringConfig,
    },
    exit: {
      y: '100%',
      opacity: 0,
      transition: exitSpringConfig,
    },
  };

  return (
    <Overlay isOpen={isOpen} onClose={onClose} blur zIndex={50}>
      <AnimatePresence mode="wait">
        {isOpen && (
          <motion.div
            key="order-details-drawer"
            variants={sheetVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.1 }}
            onDragEnd={handleDragEnd}
            className="absolute inset-x-0 bottom-0 h-[90vh] max-h-[800px] bg-black/60 backdrop-blur-3xl overflow-hidden flex flex-col rounded-t-[28px] shadow-[0_0_60px_rgba(0,0,0,0.5)] pointer-events-auto"
            style={{
              paddingTop: 'env(safe-area-inset-top, 0px)',
              paddingBottom: 'env(safe-area-inset-bottom, 0px)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="relative flex items-center justify-between px-6 py-6 flex-shrink-0 border-b border-white/10">
              <h2 className="text-white font-semibold text-[clamp(18px,5vw,20px)] tracking-tight">
                Детали заказа
              </h2>
              <button
                onClick={onClose}
                className="flex items-center justify-center w-10 h-10 rounded-[20px] bg-black/30 backdrop-blur-xl shadow-[0_4px_16px_rgba(0,0,0,0.3)] active:opacity-70 transition-opacity duration-150 text-white"
                aria-label="Закрыть"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-6 py-6">
              {isLoading && (
                <div className="flex items-center justify-center py-12">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-white/30"></div>
                </div>
              )}

              {error && (
                <div className="rounded-[20px] bg-red-900/20 backdrop-blur-xl border border-red-500/30 p-6 text-center">
                  <p className="text-red-300 text-sm mb-2">Ошибка загрузки заказа</p>
                  <p className="text-red-300/60 text-xs">
                    {error instanceof Error ? error.message : 'Попробуйте обновить страницу'}
                  </p>
                </div>
              )}

              {order && (
                <div className="space-y-6">
                  {/* Order Header */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-white font-bold text-xl">
                        Заказ {order.number || `№${order.id.slice(0, 8)}`}
                      </h3>
                      <span
                        className={`px-3 py-1.5 rounded-full text-xs font-medium border ${
                          statusColors[order.status] || statusColors.NEW
                        }`}
                      >
                        {statusLabels[order.status] || order.status}
                      </span>
                    </div>
                    <p className="text-white/60 text-sm">
                      Дата: {formatDateTime(order.createdAt)}
                    </p>
                  </div>

                  {/* Delivery Info */}
                  <div className="rounded-[20px] bg-black/30 backdrop-blur-xl border border-white/10 p-4 space-y-3">
                    <h4 className="text-white font-semibold text-base mb-3">Доставка</h4>
                    {order.customerName && (
                      <div className="flex items-start gap-3">
                        <User className="w-5 h-5 text-white/60 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-white/60 text-xs mb-1">Имя</p>
                          <p className="text-white text-sm">{order.customerName}</p>
                        </div>
                      </div>
                    )}
                    {order.customerPhone && (
                      <div className="flex items-start gap-3">
                        <Phone className="w-5 h-5 text-white/60 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-white/60 text-xs mb-1">Телефон</p>
                          <p className="text-white text-sm">{order.customerPhone}</p>
                        </div>
                      </div>
                    )}
                    {order.customerAddress && (
                      <div className="flex items-start gap-3">
                        <MapPin className="w-5 h-5 text-white/60 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-white/60 text-xs mb-1">Адрес</p>
                          <p className="text-white text-sm">{order.customerAddress}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Items */}
                  <div className="rounded-[20px] bg-black/30 backdrop-blur-xl border border-white/10 p-4">
                    <h4 className="text-white font-semibold text-base mb-4">Товары</h4>
                    <div className="space-y-3">
                      {order.items.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-start justify-between pt-3 border-t border-white/10 first:border-t-0 first:pt-0"
                        >
                          <div className="flex-1 min-w-0 pr-4">
                            <p className="text-white font-medium text-sm mb-1">{item.titleSnapshot}</p>
                            <p className="text-white/60 text-xs">
                              {item.qty} × {formatPrice(item.priceSnapshot, order.currency)}
                            </p>
                          </div>
                          <p className="text-white font-semibold text-sm whitespace-nowrap">
                            {formatPrice(item.priceSnapshot * item.qty, order.currency)}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Total */}
                  <div className="rounded-[20px] bg-black/30 backdrop-blur-xl border border-white/10 p-4">
                    <div className="flex items-center justify-between">
                      <p className="text-white font-semibold text-base">Итого</p>
                      <p className="text-white font-bold text-lg">
                        {formatPrice(order.totalAmount, order.currency)}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Overlay>
  );
}

