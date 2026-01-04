'use client';

import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, ShoppingCart } from 'lucide-react';
import Image from 'next/image';
import { useParams, useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import { useCartStore } from '@/lib/cart-store';
import { formatPrice } from '@/lib/utils';

export default function ProductPage(): JSX.Element {
  const params = useParams();
  const router = useRouter();
  const productId = params.id as string;
  const addItem = useCartStore((state) => state.addItem);

  const { data: product, isLoading, error } = useQuery({
    queryKey: ['product', productId],
    queryFn: () => api.getProduct(productId),
    enabled: !!productId,
  });

  const handleAddToCart = () => {
    if (!product) return;
    addItem({
      productId: product.id,
      title: product.title,
      price: product.price,
      image: product.images[0]?.url,
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

  const mainImage = product.images[0]?.url;

  return (
    <div className="container mx-auto px-4 py-6">
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
                className="object-cover"
                priority
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">
                No image
              </div>
            )}
          </div>
          {product.images.length > 1 && (
            <div className="grid grid-cols-4 gap-2">
              {product.images.slice(1, 5).map((image) => (
                <div
                  key={image.id}
                  className="aspect-square relative bg-gray-100 rounded overflow-hidden"
                >
                  <Image
                    src={image.url}
                    alt={product.title}
                    fill
                    className="object-cover"
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Product info */}
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold mb-4">{product.title}</h1>
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
    </div>
  );
}

