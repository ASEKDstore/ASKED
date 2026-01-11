'use client';

import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

import { HEADER_HEIGHT_PX } from '@/components/Header';

// Use same background image as Home page
const BG_IMAGE_URL = '/home-bg.jpg';

function CheckoutSuccessContent(): JSX.Element {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('id');

  // Calculate header height with safe area
  const headerTotalHeight = `calc(${HEADER_HEIGHT_PX}px + env(safe-area-inset-top, 0px))`;

  const handleHaptic = () => {
    try {
      window.Telegram?.WebApp?.HapticFeedback?.impactOccurred?.('light');
    } catch {
      // Ignore if not in Telegram
    }
  };

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

      {/* Content */}
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
              {/* Success Icon */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: 'spring', stiffness: 200, damping: 15 }}
                className="w-20 h-20 mx-auto mb-6 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center"
              >
                <Check className="w-10 h-10 text-white" />
              </motion.div>

              {/* Title */}
              <h1 className="text-[28px] font-bold text-white mb-2">Заказ принят</h1>

              {/* Order ID */}
              {orderId && (
                <p className="text-white/60 text-sm mb-4 font-mono">
                  № {orderId}
                </p>
              )}

              {/* Message */}
              <p className="text-white/70 text-[15px] mb-8 leading-relaxed">
                Мы свяжемся с вами в Telegram для подтверждения и оплаты.
              </p>

              {/* CTA Buttons */}
              <div className="space-y-3">
                <motion.div whileTap={{ scale: 0.97 }}>
                  <Link href="/orders">
                    <button
                      onClick={handleHaptic}
                      className="w-full rounded-full px-6 py-4 bg-white text-black font-semibold text-base transition-opacity hover:opacity-90"
                    >
                      Перейти в мои заказы
                    </button>
                  </Link>
                </motion.div>
                <motion.div whileTap={{ scale: 0.97 }}>
                  <Link href="/catalog">
                    <button
                      onClick={handleHaptic}
                      className="w-full rounded-full px-6 py-3 bg-white/12 hover:bg-white/16 text-white font-medium backdrop-blur-xl border border-white/10 transition-colors"
                    >
                      Вернуться в каталог
                    </button>
                  </Link>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutSuccessPage(): JSX.Element {
  return (
    <Suspense
      fallback={
        <div className="fixed inset-0 overflow-hidden bg-black">
          <div className="flex items-center justify-center h-full">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-white/30"></div>
          </div>
        </div>
      }
    >
      <CheckoutSuccessContent />
    </Suspense>
  );
}
