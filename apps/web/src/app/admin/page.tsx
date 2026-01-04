'use client';

import { Package, ShoppingBag, TrendingUp } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function AdminDashboardPage(): JSX.Element {
  // TODO: Replace with real data from API
  const metrics = [
    {
      title: 'Заказов сегодня',
      value: '0',
      icon: ShoppingBag,
      description: 'Новых заказов',
    },
    {
      title: 'Выручка сегодня',
      value: '0 ₽',
      icon: TrendingUp,
      description: 'За сегодня',
    },
    {
      title: 'Всего заказов',
      value: '0',
      icon: Package,
      description: 'Все время',
    },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                <div className="text-2xl font-bold">{metric.value}</div>
                <p className="text-xs text-muted-foreground">
                  {metric.description}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

