'use client';

import { Heart, ArrowRight, X } from 'lucide-react';
import { useState } from 'react';

import type { Product } from '@/lib/api';
import { useCartStore } from '@/lib/cart-store';
import { getMainImageUrl, normalizeImageUrl } from '@/lib/image-utils';
import { formatPrice } from '@/lib/utils';

import { Button } from '../ui/button';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
} from '../ui/drawer';

interface ProductCardRefProps {
  product: Product;
  showBackButton?: boolean;
}

// Default sizes for fashion items
const DEFAULT_SIZES = ['S', 'M', 'L', 'XL', 'XXL'];

export function ProductCardRef({ product, showBackButton = false }: ProductCardRefProps): JSX.Element {
  const [selectedSize, setSelectedSize] = useState<string>(DEFAULT_SIZES[1] || 'M'); // Default to 'M'
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const addItem = useCartStore((state) => state.addItem);

  const mainImage = getMainImageUrl(product.images);
  const normalizedImage = normalizeImageUrl(mainImage);

  const handleAddToCart = () => {
    addItem({
      productId: product.id,
      title: product.title,
      price: product.price,
      image: mainImage || undefined,
    });
  };

  const handleDetailsClick = () => {
    setIsDrawerOpen(true);
  };

  return (
    <>
      <div className="relative w-full h-[580px] rounded-2xl overflow-hidden shadow-lg group">
        {/* Background Image */}
        <div className="absolute inset-0">
          {normalizedImage ? (
            <img
              src={normalizedImage}
              alt={product.title}
              className="w-full h-full object-cover"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                const parent = target.parentElement;
                if (parent && !parent.querySelector('.image-fallback')) {
                  const fallback = document.createElement('div');
                  fallback.className = 'image-fallback w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-200 to-gray-300 text-gray-500';
                  fallback.textContent = 'No image';
                  parent.appendChild(fallback);
                }
              }}
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center text-gray-500">
              No image
            </div>
          )}
          {/* Gradient overlay for text readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        </div>

        {/* Top Actions */}
        <div className="absolute top-4 left-4 right-4 z-10 flex items-center justify-between">
          {showBackButton && (
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-full bg-white/20 backdrop-blur-md border border-white/30 hover:bg-white/30"
            >
              <ArrowRight className="h-4 w-4 rotate-180 text-white" />
            </Button>
          )}
          <div className="ml-auto">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsLiked(!isLiked)}
              className={`h-9 w-9 rounded-full backdrop-blur-md border ${
                isLiked
                  ? 'bg-red-500/80 border-red-400/50 hover:bg-red-500/90'
                  : 'bg-white/20 border-white/30 hover:bg-white/30'
              }`}
            >
              <Heart className={`h-4 w-4 ${isLiked ? 'fill-white text-white' : 'text-white'}`} />
            </Button>
          </div>
        </div>

        {/* Content Overlay */}
        <div className="absolute inset-0 flex flex-col justify-between p-6 z-10">
          {/* Middle Section: Sizes and Title */}
          <div className="flex-1 flex flex-col justify-center items-center gap-4 mt-auto">
            {/* Size Chips */}
            <div className="flex gap-2 flex-wrap justify-center">
              {DEFAULT_SIZES.map((size) => (
                <button
                  key={size}
                  onClick={() => setSelectedSize(size)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all backdrop-blur-md border ${
                    selectedSize === size
                      ? 'bg-white/90 text-gray-900 border-white shadow-lg scale-105'
                      : 'bg-white/20 text-white border-white/30 hover:bg-white/30'
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>

            {/* Title */}
            <h3 className="text-3xl font-bold text-white text-center drop-shadow-lg px-4">
              {product.title}
            </h3>

            {/* Details Button */}
            <Button
              onClick={handleDetailsClick}
              className="w-full max-w-xs rounded-full bg-white/90 backdrop-blur-md text-gray-900 hover:bg-white border border-white/50 shadow-lg font-medium"
            >
              Подробнее
            </Button>
          </div>

          {/* Bottom Panel: Price, Buy, CTA */}
          <div className="mt-auto">
            <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-4 border border-white/20 shadow-xl">
              <div className="flex items-center justify-between gap-4">
                {/* Price */}
                <div className="flex-1">
                  <p className="text-white/80 text-xs mb-1">Цена</p>
                  <p className="text-2xl font-bold text-white">{formatPrice(product.price)}</p>
                </div>

                {/* Buy Button */}
                <Button
                  onClick={handleAddToCart}
                  disabled={product.stock === 0}
                  className="flex-1 rounded-full bg-white/90 backdrop-blur-md text-gray-900 hover:bg-white border border-white/50 shadow-lg font-medium disabled:opacity-50"
                >
                  {product.stock === 0 ? 'Нет в наличии' : 'Купить'}
                </Button>

                {/* CTA Arrow */}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleAddToCart}
                  disabled={product.stock === 0}
                  className="h-12 w-12 rounded-full bg-white/20 backdrop-blur-md border border-white/30 hover:bg-white/30 text-white disabled:opacity-50"
                >
                  <ArrowRight className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Details Drawer */}
      <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
        <DrawerContent className="rounded-t-3xl md:rounded-none">
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 bg-white border-b">
              <div className="flex-1">
                <DrawerTitle className="text-xl font-bold">{product.title}</DrawerTitle>
                <p className="text-lg font-semibold text-primary mt-1">{formatPrice(product.price)}</p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsDrawerOpen(false)}
                className="rounded-full"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
              {/* Main Image */}
              {normalizedImage && (
                <div className="w-full h-80 rounded-2xl overflow-hidden bg-gray-100">
                  <img
                    src={normalizedImage}
                    alt={product.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              {/* Description */}
              {product.description && (
                <div>
                  <h4 className="text-lg font-semibold mb-2">Описание</h4>
                  <DrawerDescription className="text-base">{product.description}</DrawerDescription>
                </div>
              )}

              {/* Color (Placeholder) */}
              <div>
                <h4 className="text-lg font-semibold mb-2">Цвет</h4>
                <p className="text-gray-600">—</p>
              </div>

              {/* Sizes */}
              <div>
                <h4 className="text-lg font-semibold mb-3">Размер</h4>
                <div className="flex gap-2 flex-wrap">
                  {DEFAULT_SIZES.map((size) => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all border ${
                        selectedSize === size
                          ? 'bg-gray-900 text-white border-gray-900'
                          : 'bg-white text-gray-900 border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
                <p className="text-sm text-gray-500 mt-2">Выберите размер</p>
              </div>

              {/* Image Gallery (if multiple images) */}
              {product.images && product.images.length > 1 && (
                <div>
                  <h4 className="text-lg font-semibold mb-3">Фото</h4>
                  <div className="grid grid-cols-3 gap-3">
                    {product.images.slice(0, 6).map((img, idx) => {
                      const normalizedImg = normalizeImageUrl(img.url);
                      return normalizedImg ? (
                        <div key={img.id || idx} className="aspect-square rounded-lg overflow-hidden bg-gray-100">
                          <img
                            src={normalizedImg}
                            alt={`${product.title} ${idx + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : null;
                    })}
                  </div>
                </div>
              )}

              {/* Additional Info */}
              <div>
                <h4 className="text-lg font-semibold mb-2">Дополнительная информация</h4>
                <div className="space-y-2 text-sm text-gray-600">
                  <p>Статус: {product.status === 'ACTIVE' ? 'В наличии' : 'Недоступен'}</p>
                  {product.stock !== undefined && <p>Остаток: {product.stock} шт.</p>}
                  {product.categories.length > 0 && (
                    <p>
                      Категории:{' '}
                      {product.categories.map((c) => c.name).join(', ')}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Footer */}
            <DrawerFooter className="sticky bottom-0 bg-white border-t px-6 py-4">
              <div className="flex items-center justify-between gap-4 w-full">
                <div>
                  <p className="text-xs text-gray-500">Цена</p>
                  <p className="text-2xl font-bold">{formatPrice(product.price)}</p>
                </div>
                <Button
                  onClick={() => {
                    handleAddToCart();
                    setIsDrawerOpen(false);
                  }}
                  disabled={product.stock === 0}
                  className="flex-1 max-w-xs rounded-full bg-gray-900 text-white hover:bg-gray-800 font-medium disabled:opacity-50"
                >
                  {product.stock === 0 ? 'Нет в наличии' : 'Добавить в корзину'}
                </Button>
              </div>
            </DrawerFooter>
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
}

