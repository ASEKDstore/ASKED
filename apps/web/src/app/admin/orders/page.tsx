'use client';

import { useQuery } from '@tanstack/react-query';
import { Package } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
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
import { api, type OrderListItem } from '@/lib/api';
import { formatPrice } from '@/lib/utils';

const statusLabels: Record<string, string> = {
  NEW: 'Новый',
  CONFIRMED: 'Подтвержден',
  IN_PROGRESS: 'В работе',
  DONE: 'Выполнен',
  CANCELED: 'Отменен',
};

const statusVariants: Record<string, 'default' | 'secondary' | 'success' | 'destructive'> = {
  NEW: 'default',
  CONFIRMED: 'secondary',
  IN_PROGRESS: 'secondary',
  DONE: 'success',
  CANCELED: 'destructive',
};

export default function AdminOrdersPage(): JSX.Element {
  const { initData } = useTelegram();

  const { data, isLoading, error } = useQuery({
    queryKey: ['admin', 'orders', initData],
    queryFn: () => api.getAdminOrders(initData),
    enabled: !!initData,
  });

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
          <p className="mt-4 text-gray-600">Загрузка заказов...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Ошибка</CardTitle>
            <CardDescription>
              Не удалось загрузить заказы. Попробуйте обновить страницу.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (!data || data.items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Заказы</h1>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Package className="w-16 h-16 text-gray-400 mb-4" />
            <p className="text-gray-600 text-lg mb-2">Заказы отсутствуют</p>
            <p className="text-gray-500 text-sm">
              Когда появятся заказы, они отобразятся здесь
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Заказы</h1>

      <Card>
        <CardHeader>
          <CardTitle>Список заказов</CardTitle>
          <CardDescription>
            Всего заказов: {data.meta.total}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Клиент</TableHead>
                <TableHead>Телефон</TableHead>
                <TableHead>Статус</TableHead>
                <TableHead>Сумма</TableHead>
                <TableHead>Дата</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.items.map((order: OrderListItem) => (
                <TableRow key={order.id}>
                  <TableCell className="font-mono text-xs">
                    {order.id.slice(0, 8)}...
                  </TableCell>
                  <TableCell>{order.customerName}</TableCell>
                  <TableCell>{order.customerPhone}</TableCell>
                  <TableCell>
                    <Badge
                      variant={statusVariants[order.status] || 'default'}
                    >
                      {statusLabels[order.status] || order.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatPrice(order.totalAmount)}</TableCell>
                  <TableCell>
                    {new Date(order.createdAt).toLocaleDateString('ru-RU')}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

