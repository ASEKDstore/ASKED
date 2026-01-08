'use client';

import { ShoppingBag, Sparkles, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { BannersCarousel } from '@/components/BannersCarousel';
import { HEADER_HEIGHT_PX } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { useLockBodyScroll } from '@/hooks/useLockBodyScroll';
import { useCartStore } from '@/lib/cart-store';

// Use local background image instead of external URL for better performance and reliability
const BG_IMAGE_URL = '/home-bg.jpg';

export default function Home(): JSX.Element {
  const router = useRouter();
  const itemCount = useCartStore((state) => state.getItemCount());
  
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

          {/* Hero Section */}
          <div className="w-full max-w-2xl text-center space-y-8 px-4 py-12">
            <div className="space-y-4">
              <h1 className="text-5xl md:text-6xl font-bold text-white drop-shadow-lg tracking-tight">
                Добро пожаловать
              </h1>
              <p className="text-xl md:text-2xl text-white/90 drop-shadow-md max-w-xl mx-auto">
                Откройте для себя уникальные товары в ASKED Store
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
              <Button
                onClick={() => router.push('/catalog')}
                size="lg"
                className="bg-white/20 hover:bg-white/30 text-white border-white/30 backdrop-blur-md shadow-lg active:scale-[0.98] transition-all px-8 py-6 text-lg font-semibold"
              >
                <ShoppingBag className="w-5 h-5 mr-2" />
                Перейти в каталог
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
              
              {itemCount > 0 && (
                <Button
                  onClick={() => router.push('/cart')}
                  variant="outline"
                  size="lg"
                  className="bg-black/20 hover:bg-black/30 text-white border-white/30 backdrop-blur-md shadow-lg active:scale-[0.98] transition-all px-8 py-6 text-lg font-semibold"
                >
                  <ShoppingBag className="w-5 h-5 mr-2" />
                  Корзина ({itemCount})
                </Button>
              )}
            </div>
          </div>

          {/* Feature Cards */}
          <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-6 mt-12">
            <Link
              href="/catalog"
              className="group relative p-6 rounded-2xl bg-white/10 hover:bg-white/15 backdrop-blur-md border border-white/20 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
            >
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-xl bg-white/10 group-hover:bg-white/15 transition-colors">
                  <ShoppingBag className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-white mb-2 group-hover:text-white/90 transition-colors">
                    Каталог
                  </h3>
                  <p className="text-white/70 text-sm leading-relaxed">
                    Просмотрите наш широкий ассортимент товаров
                  </p>
                </div>
              </div>
            </Link>

            <Link
              href="/lab"
              className="group relative p-6 rounded-2xl bg-white/10 hover:bg-white/15 backdrop-blur-md border border-white/20 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
            >
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-xl bg-white/10 group-hover:bg-white/15 transition-colors">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-white mb-2 group-hover:text-white/90 transition-colors">
                    Lab Mod
                  </h3>
                  <p className="text-white/70 text-sm leading-relaxed">
                    Экспериментальные продукты и функции
                  </p>
                </div>
              </div>
            </Link>
          </div>

          {/* Bottom Spacing */}
          <div className="h-16" />
        </div>
      </div>
    </div>
  );
}
