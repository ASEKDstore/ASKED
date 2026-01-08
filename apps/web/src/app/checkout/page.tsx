'use client';

import { useMutation } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { AlertCircle, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { HEADER_HEIGHT_PX } from '@/components/Header';
import { useTelegram } from '@/hooks/useTelegram';
import { api } from '@/lib/api';
import { useCartStore } from '@/lib/cart-store';
import { formatPrice } from '@/lib/utils';

// Use same background image as Home page
const BG_IMAGE_URL = '/home-bg.jpg';

export default function CheckoutPage(): JSX.Element {
  const router = useRouter();
  const { initData, isTelegram, webApp } = useTelegram();
  const items = useCartStore((state) => state.items);
  const clearCart = useCartStore((state) => state.clearCart);
  const total = useCartStore((state) => state.getTotal());
  const itemCount = useCartStore((state) => state.getItemCount());

  // Prefill from Telegram user if available
  const telegramUser = webApp?.initDataUnsafe?.user;
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [comment, setComment] = useState('');

  useEffect(() => {
    if (telegramUser) {
      const fullName = telegramUser.first_name + (telegramUser.last_name ? ` ${telegramUser.last_name}` : '');
      setCustomerName(fullName);
    }
  }, [telegramUser]);

  const createOrderMutation = useMutation({
    mutationFn: (data: {
      customerName: string;
      customerPhone: string;
      customerAddress?: string;
      comment?: string;
    }) =>
      api.createOrder(initData, {
        ...data,
        items: items.map((item) => ({
          productId: item.productId,
          qty: item.qty,
        })),
      }),
    onSuccess: (order) => {
      clearCart();
      router.push(`/checkout/success?id=${order.id}`);
    },
  });

  const handleHaptic = () => {
    try {
      window.Telegram?.WebApp?.HapticFeedback?.impactOccurred?.('light');
    } catch {
      // Ignore if not in Telegram
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim() || !customerPhone.trim()) {
      return;
    }
    handleHaptic();
    createOrderMutation.mutate({
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      customerAddress: customerAddress.trim() || undefined,
      comment: comment.trim() || undefined,
    });
  };

  // Calculate header height with safe area
  const headerTotalHeight = `calc(${HEADER_HEIGHT_PX}px + env(safe-area-inset-top, 0px))`;

  if (!isTelegram) {
    return (
      <div className="fixed inset-0 overflow-hidden bg-black">
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
                Для оформления заказа необходимо открыть приложение через Telegram WebApp.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
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
              <p className="text-white/60 mb-4">Корзина пуста</p>
              <Link href="/catalog">
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  className="rounded-full px-6 py-3 bg-white/12 hover:bg-white/16 text-white font-medium backdrop-blur-xl border border-white/10 transition-colors"
                >
                  Перейти в каталог
                </motion.button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

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

      {/* Scrollable Content Container */}
      <div
        className="relative z-10 h-full overflow-y-auto overflow-x-hidden overscroll-none"
        style={{
          paddingTop: headerTotalHeight,
          paddingBottom: 'calc(100px + env(safe-area-inset-bottom, 0px))',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="min-h-full flex flex-col items-start pb-16 px-4"
        >
          {/* Header */}
          <div className="w-full mb-6 pt-6">
            <h1 className="text-[clamp(28px,7vw,36px)] font-bold text-white">Оформление заказа</h1>
          </div>

          {/* Order Summary Mini-Card */}
          <div className="w-full mb-6">
            <div className="rounded-[20px] bg-black/30 backdrop-blur-xl border border-white/10 p-4">
              <p className="text-white/60 text-xs mb-2 uppercase tracking-wider">Ваш заказ</p>
              <div className="flex justify-between items-baseline">
                <span className="text-white/80 text-sm">{itemCount} шт.</span>
                <span className="text-white font-semibold text-lg">{formatPrice(total)}</span>
              </div>
            </div>
          </div>

          {/* Form */}
          <form id="checkout-form" onSubmit={handleSubmit} className="w-full space-y-4">
            {/* Контакты */}
            <div className="rounded-[20px] bg-black/30 backdrop-blur-xl border border-white/10 p-4 space-y-4">
              <p className="text-white/60 text-xs mb-2 uppercase tracking-wider">Контакты</p>
              <div>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-[12px] text-white placeholder-white/40 focus:outline-none focus:border-white/20 focus:bg-white/10 transition-colors text-sm"
                  placeholder="Имя"
                />
              </div>
              <div>
                <input
                  type="tel"
                  required
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-[12px] text-white placeholder-white/40 focus:outline-none focus:border-white/20 focus:bg-white/10 transition-colors text-sm"
                  placeholder="Телефон"
                />
              </div>
            </div>

            {/* Доставка */}
            <div className="rounded-[20px] bg-black/30 backdrop-blur-xl border border-white/10 p-4">
              <p className="text-white/60 text-xs mb-4 uppercase tracking-wider">Доставка</p>
              <input
                type="text"
                value={customerAddress}
                onChange={(e) => setCustomerAddress(e.target.value)}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-[12px] text-white placeholder-white/40 focus:outline-none focus:border-white/20 focus:bg-white/10 transition-colors text-sm"
                placeholder="Адрес доставки (необязательно)"
              />
            </div>

            {/* Комментарий */}
            <div className="rounded-[20px] bg-black/30 backdrop-blur-xl border border-white/10 p-4">
              <p className="text-white/60 text-xs mb-4 uppercase tracking-wider">Комментарий</p>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={3}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-[12px] text-white placeholder-white/40 focus:outline-none focus:border-white/20 focus:bg-white/10 transition-colors text-sm resize-none"
                placeholder="Дополнительная информация (необязательно)"
              />
            </div>

            {/* Payment Info */}
            <div className="rounded-[20px] bg-white/5 backdrop-blur-xl border border-white/10 p-4">
              <p className="text-white/70 text-sm leading-relaxed">
                <strong className="text-white">Оплата через менеджера</strong> — после оформления заказа наш менеджер свяжется с вами для подтверждения и оплаты.
              </p>
            </div>

            {/* Error Message */}
            {createOrderMutation.isError && (
              <div className="rounded-[20px] bg-red-500/10 backdrop-blur-xl border border-red-500/20 p-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-red-300">
                  <p className="font-semibold mb-1">Ошибка оформления заказа</p>
                  <p className="text-red-300/80">
                    {createOrderMutation.error instanceof Error
                      ? createOrderMutation.error.message
                      : 'Попробуйте позже'}
                  </p>
                </div>
              </div>
            )}
          </form>
        </motion.div>
      </div>

      {/* Sticky CTA Bar */}
      <div
        className="fixed bottom-0 left-0 right-0 z-20 bg-black/60 backdrop-blur-2xl border-t border-white/10"
        style={{
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        }}
      >
        <div className="px-4 py-4">
          <motion.button
            type="submit"
            form="checkout-form"
            whileTap={{ scale: 0.97 }}
            onClick={handleHaptic}
            disabled={createOrderMutation.isPending || !customerName.trim() || !customerPhone.trim()}
            className="w-full rounded-full px-6 py-4 bg-white text-black font-semibold text-base transition-opacity disabled:opacity-30 disabled:cursor-not-allowed hover:opacity-90"
          >
            {createOrderMutation.isPending ? 'Оформление...' : 'Подтвердить заказ'}
            <ArrowRight className="w-4 h-4 inline-block ml-2" />
          </motion.button>
        </div>
      </div>
    </div>
  );
}
