'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, ShoppingCart } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';

import { HEADER_HEIGHT_PX } from '@/components/Header';
import { AddReviewSheet } from '@/components/reviews/AddReviewSheet';
import { ReviewsList } from '@/components/reviews/ReviewsList';
import { StarRating } from '@/components/reviews/StarRating';
import { Button } from '@/components/ui/button';
import { useTelegram } from '@/hooks/useTelegram';
import { api } from '@/lib/api';
import { useCartStore } from '@/lib/cart-store';
import { getMainImageUrl, normalizeImageUrl } from '@/lib/image-utils';
import { formatPrice } from '@/lib/utils';

export default function ProductPage(): JSX.Element {
  const params = useParams();
  const router = useRouter();
  const productId = params.id as string;
  const addItem = useCartStore((state) => state.addItem);
  const { initData } = useTelegram();
  const queryClient = useQueryClient();
  const [isAddReviewOpen, setIsAddReviewOpen] = useState(false);

  const { data: product, isLoading, error } = useQuery({
    queryKey: ['product', productId],
    queryFn: () => api.getProduct(productId),
    enabled: !!productId,
  });

  const { data: similarProducts, isLoading: isLoadingSimilar } = useQuery({
    queryKey: ['product', productId, 'similar'],
    queryFn: () => api.getSimilarProducts(productId, 8),
    enabled: !!productId && !!product,
  });

  const { data: reviews, isLoading: isLoadingReviews } = useQuery({
    queryKey: ['reviews', productId],
    queryFn: () => api.getProductReviews(productId, { page: 1, pageSize: 20 }),
    enabled: !!productId && !!product,
  });

  const handleAddToCart = () => {
    if (!product) return;
    addItem({
      productId: product.id,
      title: product.title,
      price: product.price,
      image: getMainImageUrl(product.images) || undefined,
    });
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
          <p className="mt-4 text-gray-600">Загрузка товара...</p>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <p className="text-red-600 mb-4">Товар не найден</p>
          <Button onClick={() => router.push('/catalog')}>
            Вернуться в каталог
          </Button>
        </div>
      </div>
    );
  }

  const mainImage = getMainImageUrl(product.images);
  const otherImages = product.images
    .filter((img) => img.url !== mainImage)
    .sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0))
    .slice(0, 4);

  return (
    <div
      className="container mx-auto px-4 py-6"
      style={{ paddingTop: `calc(${HEADER_HEIGHT_PX}px + 1.5rem + env(safe-area-inset-top, 0px))` }}
    >
      <Button
        variant="ghost"
        onClick={() => router.back()}
        className="mb-6"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Назад
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Image gallery */}
        <div className="space-y-4">
          <div className="aspect-square relative bg-gray-100 rounded-lg overflow-hidden">
            {mainImage ? (
              <Image
                src={mainImage}
                alt={product.title}
                fill
                className="object-contain bg-gray-50"
                priority
                onError={(e) => {
                  // Fallback to "No image" on error
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  const parent = target.parentElement;
                  if (parent && !parent.querySelector('.image-fallback')) {
                    const fallback = document.createElement('div');
                    fallback.className = 'image-fallback w-full h-full flex items-center justify-center text-gray-400';
                    fallback.textContent = 'No image';
                    parent.appendChild(fallback);
                  }
                }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">
                No image
              </div>
            )}
          </div>
          {otherImages.length > 0 && (
            <div className="grid grid-cols-4 gap-2">
              {otherImages.map((image) => {
                const normalizedUrl = normalizeImageUrl(image.url);
                return (
                  <div
                    key={image.id}
                    className="aspect-square relative bg-gray-100 rounded overflow-hidden"
                  >
                    {normalizedUrl ? (
                      <Image
                        src={normalizedUrl}
                        alt={product.title}
                        fill
                        className="object-contain bg-gray-50"
                        onError={(e) => {
                          // Fallback to "No image" on error
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          const parent = target.parentElement;
                          if (parent && !parent.querySelector('.image-fallback')) {
                            const fallback = document.createElement('div');
                            fallback.className = 'image-fallback w-full h-full flex items-center justify-center text-gray-400 text-xs';
                            fallback.textContent = 'No image';
                            parent.appendChild(fallback);
                          }
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                        No image
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Product info */}
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold mb-4">{product.title}</h1>
            {/* Rating summary */}
            {(product.averageRating > 0 || product.reviewsCount > 0) && (
              <div className="flex items-center gap-3 mb-4">
                <StarRating rating={product.averageRating} size="md" />
                <span className="text-sm text-gray-600">
                  {product.reviewsCount > 0
                    ? `${product.reviewsCount} ${product.reviewsCount === 1 ? 'отзыв' : product.reviewsCount < 5 ? 'отзыва' : 'отзывов'}`
                    : 'Нет отзывов'}
                </span>
              </div>
            )}
            {product.description && (
              <p className="text-gray-600 mb-4">{product.description}</p>
            )}
          </div>

          {/* Categories and tags */}
          <div className="flex flex-wrap gap-2">
            {product.categories.map((category) => (
              <span
                key={category.id}
                className="px-3 py-1 bg-gray-100 rounded-full text-sm text-gray-700"
              >
                {category.name}
              </span>
            ))}
            {product.tags.map((tag) => (
              <span
                key={tag.id}
                className="px-3 py-1 bg-blue-100 rounded-full text-sm text-blue-700"
              >
                {tag.name}
              </span>
            ))}
          </div>

          {/* Price and stock */}
          <div className="border-t border-b py-6">
            <div className="text-4xl font-bold mb-2">
              {formatPrice(product.price)}
            </div>
            <div className="text-sm text-gray-600">
              {product.stock > 0
                ? `В наличии: ${product.stock} шт.`
                : 'Нет в наличии'}
            </div>
          </div>

          {/* Add to cart button */}
          <div className="space-y-4">
            <Button
              onClick={handleAddToCart}
              disabled={product.stock === 0}
              size="lg"
              className="w-full"
            >
              <ShoppingCart className="w-5 h-5 mr-2" />
              {product.stock === 0 ? 'Нет в наличии' : 'В корзину'}
            </Button>
          </div>
        </div>
      </div>

      {/* Reviews Section */}
      <div className="mt-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Отзывы</h2>
          {initData && (
            <Button
              variant="outline"
              onClick={() => setIsAddReviewOpen(true)}
            >
              Оставить отзыв
            </Button>
          )}
        </div>

        {isLoadingReviews ? (
          <div className="text-center py-8 text-gray-500">
            Загрузка отзывов...
          </div>
        ) : reviews && reviews.items.length > 0 ? (
          <ReviewsList reviews={reviews.items} />
        ) : (
          <div className="text-center py-8 text-gray-500">
            Пока нет отзывов. Станьте первым!
          </div>
        )}
      </div>

      {/* Similar Products Section */}
      {similarProducts && similarProducts.length > 0 && (
        <div className="mt-12">
          <h2 className="text-2xl font-bold mb-6">Похожие товары</h2>
          {isLoadingSimilar ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="aspect-square bg-gray-200 animate-pulse rounded-lg" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {similarProducts.map((similarProduct) => (
                <Link key={similarProduct.id} href={`/p/${similarProduct.id}`}>
                  <div className="group relative bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                    <div className="aspect-square relative bg-gray-100">
                      {getMainImageUrl(similarProduct.images) ? (
                        <Image
                          src={getMainImageUrl(similarProduct.images)!}
                          alt={similarProduct.title}
                          fill
                          className="object-contain bg-gray-50 group-hover:scale-105 transition-transform"
                          sizes="(max-width: 768px) 50vw, 25vw"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">
                          No image
                        </div>
                      )}
                      {similarProduct.stock === 0 && (
                        <div className="absolute top-2 left-2 z-10">
                          <div className="px-2 py-1 rounded-full bg-red-500/90 text-white text-[10px] font-medium">
                            Нет в наличии
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="p-3">
                      <h3 className="font-semibold text-sm mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                        {similarProduct.title}
                      </h3>
                      <div className="text-lg font-bold">{formatPrice(similarProduct.price)}</div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Add Review Sheet */}
      {product && (
        <AddReviewSheet
          productId={product.id}
          isOpen={isAddReviewOpen}
          onClose={() => setIsAddReviewOpen(false)}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['reviews', productId] });
            queryClient.invalidateQueries({ queryKey: ['product', productId] });
          }}
        />
      )}
    </div>
  );
}

