'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ShoppingBag, Eye } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select } from '@/components/ui/select';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
} from '@/components/ui/drawer';
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
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ['admin', 'orders', initData, statusFilter],
    queryFn: () =>
      api.getAdminOrders(initData, {
        status: statusFilter !== 'All' ? (statusFilter as any) : undefined,
        page: 1,
        pageSize: 50,
      }),
    enabled: !!initData,
  });

  const { data: selectedOrder, isLoading: isLoadingOrder } = useQuery({
    queryKey: ['admin', 'order', selectedOrderId, initData],
    queryFn: () => api.getAdminOrder(initData, selectedOrderId!),
    enabled: !!selectedOrderId && !!initData && drawerOpen,
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'NEW' | 'CONFIRMED' | 'IN_PROGRESS' | 'DONE' | 'CANCELED' }) =>
      api.updateAdminOrderStatus(initData, id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'orders'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'order'] });
    },
  });

  const handleOpenDrawer = (orderId: string) => {
    setSelectedOrderId(orderId);
    setDrawerOpen(true);
  };

  const handleCloseDrawer = () => {
    setDrawerOpen(false);
    setSelectedOrderId(null);
  };

  const handleStatusChange = (status: 'NEW' | 'CONFIRMED' | 'IN_PROGRESS' | 'DONE' | 'CANCELED') => {
    if (selectedOrderId) {
      updateStatusMutation.mutate({ id: selectedOrderId, status });
    }
  };

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

  const orders = data?.items || [];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Заказы</h1>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Фильтры</CardTitle>
        </CardHeader>
        <CardContent>
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-48"
          >
            <option value="All">Все статусы</option>
            <option value="NEW">Новый</option>
            <option value="CONFIRMED">Подтвержден</option>
            <option value="IN_PROGRESS">В работе</option>
            <option value="DONE">Выполнен</option>
            <option value="CANCELED">Отменен</option>
          </Select>
        </CardContent>
      </Card>

      {orders.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <ShoppingBag className="w-16 h-16 text-gray-400 mb-4" />
            <p className="text-gray-600 text-lg mb-2">Заказы отсутствуют</p>
            <p className="text-gray-500 text-sm">
              {statusFilter !== 'All'
                ? 'Попробуйте изменить фильтр'
                : 'Когда появятся заказы, они отобразятся здесь'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Список заказов</CardTitle>
            <CardDescription>
              Всего заказов: {data?.meta.total || 0}
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
                  <TableHead className="text-right">Действия</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order: OrderListItem) => (
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
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenDrawer(order.id)}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        Подробнее
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Order Detail Drawer */}
      <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
        <DrawerContent title="Детали заказа">
          {isLoadingOrder ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
              <p className="mt-4 text-gray-600">Загрузка...</p>
            </div>
          ) : selectedOrder ? (
            <div className="space-y-6">
              <DrawerHeader>
                <DrawerTitle>Заказ #{selectedOrder.id.slice(0, 8)}</DrawerTitle>
                <DrawerDescription>
                  Создан: {new Date(selectedOrder.createdAt).toLocaleString('ru-RU')}
                </DrawerDescription>
              </DrawerHeader>

              {/* Status Section */}
              <div>
                <h3 className="text-sm font-medium mb-3">Статус заказа</h3>
                <div className="flex items-center gap-3 mb-4">
                  <Badge variant={statusVariants[selectedOrder.status] || 'default'}>
                    {statusLabels[selectedOrder.status] || selectedOrder.status}
                  </Badge>
                </div>
                <div className="flex gap-2 flex-wrap">
                  {(['NEW', 'CONFIRMED', 'IN_PROGRESS', 'DONE', 'CANCELED'] as const).map(
                    (status) => (
                      <Button
                        key={status}
                        variant={selectedOrder.status === status ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handleStatusChange(status)}
                        disabled={updateStatusMutation.isPending}
                      >
                        {statusLabels[status]}
                      </Button>
                    )
                  )}
                </div>
              </div>

              {/* Customer Info */}
              <div>
                <h3 className="text-sm font-medium mb-3">Информация о клиенте</h3>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-medium">Имя:</span> {selectedOrder.customerName}
                  </div>
                  <div>
                    <span className="font-medium">Телефон:</span> {selectedOrder.customerPhone}
                  </div>
                  {selectedOrder.customerAddress && (
                    <div>
                      <span className="font-medium">Адрес:</span> {selectedOrder.customerAddress}
                    </div>
                  )}
                </div>
              </div>

              {/* Order Items */}
              <div>
                <h3 className="text-sm font-medium mb-3">Товары в заказе</h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Товар</TableHead>
                      <TableHead>Цена</TableHead>
                      <TableHead>Кол-во</TableHead>
                      <TableHead className="text-right">Сумма</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedOrder.items.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>{item.titleSnapshot}</TableCell>
                        <TableCell>{formatPrice(item.priceSnapshot)}</TableCell>
                        <TableCell>{item.qty}</TableCell>
                        <TableCell className="text-right">
                          {formatPrice(item.priceSnapshot * item.qty)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Order Total */}
              <div className="border-t pt-4">
                <div className="flex justify-between items-center text-lg font-semibold">
                  <span>Итого:</span>
                  <span>{formatPrice(selectedOrder.totalAmount)}</span>
                </div>
              </div>

              {/* Comment */}
              {selectedOrder.comment && (
                <div>
                  <h3 className="text-sm font-medium mb-2">Комментарий</h3>
                  <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
                    {selectedOrder.comment}
                  </p>
                </div>
              )}

              <DrawerFooter>
                <Button variant="outline" onClick={handleCloseDrawer}>
                  Закрыть
                </Button>
              </DrawerFooter>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-600">Заказ не найден</p>
            </div>
          )}
        </DrawerContent>
      </Drawer>
    </div>
  );
}
