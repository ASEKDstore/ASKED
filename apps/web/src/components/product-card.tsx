'use client';

import Image from 'next/image';
import Link from 'next/link';

import type { Product } from '@/lib/api';
import { useCartStore } from '@/lib/cart-store';
import { formatPrice } from '@/lib/utils';

import { Button } from './ui/button';

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps): JSX.Element {
  const addItem = useCartStore((state) => state.addItem);
  const mainImage = product.images[0]?.url;

  const handleAddToCart = () => {
    addItem({
      productId: product.id,
      title: product.title,
      price: product.price,
      image: mainImage,
    });
  };

  return (
    <div className="group relative bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
      <Link href={`/p/${product.id}`}>
        <div className="aspect-square relative bg-gray-100">
          {mainImage ? (
            <Image
              src={mainImage}
              alt={product.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              No image
            </div>
          )}
        </div>
      </Link>

      <div className="p-4">
        <Link href={`/p/${product.id}`}>
          <h3 className="font-semibold text-lg mb-2 line-clamp-2 hover:text-primary transition-colors">
            {product.title}
          </h3>
        </Link>

        {product.description && (
          <p className="text-sm text-gray-600 mb-3 line-clamp-2">
            {product.description}
          </p>
        )}

        <div className="flex items-center gap-2 mb-3 flex-wrap">
          {product.categories.slice(0, 2).map((category) => (
            <span
              key={category.id}
              className="text-xs px-2 py-1 bg-gray-100 rounded text-gray-600"
            >
              {category.name}
            </span>
          ))}
        </div>

        <div className="flex items-center justify-between">
          <span className="text-xl font-bold">{formatPrice(product.price)}</span>
          <Button
            onClick={handleAddToCart}
            disabled={product.stock === 0}
            size="sm"
          >
            {product.stock === 0 ? 'Нет в наличии' : 'В корзину'}
          </Button>
        </div>
      </div>
    </div>
  );
}

