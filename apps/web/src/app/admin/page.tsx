'use client';

import { Package, ShoppingBag, TrendingUp, Wrench } from 'lucide-react';
// eslint-disable-next-line import/order
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useTelegram } from '@/hooks/useTelegram';
import { getTokenFromUrl } from '@/lib/admin-nav';
import { api } from '@/lib/api';
import { formatPrice } from '@/lib/utils';

export default function AdminDashboardPage(): JSX.Element {
  const { initData } = useTelegram();
  const token = getTokenFromUrl();
  const isDevMode = !!token;
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ['admin', 'dashboard', 'summary', initData],
    queryFn: () => api.getAdminDashboardSummary(initData),
    enabled: !!initData || isDevMode,
    refetchOnWindowFocus: false,
    staleTime: 30000, // Cache for 30 seconds
  });

  const { data: maintenanceStatus, isLoading: isLoadingMaintenance } = useQuery({
    queryKey: ['settings', 'maintenance'],
    queryFn: () => api.getMaintenanceStatus(),
    refetchOnWindowFocus: false,
    staleTime: 30 * 1000,
  });

  const [optimisticEnabled, setOptimisticEnabled] = useState<boolean | null>(null);

  const updateMaintenanceMutation = useMutation({
    mutationFn: (enabled: boolean) => api.updateMaintenanceStatus(initData, enabled),
    onMutate: (enabled) => {
      setOptimisticEnabled(enabled);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings', 'maintenance'] });
      setOptimisticEnabled(null);
    },
    onError: () => {
      setOptimisticEnabled(null);
    },
  });

  const currentMaintenanceEnabled = optimisticEnabled !== null ? optimisticEnabled : maintenanceStatus?.globalMaintenanceEnabled ?? false;

  const metrics = [
    {
      title: 'Заказов сегодня',
      value: data?.todayOrders ?? 0,
      icon: ShoppingBag,
      description: 'Новых заказов',
      format: (v: number) => v.toString(),
    },
    {
      title: 'Выручка сегодня',
      value: data?.todayRevenue ?? 0,
      icon: TrendingUp,
      description: 'За сегодня',
      format: (v: number) => formatPrice(v),
    },
    {
      title: 'Всего заказов',
      value: data?.totalOrders ?? 0,
      icon: Package,
      description: 'Все время',
      format: (v: number) => v.toString(),
    },
  ];

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Dashboard</h1>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  <div className="h-4 w-24 bg-gray-200 animate-pulse rounded" />
                </CardTitle>
                <div className="h-4 w-4 bg-gray-200 animate-pulse rounded" />
              </CardHeader>
              <CardContent>
                <div className="h-8 w-16 bg-gray-200 animate-pulse rounded mb-2" />
                <div className="h-3 w-32 bg-gray-200 animate-pulse rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStatus = (error as { statusCode?: number })?.statusCode;
    const isForbidden = errorStatus === 403;

    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Dashboard</h1>
        <Card>
          <CardHeader>
            <CardTitle>Ошибка</CardTitle>
            <CardContent>
              <p className="text-muted-foreground">
                {isForbidden
                  ? 'Доступ запрещен. Только администраторы могут просматривать статистику.'
                  : `Не удалось загрузить статистику: ${errorMessage}`}
              </p>
            </CardContent>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {metrics.map((metric) => {
          const Icon = metric.icon;
          return (
            <Card key={metric.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {metric.title}
                </CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metric.format(metric.value)}</div>
                <p className="text-xs text-muted-foreground">
                  {metric.description}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Maintenance Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Wrench className="h-5 w-5 text-muted-foreground" />
            <CardTitle>Технические работы (глобально)</CardTitle>
          </div>
          <CardDescription>
            Не влияет на LAB и Профиль → Заказы
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <label htmlFor="maintenance-toggle" className="text-sm font-medium cursor-pointer">
              Показывать экран техработ пользователям
            </label>
            <button
              id="maintenance-toggle"
              type="button"
              role="switch"
              aria-checked={currentMaintenanceEnabled}
              onClick={() => {
                updateMaintenanceMutation.mutate(!currentMaintenanceEnabled);
              }}
              disabled={isLoadingMaintenance || updateMaintenanceMutation.isPending}
              className={`
                relative inline-flex h-6 w-11 items-center rounded-full transition-colors
                ${currentMaintenanceEnabled ? 'bg-primary' : 'bg-gray-300'}
                disabled:opacity-50 disabled:cursor-not-allowed
                focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2
              `}
            >
              <span
                className={`
                  inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                  ${currentMaintenanceEnabled ? 'translate-x-6' : 'translate-x-1'}
                `}
              />
            </button>
          </div>
          {(isLoadingMaintenance || updateMaintenanceMutation.isPending) && (
            <p className="text-xs text-muted-foreground mt-2">
              {updateMaintenanceMutation.isPending ? 'Обновление...' : 'Загрузка...'}
            </p>
          )}
          {updateMaintenanceMutation.isError && (
            <p className="text-xs text-destructive mt-2">
              Ошибка при обновлении. Попробуйте снова.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
