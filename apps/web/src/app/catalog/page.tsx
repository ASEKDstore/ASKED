'use client';

import { useQuery } from '@tanstack/react-query';
import { ShoppingCart, Search } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

import { ProductCard } from '@/components/product-card';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import { useCartStore } from '@/lib/cart-store';

export default function CatalogPage(): JSX.Element {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [sort, setSort] = useState<'new' | 'price_asc' | 'price_desc'>('new');
  const [page, setPage] = useState(1);
  const itemCount = useCartStore((state) => state.getItemCount());

  const { data, isLoading, error } = useQuery({
    queryKey: ['products', searchQuery, selectedCategory, sort, page],
    queryFn: () =>
      api.getProducts({
        q: searchQuery || undefined,
        category: selectedCategory || undefined,
        sort,
        page,
        pageSize: 20,
      }),
  });

  const categories = Array.from(
    new Set(data?.items.flatMap((p) => p.categories.map((c) => c.slug)) || [])
  );


  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <p className="text-red-600">Ошибка загрузки товаров</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Header with cart */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Каталог</h1>
        <Link href="/cart">
          <Button variant="outline" className="relative">
            <ShoppingCart className="w-5 h-5 mr-2" />
            Корзина
            {itemCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center">
                {itemCount}
              </span>
            )}
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="mb-6 space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Поиск товаров..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(1);
            }}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>

        {/* Category filter */}
        <div>
          <label className="block text-sm font-medium mb-2">Категория:</label>
          <select
            value={selectedCategory}
            onChange={(e) => {
              setSelectedCategory(e.target.value);
              setPage(1);
            }}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
          >
            <option value="">Все категории</option>
            {categories.map((slug) => {
              const cat = data?.items
                .flatMap((p) => p.categories)
                .find((c) => c.slug === slug);
              return (
                <option key={slug} value={slug}>
                  {cat?.name || slug}
                </option>
              );
            })}
          </select>
        </div>

        {/* Sort */}
        <div>
          <label className="block text-sm font-medium mb-2">Сортировка:</label>
          <select
            value={sort}
            onChange={(e) => {
              setSort(e.target.value as 'new' | 'price_asc' | 'price_desc');
              setPage(1);
            }}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
          >
            <option value="new">Новинки</option>
            <option value="price_asc">Цена: по возрастанию</option>
            <option value="price_desc">Цена: по убыванию</option>
          </select>
        </div>
      </div>

      {/* Products grid */}
      {isLoading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
          <p className="mt-4 text-gray-600">Загрузка товаров...</p>
        </div>
      ) : data?.items.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-600">Товары не найдены</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {data?.items.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>

          {/* Pagination */}
          {data && data.meta.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-8">
              <Button
                variant="outline"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                Назад
              </Button>
              <span className="px-4">
                Страница {data.meta.page} из {data.meta.totalPages}
              </span>
              <Button
                variant="outline"
                onClick={() => setPage((p) => Math.min(data.meta.totalPages, p + 1))}
                disabled={page === data.meta.totalPages}
              >
                Вперед
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

