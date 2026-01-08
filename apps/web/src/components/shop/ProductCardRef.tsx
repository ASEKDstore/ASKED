'use client';

import { X } from 'lucide-react';
import Image from 'next/image';
import { useState } from 'react';

import type { Product } from '@/lib/api';
import { useCartStore } from '@/lib/cart-store';
import { getMainImageUrl, normalizeImageUrl } from '@/lib/image-utils';
import { formatPrice } from '@/lib/utils';

import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import {
  Drawer,
  DrawerContent,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
} from '../ui/drawer';

interface ProductCardRefProps {
  product: Product;
}

export function ProductCardRef({ product }: ProductCardRefProps): JSX.Element {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [mainImageError, setMainImageError] = useState(false);
  const addItem = useCartStore((state) => state.addItem);

  const mainImage = getMainImageUrl(product.images);
  const normalizedImage = normalizeImageUrl(mainImage);

  const handleBuyClick = () => {
    setIsDrawerOpen(true);
  };

  const handleAddToCart = () => {
    addItem({
      productId: product.id,
      title: product.title,
      price: product.price,
      image: mainImage || undefined,
    });
    setIsDrawerOpen(false);
  };

  return (
    <>
      <div
        className="relative w-full aspect-[3/4] rounded-[20px] overflow-hidden cursor-pointer group"
        onClick={handleBuyClick}
      >
        {/* Background Image */}
        <div className="absolute inset-0">
          {normalizedImage && !mainImageError ? (
            <Image
              src={normalizedImage}
              alt={product.title}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              sizes="(max-width: 768px) 50vw, 33vw"
              unoptimized
              onError={() => setMainImageError(true)}
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-gray-800/50 to-gray-900/50 flex items-center justify-center text-white/40 text-sm">
              Нет фото
            </div>
          )}
          {/* Gradient overlay for text readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
        </div>

        {/* Glass Card Content */}
        <div className="absolute inset-0 flex flex-col justify-end p-4">
          <div className="bg-black/30 backdrop-blur-xl rounded-[16px] p-3 border border-white/10">
            {/* Title */}
            <h3 className="text-white font-medium text-sm mb-2 line-clamp-2">{product.title}</h3>
            
            {/* Price and Buy Button */}
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-white/60 text-xs mb-0.5">Цена</p>
                <p className="text-lg font-bold text-white">{formatPrice(product.price)}</p>
              </div>

              {/* Subtle Buy Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleBuyClick();
                }}
                disabled={product.stock === 0}
                className="px-3 py-1.5 rounded-full bg-white/15 hover:bg-white/20 text-white text-xs font-medium backdrop-blur-sm border border-white/20 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                {product.stock === 0 ? 'Нет' : 'Купить'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Product Details Drawer */}
      <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
        <DrawerContent className="rounded-t-3xl md:rounded-none">
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 bg-white border-b">
              <DrawerTitle className="text-xl font-bold">{product.title}</DrawerTitle>
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
                <div className="w-full h-80 rounded-2xl overflow-hidden bg-gray-100 relative">
                  <Image
                    src={normalizedImage}
                    alt={product.title}
                    fill
                    className="object-cover"
                    sizes="100vw"
                    unoptimized
                  />
                </div>
              )}

              {/* Image Gallery (if multiple images) */}
              {product.images && product.images.length > 1 && (
                <div>
                  <h4 className="text-lg font-semibold mb-3">Фото</h4>
                  <div className="grid grid-cols-3 gap-3">
                    {product.images.slice(0, 6).map((img, idx) => {
                      const normalizedImg = normalizeImageUrl(img.url);
                      return normalizedImg ? (
                        <div key={img.id || idx} className="aspect-square rounded-lg overflow-hidden bg-gray-100 relative">
                          <Image
                            src={normalizedImg}
                            alt={`${product.title} ${idx + 1}`}
                            fill
                            className="object-cover"
                            sizes="(max-width: 768px) 33vw, 200px"
                            unoptimized
                          />
                        </div>
                      ) : null;
                    })}
                  </div>
                </div>
              )}

              {/* Description */}
              {product.description && (
                <div>
                  <h4 className="text-lg font-semibold mb-2">Описание</h4>
                  <DrawerDescription className="text-base">{product.description}</DrawerDescription>
                </div>
              )}

              {/* Categories */}
              {product.categories && product.categories.length > 0 && (
                <div>
                  <h4 className="text-lg font-semibold mb-2">Категории</h4>
                  <div className="flex gap-2 flex-wrap">
                    {product.categories.map((category) => (
                      <Badge key={category.id} variant="secondary">
                        {category.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Tags */}
              {product.tags && product.tags.length > 0 && (
                <div>
                  <h4 className="text-lg font-semibold mb-2">Теги</h4>
                  <div className="flex gap-2 flex-wrap">
                    {product.tags.map((tag) => (
                      <Badge key={tag.id} variant="outline">
                        {tag.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Status and Stock */}
              <div>
                <h4 className="text-lg font-semibold mb-2">Информация</h4>
                <div className="space-y-1 text-sm text-gray-600">
                  <p>Статус: {product.status === 'ACTIVE' ? 'В наличии' : product.status === 'DRAFT' ? 'Черновик' : 'Архив'}</p>
                  {product.stock !== undefined && <p>Остаток: {product.stock} шт.</p>}
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
                  onClick={handleAddToCart}
                  disabled={product.stock === 0}
                  className="flex-1 max-w-xs rounded-full bg-gray-900 text-white hover:bg-gray-800 font-medium disabled:opacity-50"
                >
                  {product.stock === 0 ? 'Нет в наличии' : 'Купить'}
                </Button>
              </div>
            </DrawerFooter>
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
}

