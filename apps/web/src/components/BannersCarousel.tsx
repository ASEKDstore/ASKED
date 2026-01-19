'use client';

import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useState, useRef, useEffect } from 'react';

import { api, type Banner } from '@/lib/api';
import { normalizeImageUrl } from '@/lib/image-utils';

interface BannersCarouselProps {
  className?: string;
}

/**
 * Premium Apple-style hero carousel for banners
 * Features:
 * - Scroll-snap carousel with swipe gestures
 * - Page indicators (dots) like iOS
 * - Support for images and videos
 * - Tap animations with haptic feedback
 * - Responsive design with clamp()
 */
export function BannersCarousel({ className = '' }: BannersCarouselProps): JSX.Element | null {
  const router = useRouter();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const { data: banners, isLoading } = useQuery({
    queryKey: ['banners'],
    queryFn: () => api.getBanners(),
  });

  // Filter active banners and sort by sortOrder
  const activeBanners = (banners || [])
    .filter((b) => b.isActive)
    .sort((a, b) => a.sort - b.sort);

  // Update current index based on scroll position
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container || activeBanners.length === 0) return;

    const updateIndex = () => {
      const scrollLeft = container.scrollLeft;
      const itemWidth = container.offsetWidth;
      const newIndex = Math.round(scrollLeft / itemWidth);
      setCurrentIndex(Math.min(newIndex, activeBanners.length - 1));
    };

    container.addEventListener('scroll', updateIndex);
    updateIndex();

    return () => {
      container.removeEventListener('scroll', updateIndex);
    };
  }, [activeBanners.length]);

  // Auto-scroll to index (for dots navigation)
  const scrollToIndex = (index: number) => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const itemWidth = container.offsetWidth;
    container.scrollTo({
      left: index * itemWidth,
      behavior: 'smooth',
    });
  };

  const handleBannerClick = (banner: Banner) => {
    // Haptic feedback (Telegram WebApp)
    if (typeof window !== 'undefined') {
      const tg = window.Telegram?.WebApp;
      if (tg?.HapticFeedback?.impactOccurred) {
        tg.HapticFeedback.impactOccurred('light');
      }
    }

    router.push(`/promo/${banner.promoSlug}`);
  };

  // Don't render if no banners
  if (!isLoading && activeBanners.length === 0) {
    return null;
  }

  return (
    <div className={`w-full ${className}`}>
      {/* Loading Skeleton */}
      {isLoading && (
        <div className="relative w-full rounded-[28px] overflow-hidden bg-black/20 backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.3)]" style={{ height: 'clamp(200px, 56.25vw, 400px)' }}>
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-white/0 animate-pulse" />
        </div>
      )}

      {/* Carousel */}
      {!isLoading && activeBanners.length > 0 && (
        <div className="relative">
          {/* Scroll Container */}
          <div
            ref={scrollContainerRef}
            className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide"
            style={{
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
              WebkitOverflowScrolling: 'touch',
              scrollSnapType: 'x mandatory',
            }}
            onTouchStart={() => setIsDragging(true)}
            onTouchEnd={() => setIsDragging(false)}
            onMouseDown={() => setIsDragging(true)}
            onMouseUp={() => setIsDragging(false)}
            onMouseLeave={() => setIsDragging(false)}
          >
            {activeBanners.map((banner, index) => (
              <BannerSlide
                key={banner.id}
                banner={banner}
                index={index}
                onClick={() => handleBannerClick(banner)}
                isDragging={isDragging}
              />
            ))}
          </div>

          {/* Page Indicators (Dots) */}
          {activeBanners.length > 1 && (
            <div className="flex justify-center items-center gap-2 mt-4 px-4">
              {activeBanners.map((_, index) => (
                <button
                  key={index}
                  onClick={() => scrollToIndex(index)}
                  className="relative w-8 h-2 rounded-full overflow-hidden transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-white/30 focus:ring-offset-2 focus:ring-offset-transparent"
                  aria-label={`Go to banner ${index + 1}`}
                >
                  {/* Inactive dot */}
                  <div className="absolute inset-0 bg-white/20 rounded-full" />
                  {/* Active dot */}
                  <motion.div
                    className="absolute inset-0 bg-white rounded-full"
                    initial={false}
                    animate={{
                      scaleX: currentIndex === index ? 1 : 0,
                      opacity: currentIndex === index ? 1 : 0,
                    }}
                    transition={{
                      type: 'spring',
                      stiffness: 400,
                      damping: 35,
                    }}
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

interface BannerSlideProps {
  banner: Banner;
  index: number;
  onClick: () => void;
  isDragging: boolean;
}

function BannerSlide({ banner, index, onClick, isDragging }: BannerSlideProps): JSX.Element {
  const normalizedMediaUrl = normalizeImageUrl(banner.mediaUrl);

  const handleTap = () => {
    if (isDragging) return;
    onClick();
  };

  return (
    <motion.div
      className="relative flex-shrink-0 w-full rounded-[28px] overflow-hidden cursor-pointer group snap-center"
      style={{
        height: 'clamp(200px, 56.25vw, 400px)',
        minHeight: 'clamp(200px, 56.25vw, 400px)',
        scrollSnapAlign: 'center',
        scrollSnapStop: 'always',
      }}
      onClick={handleTap}
      whileTap={{ scale: isDragging ? 1 : 0.99 }}
      transition={{
        type: 'spring',
        stiffness: 400,
        damping: 30,
      }}
    >
      {/* Glass Container */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-2xl shadow-[0_8px_32px_rgba(0,0,0,0.4)] rounded-[28px] border border-white/5" />

      {/* Media Layer */}
      <div className="absolute inset-0 rounded-[28px] overflow-hidden">
        {banner.mediaType === 'IMAGE' && normalizedMediaUrl ? (
          <Image
            src={normalizedMediaUrl}
            alt={banner.title}
            fill
            className="object-cover transition-transform duration-700 group-hover:scale-105"
            sizes="100vw"
            priority={index === 0}
            unoptimized
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
              const parent = target.parentElement;
              if (parent && !parent.querySelector('.media-fallback')) {
                const fallback = document.createElement('div');
                fallback.className = 'media-fallback absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-800/50 to-gray-900/50 text-white/40';
                fallback.textContent = 'No image';
                parent.appendChild(fallback);
              }
            }}
          />
        ) : normalizedMediaUrl ? (
          <video
            src={normalizedMediaUrl}
            className="w-full h-full object-cover"
            muted
            loop
            playsInline
            autoPlay
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-gray-800/50 to-gray-900/50 flex items-center justify-center text-white/40">
            No media
          </div>
        )}

        {/* Gradient Overlay for Text Readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

        {/* Subtle Edge Highlight */}
        <div className="absolute inset-0 rounded-[28px] ring-1 ring-white/10 pointer-events-none" />
      </div>

      {/* Content */}
      <div className="relative h-full flex flex-col justify-between p-6 z-10">
        {/* Top spacing */}
        <div className="flex-1" />

        {/* Text Content */}
        <div className="space-y-3">
          <div>
            <h3
              className="text-white font-bold mb-1 drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]"
              style={{ fontSize: 'clamp(20px, 5vw, 28px)' }}
            >
              {banner.title}
            </h3>
            {banner.subtitle && (
              <p
                className="text-white/90 drop-shadow-[0_2px_6px_rgba(0,0,0,0.7)]"
                style={{ fontSize: 'clamp(14px, 3.5vw, 18px)' }}
              >
                {banner.subtitle}
              </p>
            )}
          </div>

          {/* CTA Button (Pill) */}
          <motion.button
            onClick={(e) => {
              e.stopPropagation();
              handleTap();
            }}
            className="flex items-center justify-center gap-2 px-5 py-3 rounded-full bg-white/95 backdrop-blur-md text-gray-900 hover:bg-white shadow-lg border border-white/50 font-medium transition-all group/btn"
            style={{ fontSize: 'clamp(14px, 3.5vw, 16px)' }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <span>Подробнее</span>
            <ArrowRight className="w-4 h-4 transition-transform group-hover/btn:translate-x-0.5" />
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}

