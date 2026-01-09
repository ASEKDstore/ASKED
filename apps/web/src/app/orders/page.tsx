'use client';

import { AlertCircle } from 'lucide-react';

import { HEADER_HEIGHT_PX } from '@/components/Header';
import { MyOrdersList } from '@/components/orders/MyOrdersList';
import { useTelegram } from '@/hooks/useTelegram';

// Use same background image as Home page
const BG_IMAGE_URL = '/home-bg.jpg';

export default function OrdersPage(): JSX.Element {
  const { isTelegram } = useTelegram();

  // Calculate header height with safe area
  const headerTotalHeight = `calc(${HEADER_HEIGHT_PX}px + env(safe-area-inset-top, 0px))`;

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
                Для просмотра заказов необходимо открыть приложение через Telegram WebApp.
              </p>
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

          {/* Orders List */}
          <MyOrdersList />
        </div>
      </div>
    </div>
  );
}




