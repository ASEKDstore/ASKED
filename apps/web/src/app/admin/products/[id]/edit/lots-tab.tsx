'use client';

import { Package, ExternalLink } from 'lucide-react';
// eslint-disable-next-line import/order
import { useRouter } from 'next/navigation';
// eslint-disable-next-line import/order
import { useQuery } from '@tanstack/react-query';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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

interface LotsTabProps {
  productId: string;
}

export function LotsTab({ productId }: LotsTabProps): JSX.Element {
  const router = useRouter();
  const { initData } = useTelegram();
  const token = getTokenFromUrl();
  const isDevMode = !!token;

  const { data, isLoading, error } = useQuery({
    queryKey: ['admin', 'warehouse', 'lots', productId, initData],
    queryFn: () => api.getWarehouseLots(initData, { productId, pageSize: 100 }),
    enabled: (!!initData || isDevMode) && !!productId,
    staleTime: 0,
    refetchOnWindowFocus: true,
  });

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        <p className="mt-4 text-gray-600">Загрузка партий...</p>
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-red-600">
            Ошибка загрузки партий. Попробуйте обновить страницу.
          </div>
        </CardContent>
      </Card>
    );
  }

  const lots = data?.items || [];

  // Calculate summary statistics
  const totalRemaining = lots.reduce((sum, lot) => sum + lot.qtyRemaining, 0);
  const totalCost = lots.reduce((sum, lot) => sum + lot.qtyRemaining * lot.unitCost, 0);
  const averageCost = totalRemaining > 0 ? totalCost / totalRemaining : 0;
  const lastPurchase = lots.length > 0
    ? lots.sort((a, b) => new Date(b.receivedAt).getTime() - new Date(a.receivedAt).getTime())[0]
    : null;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Текущий остаток</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalRemaining}</div>
            <p className="text-xs text-gray-500 mt-1">ед. товара</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Средняя себестоимость</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPrice(averageCost)}</div>
            <p className="text-xs text-gray-500 mt-1">взвешенная по остаткам</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Последняя закупка</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {lastPurchase ? formatPrice(lastPurchase.unitCost) : '-'}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {lastPurchase
                ? new Date(lastPurchase.receivedAt).toLocaleDateString('ru-RU')
                : 'нет данных'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Lots Table */}
      <Card>
        <CardHeader>
          <CardTitle>Партии товара</CardTitle>
          <CardDescription>FIFO-учет: партии списываются в порядке поступления</CardDescription>
        </CardHeader>
        <CardContent>
          {lots.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Package className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p>Нет партий для этого товара</p>
              <p className="text-sm mt-2">Партии создаются при постинге поставок</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Дата поступления</TableHead>
                    <TableHead className="text-right">Себестоимость</TableHead>
                    <TableHead className="text-right">Получено</TableHead>
                    <TableHead className="text-right">Осталось</TableHead>
                    <TableHead>Поставка</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lots
                    .sort((a, b) => new Date(a.receivedAt).getTime() - new Date(b.receivedAt).getTime())
                    .map((lot) => (
                      <TableRow key={lot.id}>
                        <TableCell>
                          {new Date(lot.receivedAt).toLocaleString('ru-RU', {
                            dateStyle: 'short',
                            timeStyle: 'short',
                          })}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatPrice(lot.unitCost)}
                        </TableCell>
                        <TableCell className="text-right">{lot.qtyReceived}</TableCell>
                        <TableCell className="text-right">
                          <Badge variant={lot.qtyRemaining > 0 ? 'default' : 'secondary'}>
                            {lot.qtyRemaining}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {lot.purchaseId ? (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                router.push(
                                  addTokenToUrl(`/admin/warehouse/purchases?highlight=${lot.purchaseId}`, token)
                                )
                              }
                              className="gap-1"
                            >
                              <ExternalLink className="w-3 h-3" />
                              {lot.purchase?.supplier || 'Поставка'}
                            </Button>
                          ) : (
                            <span className="text-sm text-gray-500">-</span>
                          )}
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

