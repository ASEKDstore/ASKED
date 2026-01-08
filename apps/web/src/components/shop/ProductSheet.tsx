'use client';

import { AnimatePresence, motion, PanInfo } from 'framer-motion';
import { X } from 'lucide-react';
import Image from 'next/image';
import { useEffect, useState } from 'react';

import type { Product } from '@/lib/api';
import { useCartStore } from '@/lib/cart-store';
import { getMainImageUrl, normalizeImageUrl } from '@/lib/image-utils';
import { formatPrice } from '@/lib/utils';

import { Badge } from '../ui/badge';

interface ProductSheetProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
}

export function ProductSheet({ product, isOpen, onClose }: ProductSheetProps): JSX.Element {
  const [imageError, setImageError] = useState(false);
  const [dragY, setDragY] = useState(0);
  const addItem = useCartStore((state) => state.addItem);

  const mainImage = product ? getMainImageUrl(product.images) : null;
  const normalizedImage = mainImage ? normalizeImageUrl(mainImage) : null;

  // Close on ESC key and prevent body scroll
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  const handleAddToCart = () => {
    if (!product) return;

    // Haptic feedback
    try {
      window.Telegram?.WebApp?.HapticFeedback?.impactOccurred?.('medium');
    } catch {
      // Ignore if not in Telegram
    }

    addItem({
      productId: product.id,
      title: product.title,
      price: product.price,
      image: mainImage || undefined,
    });
    onClose();
  };

  const handleDragEnd = (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    // Close if dragged down more than 100px or with velocity > 500
    if (info.offset.y > 100 || info.velocity.y > 500) {
      onClose();
    }
    setDragY(0);
  };

  if (!product) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Sheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: dragY > 0 ? dragY : 0 }}
            exit={{ y: '100%' }}
            transition={{
              type: 'spring',
              damping: 30,
              stiffness: 300,
            }}
            drag="y"
            dragConstraints={{ top: 0 }}
            dragElastic={{ top: 0, bottom: 0.2 }}
            onDrag={(_, info) => setDragY(Math.max(0, info.offset.y))}
            onDragEnd={handleDragEnd}
            dragMomentum={false}
            className="fixed bottom-0 left-0 right-0 z-50 bg-black/95 backdrop-blur-2xl rounded-t-[28px] shadow-2xl max-h-[90vh] flex flex-col overflow-hidden"
            style={{
              paddingBottom: 'env(safe-area-inset-bottom, 0px)',
            }}
          >
            {/* Drag Handle */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-12 h-1 bg-white/20 rounded-full" />
            </div>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-white/10 hover:bg-white/15 backdrop-blur-md border border-white/10 flex items-center justify-center transition-colors"
              aria-label="Закрыть"
            >
              <X className="w-5 h-5 text-white" />
            </button>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto overscroll-contain">
              {/* Hero Image */}
              {normalizedImage && !imageError ? (
                <div className="relative w-full aspect-[4/5] bg-gray-900">
                  <Image
                    src={normalizedImage}
                    alt={product.title}
                    fill
                    className="object-cover"
                    sizes="100vw"
                    priority
                    unoptimized
                    onError={() => setImageError(true)}
                  />
                </div>
              ) : (
                <div className="w-full aspect-[4/5] bg-gradient-to-br from-gray-800/50 to-gray-900/50 flex items-center justify-center text-white/40">
                  Нет фото
                </div>
              )}

              {/* Content */}
              <div className="px-4 py-6 space-y-6">
                {/* Title and Price */}
                <div>
                  <h1 className="text-[24px] font-bold text-white mb-2 leading-tight">{product.title}</h1>
                  <div className="flex items-baseline gap-2">
                    <p className="text-white/60 text-sm">Цена</p>
                    <p className="text-[28px] font-bold text-white leading-none">{formatPrice(product.price)}</p>
                  </div>
                </div>

                {/* Description */}
                {product.description && (
                  <div>
                    <p className="text-white/80 text-[15px] leading-relaxed">{product.description}</p>
                  </div>
                )}

                {/* Categories */}
                {product.categories && product.categories.length > 0 && (
                  <div>
                    <p className="text-white/60 text-xs mb-2 uppercase tracking-wider">Категории</p>
                    <div className="flex gap-2 flex-wrap">
                      {product.categories.map((category) => (
                        <Badge
                          key={category.id}
                          variant="secondary"
                          className="bg-white/10 text-white/80 border-white/10"
                        >
                          {category.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Tags */}
                {product.tags && product.tags.length > 0 && (
                  <div>
                    <p className="text-white/60 text-xs mb-2 uppercase tracking-wider">Теги</p>
                    <div className="flex gap-2 flex-wrap">
                      {product.tags.map((tag) => (
                        <Badge
                          key={tag.id}
                          variant="outline"
                          className="bg-transparent text-white/60 border-white/20"
                        >
                          {tag.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Stock Status */}
                <div className="pt-2">
                  <p className="text-white/50 text-xs">
                    {product.stock === 0
                      ? 'Нет в наличии'
                      : product.stock !== undefined
                        ? `В наличии: ${product.stock} шт.`
                        : 'В наличии'}
                  </p>
                </div>
              </div>
            </div>

            {/* Sticky CTA Bar */}
            <div
              className="sticky bottom-0 px-4 pt-4 pb-6 bg-gradient-to-t from-black/95 via-black/95 to-transparent"
              style={{
                paddingBottom: `calc(1.5rem + env(safe-area-inset-bottom, 0px))`,
              }}
            >
              <motion.button
                onClick={handleAddToCart}
                disabled={product.stock === 0}
                whileTap={{ scale: 0.97 }}
                className="w-full rounded-full px-6 py-4 bg-white text-black font-semibold text-base disabled:opacity-30 disabled:cursor-not-allowed transition-opacity"
              >
                {product.stock === 0 ? 'Нет в наличии' : 'Купить'}
              </motion.button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

