'use client';

import { useQuery } from '@tanstack/react-query';
import { ShoppingBag } from 'lucide-react';
import Link from 'next/link';

import { useTelegram } from '@/hooks/useTelegram';
import { api } from '@/lib/api';
import { formatPrice } from '@/lib/utils';

const statusLabels: Record<string, string> = {
  NEW: 'Новый',
  CONFIRMED: 'Подтвержден',
  IN_PROGRESS: 'В работе',
  DONE: 'Выполнен',
  CANCELED: 'Отменен',
};

const statusColors: Record<string, string> = {
  NEW: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  CONFIRMED: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
  IN_PROGRESS: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
  DONE: 'bg-green-500/20 text-green-300 border-green-500/30',
  CANCELED: 'bg-red-500/20 text-red-300 border-red-500/30',
};

export function MyOrdersList(): JSX.Element {
  const { initData, isTelegram } = useTelegram();

  const {
    data: ordersData,
    isLoading: isLoadingOrders,
    error: ordersError,
  } = useQuery({
    queryKey: ['orders', 'my', initData],
    queryFn: () => api.getMyOrders(initData),
    enabled: !!initData && isTelegram,
    retry: false,
  });

  if (isLoadingOrders) {
    return (
      <div className="text-center py-8">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-white/30"></div>
        <p className="mt-4 text-white/60 text-sm">Загрузка заказов...</p>
      </div>
    );
  }

  if (ordersError) {
    return (
      <div className="rounded-[20px] bg-black/30 backdrop-blur-xl border border-red-500/30 p-6 text-center">
        <p className="text-red-300 text-sm mb-4">Ошибка загрузки заказов</p>
        <p className="text-red-300/60 text-xs">
          {ordersError instanceof Error ? ordersError.message : 'Попробуйте обновить страницу'}
        </p>
      </div>
    );
  }

  if (!ordersData || ordersData.items.length === 0) {
    return (
      <div className="rounded-[20px] bg-black/30 backdrop-blur-xl border border-white/10 p-8 text-center">
        <ShoppingBag className="w-12 h-12 text-white/40 mx-auto mb-3" />
        <p className="text-white/60 text-sm mb-4">У вас пока нет заказов</p>
        <Link href="/catalog">
          <button className="rounded-full px-6 py-2.5 bg-white/12 hover:bg-white/16 text-white font-medium backdrop-blur-xl border border-white/10 transition-colors text-sm">
            Перейти в каталог
          </button>
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-white font-semibold text-xl">Мои заказы</h2>
        <span className="text-white/60 text-sm">
          {ordersData.items.length} {ordersData.items.length === 1 ? 'заказ' : 'заказов'}
        </span>
      </div>

      <div className="space-y-3">
        {ordersData.items.map((order) => (
          <div
            key={order.id}
            className="rounded-[20px] bg-black/30 backdrop-blur-xl border border-white/10 p-4"
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="text-white/60 text-xs mb-1">Заказ №{order.id.slice(0, 8)}</p>
                <p className="text-white font-medium text-sm">
                  {new Date(order.createdAt).toLocaleDateString('ru-RU', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </p>
              </div>
              <span
                className={`px-2.5 py-1 rounded-full text-xs font-medium border ${statusColors[order.status] || statusColors.NEW}`}
              >
                {statusLabels[order.status] || order.status}
              </span>
            </div>
            <div className="flex items-center justify-between pt-3 border-t border-white/10">
              <span className="text-white/60 text-sm">Сумма</span>
              <span className="text-white font-semibold">{formatPrice(order.totalAmount)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

