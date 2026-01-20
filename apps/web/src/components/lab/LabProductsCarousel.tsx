'use client';

import { useQuery } from '@tanstack/react-query';
import { motion, useInView } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useRef, useState } from 'react';

import { api } from '@/lib/api';

export function LabProductsCarousel(): JSX.Element {
  const router = useRouter();
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-50px' });
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});

  const { data: labProducts, isLoading } = useQuery({
    queryKey: ['lab-products'],
    queryFn: () => api.getPublicLabProducts(),
    staleTime: 60 * 1000, // Cache lab products for 60s
    refetchOnWindowFocus: false,
  });

  const activeProducts = labProducts?.filter((p) => p.isActive) || [];

  if (isLoading) {
    return (
      <div className="w-full px-4 mb-12">
        <div className="flex gap-4 overflow-x-auto pb-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="flex-shrink-0 w-[280px] h-[200px] rounded-[24px] bg-black/20 backdrop-blur-xl animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  if (activeProducts.length === 0) {
    return <div />;
  }

  return (
    <motion.section
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
      transition={{
        duration: 0.6,
        ease: [0.22, 1, 0.36, 1],
        delay: 0.2,
      }}
      className="w-full px-4 mb-12"
    >
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-[clamp(22px,5.5vw,32px)] font-bold text-white mb-2 tracking-tight">
          Готовые работы
        </h2>
        <p className="text-[clamp(14px,3.5vw,16px)] text-white/70">
          Примеры кастомных изделий, созданных в LAB
        </p>
      </div>

      {/* Carousel */}
      <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide" style={{ scrollSnapType: 'x mandatory', WebkitOverflowScrolling: 'touch' }}>
        {activeProducts.map((product, index) => {
          const handleClick = () => {
            try {
              window.Telegram?.WebApp?.HapticFeedback?.impactOccurred?.('light');
            } catch { /* noop */ }

            if (product.ctaType === 'PRODUCT' && product.ctaProductId) {
              router.push(`/p/${product.ctaProductId}`);
            } else if (product.ctaType === 'URL' && product.ctaUrl) {
              window.open(product.ctaUrl, '_blank');
            }
          };

          return (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, x: 20 }}
              animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: 20 }}
              transition={{
                duration: 0.5,
                ease: [0.22, 1, 0.36, 1],
                delay: 0.3 + index * 0.1,
              }}
              whileTap={{ scale: 0.98 }}
              style={{ willChange: isInView ? 'transform, opacity' : 'auto' }}
              onClick={handleClick}
              className="flex-shrink-0 w-[280px] rounded-[24px] bg-black/30 backdrop-blur-xl 
                       border border-white/10 shadow-[0_8px_24px_rgba(0,0,0,0.3)]
                       overflow-hidden cursor-pointer transition-all duration-200
                       hover:bg-black/35"
              style={{ scrollSnapAlign: 'start' }}
            >
              {/* Image */}
              <div className="relative w-full h-[180px] bg-black/20">
                {product.coverMediaType === 'IMAGE' && !imageErrors[product.id] ? (
                  <Image
                    src={product.coverMediaUrl}
                    alt={product.title}
                    fill
                    className="object-cover"
                    sizes="280px"
                    loading="lazy"
                    onError={() => setImageErrors((prev) => ({ ...prev, [product.id]: true }))}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-white/40">
                    No image
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="p-4">
                <h3 className="text-white font-semibold text-base mb-1 line-clamp-1">
                  {product.title}
                </h3>
                {product.subtitle && (
                  <p className="text-white/70 text-sm mb-3 line-clamp-2">
                    {product.subtitle}
                  </p>
                )}
                <div className="flex items-center justify-between">
                  {product.price > 0 && (
                    <span className="text-white font-medium">
                      {product.price.toLocaleString()} {product.currency}
                    </span>
                  )}
                  <ArrowRight className="w-4 h-4 text-white/60" />
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      <style jsx>{`
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </motion.section>
  );
}

