'use client';

import { Search } from 'lucide-react';
// eslint-disable-next-line import/order
import { useRouter } from 'next/navigation';
// eslint-disable-next-line import/order
import { useState } from 'react';
// eslint-disable-next-line import/order
import { useQuery } from '@tanstack/react-query';

import { Badge } from '@/components/ui/badge';
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
import { formatPrice } from '@/lib/utils';

export default function WarehouseStockPage(): JSX.Element {
  const router = useRouter();
  const { initData } = useTelegram();
  const token = getTokenFromUrl();
  const [searchQuery, setSearchQuery] = useState('');

  const isDevMode = !!token;

  const { data, isLoading, error } = useQuery({
    queryKey: ['admin', 'warehouse', 'stock', initData],
    queryFn: () => api.getWarehouseStock(initData),
    enabled: !!initData || isDevMode,
    staleTime: 0,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });

  const filteredItems =
    data?.items.filter(
      (item) =>
        !searchQuery ||
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.sku?.toLowerCase().includes(searchQuery.toLowerCase()),
    ) || [];

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
          <p className="mt-4 text-gray-600">Загрузка остатков...</p>
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
            <CardDescription>Не удалось загрузить остатки. Попробуйте обновить страницу.</CardDescription>
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
      <h1 className="text-3xl font-bold mb-8">Остатки</h1>

      {/* Search */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              type="text"
              placeholder="Поиск по названию или артикулу..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Stock Table */}
      <Card>
        <CardHeader>
          <CardTitle>Остатки товаров</CardTitle>
          <CardDescription>Текущие остатки на складе с экономикой</CardDescription>
        </CardHeader>
        <CardContent>
          {filteredItems.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              {searchQuery ? 'Товары не найдены' : 'Нет товаров на складе'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Товар</TableHead>
                    <TableHead>Артикул</TableHead>
                    <TableHead className="text-right">Остаток</TableHead>
                    <TableHead className="text-right">Цена</TableHead>
                    <TableHead className="text-right">Себестоимость</TableHead>
                    <TableHead className="text-right">Упаковка</TableHead>
                    <TableHead className="text-right">Прибыль/ед</TableHead>
                    <TableHead className="text-right">Маржа %</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredItems.map((item) => (
                    <TableRow
                      key={item.productId}
                      className="cursor-pointer hover:bg-gray-50"
                      onClick={() =>
                        router.push(addTokenToUrl(`/admin/products/${item.productId}/edit`, token))
                      }
                    >
                      <TableCell className="font-medium">{item.title}</TableCell>
                      <TableCell>{item.sku || '-'}</TableCell>
                      <TableCell className="text-right">
                        <Badge variant={item.currentStock > 0 ? 'default' : 'destructive'}>
                          {item.currentStock}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">{formatPrice(item.price)}</TableCell>
                      <TableCell className="text-right">
                        {item.costPrice !== null ? formatPrice(item.costPrice) : '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        {item.packagingCost !== null ? formatPrice(item.packagingCost) : '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        {item.unitProfit !== null ? formatPrice(item.unitProfit) : '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        {item.marginPercent !== null
                          ? `${item.marginPercent.toFixed(1)}%`
                          : '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

