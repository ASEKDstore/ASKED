'use client';

import { ExternalLink } from 'lucide-react';
// eslint-disable-next-line import/order
import { useRouter } from 'next/navigation';
// eslint-disable-next-line import/order
import { useState } from 'react';
// eslint-disable-next-line import/order
import { useQuery } from '@tanstack/react-query';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useTelegram } from '@/hooks/useTelegram';
import { addTokenToUrl, getTokenFromUrl } from '@/lib/admin-nav';
import { api } from '@/lib/api';

const typeLabels: Record<string, string> = {
  IN: 'Приход',
  OUT: 'Расход',
  ADJUST: 'Корректировка',
};

const sourceTypeLabels: Record<string, string> = {
  ORDER: 'Заказ',
  MANUAL: 'Вручную',
  PURCHASE: 'Поставка',
};

const typeVariants: Record<string, 'default' | 'secondary' | 'destructive'> = {
  IN: 'default',
  OUT: 'destructive',
  ADJUST: 'secondary',
};

export default function WarehouseMovementsPage(): JSX.Element {
  const router = useRouter();
  const { initData } = useTelegram();
  const token = getTokenFromUrl();
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState<{
    from?: string;
    to?: string;
    productId?: string;
    type?: 'IN' | 'OUT' | 'ADJUST';
    sourceType?: 'ORDER' | 'MANUAL' | 'PURCHASE';
  }>({});

  const isDevMode = !!token;
  const pageSize = 20;

  const { data, isLoading, error } = useQuery({
    queryKey: ['admin', 'warehouse', 'movements', initData, currentPage, filters],
    queryFn: () =>
      api.getWarehouseMovements(initData, {
        ...filters,
        page: currentPage,
        pageSize,
      }),
    enabled: !!initData || isDevMode,
    staleTime: 0,
    refetchOnWindowFocus: true,
  });

  const { data: products } = useQuery({
    queryKey: ['admin', 'products', initData],
    queryFn: () => api.getAdminProducts(initData, { page: 1, pageSize: 1000 }),
    enabled: (!!initData || isDevMode) && !!filters.productId,
  });

  const handleFilterChange = (key: string, value: string | undefined) => {
    setFilters((prev) => {
      const updated = { ...prev, [key]: value || undefined };
      if (!value) {
        delete updated[key as keyof typeof updated];
      }
      return updated;
    });
    setCurrentPage(1);
  };

  const handleLinkClick = (sourceType: string, sourceId: string | null) => {
    if (!sourceId) return;
    if (sourceType === 'ORDER') {
      router.push(addTokenToUrl(`/admin/orders/${sourceId}`, token));
    } else if (sourceType === 'PURCHASE') {
      // Could navigate to purchase detail if we had that page
      // For now, just show the ID
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
          <p className="mt-4 text-gray-600">Загрузка движений...</p>
        </div>
      </div>
    );
  }

  if (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Ошибка</CardTitle>
            <CardDescription>Не удалось загрузить движения. Попробуйте обновить страницу.</CardDescription>
          </CardHeader>
          {isDevMode && (
            <CardContent>
              <div className="text-sm text-red-600">Debug: {errorMessage}</div>
            </CardContent>
          )}
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Движения</h1>

      {/* Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Фильтры</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">От</label>
              <Input
                type="date"
                value={filters.from || ''}
                onChange={(e) => handleFilterChange('from', e.target.value || undefined)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">До</label>
              <Input
                type="date"
                value={filters.to || ''}
                onChange={(e) => handleFilterChange('to', e.target.value || undefined)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Тип</label>
              <select
                className="w-full px-3 py-2 border rounded-md"
                value={filters.type || ''}
                onChange={(e) => handleFilterChange('type', e.target.value || undefined)}
              >
                <option value="">Все</option>
                <option value="IN">Приход</option>
                <option value="OUT">Расход</option>
                <option value="ADJUST">Корректировка</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Источник</label>
              <select
                className="w-full px-3 py-2 border rounded-md"
                value={filters.sourceType || ''}
                onChange={(e) => handleFilterChange('sourceType', e.target.value || undefined)}
              >
                <option value="">Все</option>
                <option value="ORDER">Заказ</option>
                <option value="MANUAL">Вручную</option>
                <option value="PURCHASE">Поставка</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Товар</label>
              <select
                className="w-full px-3 py-2 border rounded-md"
                value={filters.productId || ''}
                onChange={(e) => handleFilterChange('productId', e.target.value || undefined)}
              >
                <option value="">Все товары</option>
                {products?.items?.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="mt-4">
            <Button
              variant="outline"
              onClick={() => {
                setFilters({});
                setCurrentPage(1);
              }}
            >
              Сбросить фильтры
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Movements Table */}
      <Card>
        <CardHeader>
          <CardTitle>История движений</CardTitle>
          <CardDescription>Всего: {data?.total ?? 0}</CardDescription>
        </CardHeader>
        <CardContent>
          {!data || data.items.length === 0 ? (
            <div className="text-center py-12 text-gray-500">Нет движений</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Дата</TableHead>
                    <TableHead>Товар</TableHead>
                    <TableHead className="text-right">Количество</TableHead>
                    <TableHead>Тип</TableHead>
                    <TableHead>Источник</TableHead>
                    <TableHead>Ссылка</TableHead>
                    <TableHead>Примечание</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.items.map((movement) => (
                    <TableRow key={movement.id}>
                      <TableCell>
                        {new Date(movement.createdAt).toLocaleString('ru-RU', {
                          dateStyle: 'short',
                          timeStyle: 'short',
                        })}
                      </TableCell>
                      <TableCell className="font-medium">{movement.productTitle}</TableCell>
                      <TableCell className="text-right">
                        <span
                          className={
                            movement.quantity > 0
                              ? 'text-green-600 font-semibold'
                              : movement.quantity < 0
                                ? 'text-red-600 font-semibold'
                                : ''
                          }
                        >
                          {movement.quantity > 0 ? '+' : ''}
                          {movement.quantity}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant={typeVariants[movement.type]}>
                          {typeLabels[movement.type]}
                        </Badge>
                      </TableCell>
                      <TableCell>{sourceTypeLabels[movement.sourceType]}</TableCell>
                      <TableCell>
                        {movement.sourceId ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleLinkClick(movement.sourceType, movement.sourceId)}
                            className="gap-1"
                          >
                            <ExternalLink className="w-3 h-3" />
                            {movement.sourceType === 'ORDER' ? 'Заказ' : 'Поставка'}
                          </Button>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-gray-500">
                        {movement.note || '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Pagination */}
          {data && data.total > pageSize && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-gray-600">
                Страница {data.page} из {Math.ceil(data.total / data.pageSize)}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  disabled={data.page === 1}
                  onClick={() => setCurrentPage(data.page - 1)}
                >
                  Назад
                </Button>
                <Button
                  variant="outline"
                  disabled={data.page >= Math.ceil(data.total / data.pageSize)}
                  onClick={() => setCurrentPage(data.page + 1)}
                >
                  Вперед
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

