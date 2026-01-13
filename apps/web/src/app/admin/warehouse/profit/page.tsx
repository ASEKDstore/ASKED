'use client';

import { TrendingUp, DollarSign, Package, Percent, ArrowLeft } from 'lucide-react';
// eslint-disable-next-line import/order
import { useRouter } from 'next/navigation';
// eslint-disable-next-line import/order
import { useState } from 'react';
// eslint-disable-next-line import/order
import { useQuery } from '@tanstack/react-query';

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

export default function ProfitReportPage(): JSX.Element {
  const router = useRouter();
  const { initData } = useTelegram();
  const token = getTokenFromUrl();
  const [dateRange, setDateRange] = useState<'7' | '30' | '90' | 'custom'>('30');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');

  const isDevMode = !!token;

  // Calculate date range
  const getDateRange = (): { from: string; to: string } => {
    const to = new Date();
    let from: Date;

    if (dateRange === 'custom') {
      if (customFrom && customTo) {
        return {
          from: new Date(customFrom).toISOString().split('T')[0],
          to: new Date(customTo).toISOString().split('T')[0],
        };
      }
      // Fallback to 30 days if custom dates not set
      from = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    } else {
      const days = parseInt(dateRange);
      from = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    }

    return {
      from: from.toISOString().split('T')[0],
      to: to.toISOString().split('T')[0],
    };
  };

  const { from, to } = getDateRange();

  const { data, isLoading, error } = useQuery({
    queryKey: ['admin', 'warehouse', 'profit', initData, from, to],
    queryFn: () => api.getWarehouseProfit(initData, { from, to, status: 'DONE' }),
    enabled: (!!initData || isDevMode) && !!from && !!to,
    staleTime: 0,
    refetchOnWindowFocus: true,
  });

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
          <p className="mt-4 text-gray-600">Загрузка отчета...</p>
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
            <CardDescription>Не удалось загрузить отчет. Попробуйте обновить страницу.</CardDescription>
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
      <Button
        variant="ghost"
        onClick={() => router.push(addTokenToUrl('/admin/warehouse', token))}
        className="mb-6"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Назад к складу
      </Button>

      <h1 className="text-3xl font-bold mb-8">Отчет по прибыли</h1>

      {/* Date Range Picker */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Период</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <Button
              variant={dateRange === '7' ? 'default' : 'outline'}
              onClick={() => setDateRange('7')}
            >
              7 дней
            </Button>
            <Button
              variant={dateRange === '30' ? 'default' : 'outline'}
              onClick={() => setDateRange('30')}
            >
              30 дней
            </Button>
            <Button
              variant={dateRange === '90' ? 'default' : 'outline'}
              onClick={() => setDateRange('90')}
            >
              90 дней
            </Button>
            <Button
              variant={dateRange === 'custom' ? 'default' : 'outline'}
              onClick={() => setDateRange('custom')}
            >
              Произвольный
            </Button>
          </div>
          {dateRange === 'custom' && (
            <div className="flex gap-4 mt-4">
              <div className="flex-1">
                <label className="block text-sm font-medium mb-2">От</label>
                <input
                  type="date"
                  value={customFrom}
                  onChange={(e) => setCustomFrom(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium mb-2">До</label>
                <input
                  type="date"
                  value={customTo}
                  onChange={(e) => setCustomTo(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Выручка</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPrice(data?.revenue ?? 0)}</div>
            <p className="text-xs text-muted-foreground">За период</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Себестоимость</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPrice(data?.cogs ?? 0)}</div>
            <p className="text-xs text-muted-foreground">COGS (FIFO)</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Упаковка</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPrice(data?.packaging ?? 0)}</div>
            <p className="text-xs text-muted-foreground">Расходы на упаковку</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Валовая прибыль</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatPrice(data?.grossProfit ?? 0)}
            </div>
            <p className="text-xs text-muted-foreground">Прибыль</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Маржа</CardTitle>
            <Percent className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data?.marginPercent !== undefined ? `${data.marginPercent.toFixed(1)}%` : '0%'}
            </div>
            <p className="text-xs text-muted-foreground">От выручки</p>
          </CardContent>
        </Card>
      </div>

      {/* Product Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Топ по прибыли</CardTitle>
          <CardDescription>
            Товары с наибольшей прибылью за период (FIFO COGS) — {data?.orderCount ?? 0} заказов
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!data || data.productBreakdown.length === 0 ? (
            <div className="text-center py-12 text-gray-500">Нет данных за выбранный период</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Товар</TableHead>
                    <TableHead className="text-right">Продано</TableHead>
                    <TableHead className="text-right">Выручка</TableHead>
                    <TableHead className="text-right">COGS (FIFO)</TableHead>
                    <TableHead className="text-right">Прибыль</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.productBreakdown.map((item) => (
                    <TableRow
                      key={item.productId}
                      className="cursor-pointer hover:bg-gray-50"
                      onClick={() =>
                        router.push(
                          addTokenToUrl(`/admin/products/${item.productId}/edit?tab=lots`, token)
                        )
                      }
                    >
                      <TableCell className="font-medium">{item.title}</TableCell>
                      <TableCell className="text-right">{item.quantity}</TableCell>
                      <TableCell className="text-right">{formatPrice(item.revenue)}</TableCell>
                      <TableCell className="text-right">{formatPrice(item.cogs)}</TableCell>
                      <TableCell className="text-right">
                        <span
                          className={item.profit >= 0 ? 'text-green-600 font-semibold' : 'text-red-600'}
                        >
                          {formatPrice(item.profit)}
                        </span>
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

