'use client';

import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';

import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useTelegram } from '@/hooks/useTelegram';
import { getTokenFromUrl } from '@/lib/admin-nav';
import { api, ApiClientError } from '@/lib/api';

function formatError(error: unknown): string {
  if (error instanceof ApiClientError) {
    return `Ошибка загрузки (${error.statusCode || '?'}): ${error.message}`;
  }
  if (error instanceof Error) {
    return `Ошибка: ${error.message}`;
  }
  return 'Неизвестная ошибка';
}

function formatNumber(num: number): string {
  return new Intl.NumberFormat('ru-RU').format(num);
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    minimumFractionDigits: 0,
  }).format(amount);
}

export default function AdminAnalyticsPage(): JSX.Element {
  const { initData } = useTelegram();
  const token = getTokenFromUrl();
  const isDevMode = !!token;

  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d'>('30d');

  const getDateRange = () => {
    const now = new Date();
    const days = dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : 90;
    const from = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    return {
      from: from.toISOString(),
      to: now.toISOString(),
    };
  };

  const dateParams = getDateRange();

  const { data: overview, isLoading: overviewLoading, error: overviewError } = useQuery({
    queryKey: ['admin', 'analytics', 'overview', initData, dateRange],
    queryFn: () => api.getAnalyticsOverview(initData, { ...dateParams, granularity: 'day' }),
    enabled: !!initData || isDevMode,
  });

  const { data: subscribers, isLoading: subscribersLoading } = useQuery({
    queryKey: ['admin', 'analytics', 'subscribers', initData, dateRange],
    queryFn: () => api.getTelegramSubscribers(initData, { ...dateParams, granularity: 'day' }),
    enabled: !!initData || isDevMode,
  });

  const { data: topPosts, isLoading: postsLoading } = useQuery({
    queryKey: ['admin', 'analytics', 'topPosts', initData, dateRange],
    queryFn: () => api.getTopTelegramPosts(initData, { ...dateParams, limit: 10 }),
    enabled: !!initData || isDevMode,
  });

  const { data: topProducts, isLoading: productsLoading } = useQuery({
    queryKey: ['admin', 'analytics', 'topProducts', initData, dateRange],
    queryFn: () => api.getTopProducts(initData, { ...dateParams, metric: 'orders', limit: 10 }),
    enabled: !!initData || isDevMode,
  });

  const { data: funnel, isLoading: funnelLoading } = useQuery({
    queryKey: ['admin', 'analytics', 'funnel', initData, dateRange],
    queryFn: () => api.getFunnel(initData, dateParams),
    enabled: !!initData || isDevMode,
  });

  if (overviewLoading || subscribersLoading || postsLoading || productsLoading || funnelLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
          <p className="mt-4 text-gray-600">Загрузка аналитики...</p>
        </div>
      </div>
    );
  }

  if (overviewError) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert variant="destructive">{formatError(overviewError)}</Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Аналитика</h1>
        <div className="flex gap-2">
          <Button
            variant={dateRange === '7d' ? 'default' : 'outline'}
            onClick={() => setDateRange('7d')}
          >
            7 дней
          </Button>
          <Button
            variant={dateRange === '30d' ? 'default' : 'outline'}
            onClick={() => setDateRange('30d')}
          >
            30 дней
          </Button>
          <Button
            variant={dateRange === '90d' ? 'default' : 'outline'}
            onClick={() => setDateRange('90d')}
          >
            90 дней
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      {overview && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-gray-600">Подписчики</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatNumber(overview.subscribersNow)}</div>
              <div className={`text-sm ${overview.subscribersGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {overview.subscribersGrowth >= 0 ? '+' : ''}
                {formatNumber(overview.subscribersGrowth)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-gray-600">Выручка</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(overview.revenue)}</div>
              <div className="text-sm text-gray-600">Заказов: {formatNumber(overview.ordersCount)}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-gray-600">Конверсия</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{overview.conversion.toFixed(2)}%</div>
              <div className="text-sm text-gray-600">AOV: {formatCurrency(overview.aov)}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Subscribers Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Динамика подписчиков</CardTitle>
            <CardDescription>Изменение количества подписчиков канала</CardDescription>
          </CardHeader>
          <CardContent>
            {subscribers?.data && subscribers.data.length > 0 ? (
              <div className="space-y-2">
                {subscribers.data.slice(-10).map((point: any, idx: number) => (
                  <div key={idx} className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">{point.date}</span>
                    <div className="flex items-center gap-4">
                      <span className="font-medium">{formatNumber(point.count)}</span>
                      {point.growth !== 0 && (
                        <span className={`text-xs ${point.growth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {point.growth >= 0 ? '+' : ''}
                          {formatNumber(point.growth)}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">Нет данных</p>
            )}
          </CardContent>
        </Card>

        {/* Funnel */}
        <Card>
          <CardHeader>
            <CardTitle>Воронка конверсии</CardTitle>
            <CardDescription>Этапы конверсии пользователей</CardDescription>
          </CardHeader>
          <CardContent>
            {funnel?.funnel && funnel.funnel.length > 0 ? (
              <div className="space-y-4">
                {funnel.funnel.map((stage: any, idx: number) => (
                  <div key={idx}>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-medium">{stage.stage}</span>
                      <span className="text-sm text-gray-600">
                        {formatNumber(stage.count)} ({stage.percentage.toFixed(1)}%)
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${Math.min(stage.percentage, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">Нет данных</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tables Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Posts */}
        <Card>
          <CardHeader>
            <CardTitle>Топ постов Telegram</CardTitle>
            <CardDescription>По количеству просмотров</CardDescription>
          </CardHeader>
          <CardContent>
            {topPosts?.items && topPosts.items.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Пост</TableHead>
                    <TableHead>Просмотры</TableHead>
                    <TableHead>Дата</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topPosts.items.map((post: any) => (
                    <TableRow key={post.id}>
                      <TableCell className="max-w-xs truncate">
                        {post.textExcerpt || `Пост #${post.messageId}`}
                      </TableCell>
                      <TableCell>{formatNumber(post.views)}</TableCell>
                      <TableCell>
                        {new Date(post.date).toLocaleDateString('ru-RU', {
                          day: '2-digit',
                          month: '2-digit',
                        })}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-gray-500 text-center py-8">Нет данных</p>
            )}
          </CardContent>
        </Card>

        {/* Top Products */}
        <Card>
          <CardHeader>
            <CardTitle>Топ товаров</CardTitle>
            <CardDescription>По количеству заказов</CardDescription>
          </CardHeader>
          <CardContent>
            {topProducts?.items && topProducts.items.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Товар</TableHead>
                    <TableHead>Заказы</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topProducts.items.map((product: any) => (
                    <TableRow key={product.productId}>
                      <TableCell className="max-w-xs truncate">{product.productTitle}</TableCell>
                      <TableCell>{formatNumber(product.metric)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-gray-500 text-center py-8">Нет данных</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

