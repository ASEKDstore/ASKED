'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import { useState } from 'react';

import type { Product } from '@/lib/api';
import { getMainImageUrl, normalizeImageUrl } from '@/lib/image-utils';
import { formatPrice } from '@/lib/utils';

interface ProductCardProps {
  product: Product;
  onTap: (product: Product) => void;
  priority?: boolean;
}

export function ProductCard({ product, onTap, priority = false }: ProductCardProps): JSX.Element {
  const [imageError, setImageError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const mainImage = getMainImageUrl(product.images);
  const normalizedImage = normalizeImageUrl(mainImage);

  const handleTap = () => {
    // Haptic feedback for Telegram WebView
    try {
      window.Telegram?.WebApp?.HapticFeedback?.impactOccurred?.('light');
    } catch {
      // Ignore if not in Telegram
    }
    onTap(product);
  };

  // Determine badge/tag
  const badge = product.tags?.find((tag) => ['NEW', 'LAB', 'DROP'].includes(tag.name.toUpperCase()))
    || product.categories?.find((cat) => cat.slug === 'lab');

  return (
    <motion.div
      className="relative w-full aspect-[4/5] rounded-[24px] overflow-hidden cursor-pointer group"
      onClick={handleTap}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.15, ease: 'easeOut' }}
    >
      {/* Background Image */}
      <div className="absolute inset-0">
        {normalizedImage && !imageError ? (
          <>
            {isLoading && (
              <div className="absolute inset-0 bg-gradient-to-br from-gray-800/30 to-gray-900/30 animate-pulse" />
            )}
            <Image
              src={normalizedImage}
              alt={product.title}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              sizes="(max-width: 768px) 50vw, 33vw"
              priority={priority}
              unoptimized
              onError={() => setImageError(true)}
              onLoad={() => setIsLoading(false)}
            />
          </>
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-gray-800/50 to-gray-900/50 flex items-center justify-center text-white/40 text-sm">
            Нет фото
          </div>
        )}
        {/* Gradient overlay for text readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent" />
      </div>

      {/* Badge overlay (top-right) */}
      {badge && (
        <div className="absolute top-3 right-3 z-10">
          <div className="px-2.5 py-1 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-white text-[10px] font-medium uppercase tracking-wider">
            {badge.name}
          </div>
        </div>
      )}

      {/* Glass Card Content (bottom overlay) */}
      <div className="absolute inset-0 flex flex-col justify-end p-3">
        <div className="bg-black/40 backdrop-blur-xl rounded-[20px] p-3 border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.3)]">
          {/* Subtle highlight line at top */}
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

          {/* Product Name */}
          <h3 className="text-white font-medium text-[14px] mb-2 line-clamp-1 leading-tight">
            {product.title}
          </h3>

          {/* Price */}
          <div className="flex items-baseline gap-1.5">
            <p className="text-white/60 text-[11px] mb-0.5">Цена</p>
            <p className="text-[17px] font-bold text-white leading-none">{formatPrice(product.price)}</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

