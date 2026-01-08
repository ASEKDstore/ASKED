'use client';

import { motion } from 'framer-motion';
import { ArrowRight, Minus, Plus, ShoppingBag, Trash2 } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { HEADER_HEIGHT_PX } from '@/components/Header';
import { useCartStore } from '@/lib/cart-store';
import { formatPrice } from '@/lib/utils';

// Use same background image as Home page
const BG_IMAGE_URL = '/home-bg.jpg';

export default function CartPage(): JSX.Element {
  const router = useRouter();
  const items = useCartStore((state) => state.items);
  const updateQty = useCartStore((state) => state.updateQty);
  const removeItem = useCartStore((state) => state.removeItem);
  const clearCart = useCartStore((state) => state.clearCart);
  const total = useCartStore((state) => state.getTotal());
  const itemCount = useCartStore((state) => state.getItemCount());

  // Calculate header height with safe area
  const headerTotalHeight = `calc(${HEADER_HEIGHT_PX}px + env(safe-area-inset-top, 0px))`;

  const handleHaptic = () => {
    try {
      window.Telegram?.WebApp?.HapticFeedback?.impactOccurred?.('light');
    } catch {
      // Ignore if not in Telegram
    }
  };

  // Empty state
  if (items.length === 0) {
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

        <div
          className="relative z-10 h-full overflow-y-auto overflow-x-hidden overscroll-none"
          style={{
            paddingTop: headerTotalHeight,
            paddingBottom: 'env(safe-area-inset-bottom, 0px)',
            WebkitOverflowScrolling: 'touch',
          }}
        >
          <div className="min-h-full flex items-center justify-center px-4 py-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="w-full max-w-md"
            >
              <div className="rounded-[24px] bg-black/30 backdrop-blur-xl border border-white/10 p-8 text-center">
                <ShoppingBag className="w-16 h-16 text-white/40 mx-auto mb-4" />
                <h2 className="text-[24px] font-bold text-white mb-2">Корзина пуста</h2>
                <p className="text-white/60 text-[15px] mb-6 leading-relaxed">
                  Добавь пару вещей — мы сохраним выбор.
                </p>
                <motion.div whileTap={{ scale: 0.97 }}>
                  <Link href="/catalog">
                    <button
                      onClick={handleHaptic}
                      className="w-full rounded-full px-6 py-3 bg-white/12 hover:bg-white/16 text-white font-medium backdrop-blur-xl border border-white/10 transition-colors flex items-center justify-center gap-2"
                    >
                      Перейти в каталог
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </Link>
                </motion.div>
              </div>
            </motion.div>
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
          paddingBottom: 'calc(120px + env(safe-area-inset-bottom, 0px))',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        <div className="min-h-full flex flex-col items-start pb-16 px-4">
          {/* Header */}
          <div className="w-full mb-6 pt-6">
            <h1 className="text-[clamp(28px,7vw,36px)] font-bold text-white">Корзина</h1>
          </div>

          {/* Cart Items */}
          <div className="w-full space-y-3 mb-6">
            {items.map((item) => (
              <motion.div
                key={item.productId}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                whileTap={{ scale: 0.99 }}
                className="rounded-[20px] bg-black/30 backdrop-blur-xl border border-white/10 p-4"
              >
                <div className="flex gap-4">
                  {/* Product Image */}
                  {item.image && (
                    <div className="relative w-20 h-20 rounded-[12px] overflow-hidden flex-shrink-0 bg-gray-800/50">
                      <Image
                        src={item.image}
                        alt={item.title}
                        fill
                        className="object-cover"
                        sizes="80px"
                        unoptimized
                      />
                    </div>
                  )}

                  {/* Product Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-white font-medium text-[15px] mb-1 line-clamp-2">{item.title}</h3>
                    <p className="text-white/60 text-sm mb-3">{formatPrice(item.price)}</p>

                    {/* Quantity Control and Remove */}
                    <div className="flex items-center justify-between gap-3">
                      {/* Quantity Control Pill */}
                      <div className="flex items-center gap-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/10">
                        <button
                          onClick={() => {
                            handleHaptic();
                            updateQty(item.productId, item.qty - 1);
                          }}
                          className="w-8 h-8 flex items-center justify-center text-white/80 hover:text-white transition-colors"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="text-white font-medium text-sm min-w-[24px] text-center">{item.qty}</span>
                        <button
                          onClick={() => {
                            handleHaptic();
                            updateQty(item.productId, item.qty + 1);
                          }}
                          className="w-8 h-8 flex items-center justify-center text-white/80 hover:text-white transition-colors"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Remove Button */}
                      <button
                        onClick={() => {
                          handleHaptic();
                          removeItem(item.productId);
                        }}
                        className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-white/60 hover:text-white/80 transition-colors"
                        aria-label="Удалить"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Sticky Summary & CTA Bar */}
      <div
        className="fixed bottom-0 left-0 right-0 z-20 bg-black/60 backdrop-blur-2xl border-t border-white/10"
        style={{
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        }}
      >
        <div className="px-4 py-4">
          {/* Summary Card */}
          <div className="rounded-[20px] bg-black/30 backdrop-blur-xl border border-white/10 p-4 mb-3">
            <div className="space-y-2">
              <div className="flex justify-between text-white/70 text-sm">
                <span>Товаров</span>
                <span>{itemCount} шт.</span>
              </div>
              <div className="flex justify-between text-white font-semibold text-lg pt-2 border-t border-white/10">
                <span>Сумма</span>
                <span>{formatPrice(total)}</span>
              </div>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex gap-3">
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => {
                handleHaptic();
                router.push('/checkout');
              }}
              className="flex-1 rounded-full px-6 py-4 bg-white text-black font-semibold text-base transition-opacity hover:opacity-90"
            >
              Оформить заказ
              <ArrowRight className="w-4 h-4 inline-block ml-2" />
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => {
                handleHaptic();
                clearCart();
              }}
              className="px-4 py-4 rounded-full bg-white/10 hover:bg-white/15 text-white/80 text-sm backdrop-blur-xl border border-white/10 transition-colors"
            >
              Очистить
            </motion.button>
          </div>
        </div>
      </div>
    </div>
  );
}
