'use client';

import { useQuery } from '@tanstack/react-query';
import { ShoppingCart, Search } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { HEADER_HEIGHT_PX } from '@/components/Header';
import { ProductCardRef } from '@/components/shop/ProductCardRef';
import { api } from '@/lib/api';
import { useCartStore } from '@/lib/cart-store';

// Use same background image as Home page
const BG_IMAGE_URL = '/home-bg.jpg';

export default function CatalogPage(): JSX.Element {
  const router = useRouter();
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

  // Calculate header height with safe area
  const headerTotalHeight = `calc(${HEADER_HEIGHT_PX}px + env(safe-area-inset-top, 0px))`;

  if (error) {
    return (
      <div className="fixed inset-0 overflow-hidden bg-black">
        {/* Fixed Background Layers */}
        <div className="fixed inset-0 z-0">
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{
              backgroundImage: `url(${BG_IMAGE_URL})`,
              backgroundAttachment: 'fixed',
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/50 to-black/70" />
          <div
            className="absolute inset-0 backdrop-blur-[12px]"
            style={{
              WebkitBackdropFilter: 'blur(12px)',
            }}
          />
          <div
            className="absolute inset-0 opacity-[0.03] mix-blend-overlay"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='180' height='180' filter='url(%23n)' opacity='.35'/%3E%3C/svg%3E")`,
              backgroundSize: '180px 180px',
            }}
          />
        </div>
        <div
          className="relative z-10 h-full overflow-y-auto overflow-x-hidden overscroll-none"
          style={{
            paddingTop: headerTotalHeight,
            paddingBottom: 'env(safe-area-inset-bottom, 0px)',
            WebkitOverflowScrolling: 'touch',
          }}
        >
          <div className="container mx-auto px-4 py-8">
            <div className="text-center">
              <p className="text-red-400">Ошибка загрузки товаров</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 overflow-hidden">
      {/* Fixed Background Layers */}
      <div className="fixed inset-0 z-0">
        {/* Background Image */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url(${BG_IMAGE_URL})`,
            backgroundAttachment: 'fixed',
          }}
        />

        {/* Dark Overlay Gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/50 to-black/70" />

        {/* Blur Layer */}
        <div
          className="absolute inset-0 backdrop-blur-[12px]"
          style={{
            WebkitBackdropFilter: 'blur(12px)',
          }}
        />

        {/* Subtle Grain Texture */}
        <div
          className="absolute inset-0 opacity-[0.03] mix-blend-overlay"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='180' height='180' filter='url(%23n)' opacity='.35'/%3E%3C/svg%3E")`,
            backgroundSize: '180px 180px',
          }}
        />
      </div>

      {/* Scrollable Content Container */}
      <div
        className="relative z-10 h-full overflow-y-auto overflow-x-hidden overscroll-none"
        style={{
          paddingTop: headerTotalHeight,
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        <div className="min-h-full flex flex-col items-start pb-16 px-4">
          {/* Header with title and cart */}
          <div className="w-full flex items-center justify-between mb-6 pt-6">
            <h1 className="text-[clamp(28px,7vw,36px)] font-bold text-white">Каталог</h1>
            {/* Cart button - minimal glass pill */}
            <Link href="/cart">
              <button className="relative rounded-full px-4 py-2 bg-white/10 hover:bg-white/15 text-white backdrop-blur-xl border border-white/10 transition-colors flex items-center gap-2">
                <ShoppingCart className="w-4 h-4" />
                {itemCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center font-medium">
                    {itemCount}
                  </span>
                )}
              </button>
            </Link>
          </div>

          {/* Filters & Search - Glass Container */}
          <div className="w-full mb-6">
            <div className="rounded-[20px] bg-black/30 backdrop-blur-xl border border-white/10 p-4 space-y-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/50 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Поиск..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setPage(1);
                  }}
                  className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-[12px] text-white placeholder-white/40 focus:outline-none focus:border-white/20 focus:bg-white/10 transition-colors text-sm"
                />
              </div>

              {/* Category and Sort - Responsive Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Category filter */}
                <div>
                  <select
                    value={selectedCategory}
                    onChange={(e) => {
                      setSelectedCategory(e.target.value);
                      setPage(1);
                    }}
                    className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-[12px] text-white focus:outline-none focus:border-white/20 focus:bg-white/10 transition-colors text-sm appearance-none cursor-pointer"
                  >
                    <option value="" className="bg-black text-white">Все категории</option>
                    {categories.map((slug) => {
                      const cat = data?.items
                        .flatMap((p) => p.categories)
                        .find((c) => c.slug === slug);
                      return (
                        <option key={slug} value={slug} className="bg-black text-white">
                          {cat?.name || slug}
                        </option>
                      );
                    })}
                  </select>
                </div>

                {/* Sort */}
                <div>
                  <select
                    value={sort}
                    onChange={(e) => {
                      setSort(e.target.value as 'new' | 'price_asc' | 'price_desc');
                      setPage(1);
                    }}
                    className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-[12px] text-white focus:outline-none focus:border-white/20 focus:bg-white/10 transition-colors text-sm appearance-none cursor-pointer"
                  >
                    <option value="new" className="bg-black text-white">Новинки</option>
                    <option value="price_asc" className="bg-black text-white">Цена: по возрастанию</option>
                    <option value="price_desc" className="bg-black text-white">Цена: по убыванию</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Products grid - 2 columns */}
          {isLoading ? (
            <div className="w-full text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-white/30"></div>
              <p className="mt-4 text-white/60">Загрузка товаров...</p>
            </div>
          ) : data?.items.length === 0 ? (
            <div className="w-full text-center py-12">
              <p className="text-white/60">Товары не найдены</p>
            </div>
          ) : (
            <>
              <div className="w-full grid grid-cols-2 gap-[14px] md:gap-[18px]">
                {data?.items.map((product) => (
                  <ProductCardRef key={product.id} product={product} />
                ))}
              </div>

              {/* Pagination */}
              {data && data.meta.totalPages > 1 && (
                <div className="w-full flex items-center justify-center gap-3 mt-8">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-4 py-2 rounded-full bg-white/10 hover:bg-white/15 text-white backdrop-blur-xl border border-white/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed text-sm"
                  >
                    Назад
                  </button>
                  <span className="px-4 text-white/70 text-sm">
                    {data.meta.page} / {data.meta.totalPages}
                  </span>
                  <button
                    onClick={() => setPage((p) => Math.min(data.meta.totalPages, p + 1))}
                    disabled={page === data.meta.totalPages}
                    className="px-4 py-2 rounded-full bg-white/10 hover:bg-white/15 text-white backdrop-blur-xl border border-white/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed text-sm"
                  >
                    Вперед
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
