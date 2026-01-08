'use client';

import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';

import { BannersCarousel } from '@/components/BannersCarousel';
import { HEADER_HEIGHT_PX } from '@/components/Header';
import { LabPromoCard } from '@/components/LabPromoCard';
import { useLockBodyScroll } from '@/hooks/useLockBodyScroll';

// Use local background image instead of external URL for better performance and reliability
const BG_IMAGE_URL = '/home-bg.jpg';

export default function Home(): JSX.Element {
  const router = useRouter();
  
  // Lock body scroll on home page
  useLockBodyScroll(true);

  // Calculate header height with safe area
  const headerTotalHeight = `calc(${HEADER_HEIGHT_PX}px + env(safe-area-inset-top, 0px))`;

  return (
    <div className="fixed inset-0 overflow-hidden">
      {/* Fixed Background Layers */}
      <div className="fixed inset-0 z-0">
        {/* Background Image */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url(${BG_IMAGE_URL})`,
            backgroundAttachment: 'fixed',
          }}
        />
        
        {/* Dark Overlay Gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/50 to-black/70" />
        
        {/* Blur Layer */}
        <div 
          className="absolute inset-0 backdrop-blur-[12px]"
          style={{
            WebkitBackdropFilter: 'blur(12px)',
          }}
        />
        
        {/* Subtle Grain Texture */}
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
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        <div className="min-h-full flex flex-col items-center justify-start pb-16">
          {/* Banners Carousel - First element below header */}
          <div className="w-full" style={{ paddingTop: 'clamp(16px, 4vw, 24px)', paddingBottom: 'clamp(24px, 5vw, 32px)' }}>
            <BannersCarousel />
          </div>

          {/* Minimal CTA below hero/banner */}
          <div className="w-full flex items-center justify-center px-4" style={{ paddingBottom: 'clamp(24px, 6vw, 36px)' }}>
            <motion.button
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.45,
                ease: [0.22, 1, 0.36, 1],
                delay: 0.12,
              }}
              whileTap={{ scale: 0.97 }}
              onClick={() => {
                try {
                  window.Telegram?.WebApp?.HapticFeedback?.impactOccurred?.('light');
                } catch { /* noop */ }
                router.push('/catalog');
              }}
              className="pointer-events-auto select-none rounded-full px-[clamp(18px,5.5vw,24px)] py-[clamp(10px,3.2vw,12px)] 
                         bg-white/12 hover:bg-white/16 text-white font-medium tracking-tight
                         backdrop-blur-xl shadow-[0_8px_24px_rgba(0,0,0,0.25)] 
                         transition-colors duration-200"
              aria-label="Перейти в каталог"
            >
              Перейти в каталог →
            </motion.button>
          </div>

          {/* LAB Promo Card */}
          <LabPromoCard />

          {/* Bottom Spacing */}
          <div className="h-16" />
        </div>
      </div>
    </div>
  );
}
