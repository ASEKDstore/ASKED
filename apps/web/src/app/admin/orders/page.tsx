'use client';

import { ShoppingBag, Eye, ArrowLeft, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
// eslint-disable-next-line import/order
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
} from '@/components/ui/drawer';
import { Select } from '@/components/ui/select';
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
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteOrderId, setDeleteOrderId] = useState<string | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ['admin', 'orders', initData, statusFilter],
    queryFn: () =>
      api.getAdminOrders(initData, {
        status:
          statusFilter !== 'All'
            ? (statusFilter as 'NEW' | 'CONFIRMED' | 'IN_PROGRESS' | 'DONE' | 'CANCELED')
            : undefined,
        page: 1,
        pageSize: 50,
      }),
    enabled: !!initData,
    staleTime: 0, // Orders should always be fresh
    refetchOnWindowFocus: true, // Refresh orders on focus
    keepPreviousData: true, // Prevent flicker when filtering
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
      // Invalidate queries to refetch updated data
      queryClient.invalidateQueries({ queryKey: ['admin', 'orders'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'order'] });
      // Keep drawer open to show updated status, or close it
      setDrawerOpen(false);
      // DO NOT redirect - stay on the same page to see the updated status
    },
  });

  const deleteOrderMutation = useMutation({
    mutationFn: (id: string) => api.deleteAdminOrder(initData, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'orders'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'order'] });
      setDeleteDialogOpen(false);
      setDeleteOrderId(null);
      if (selectedOrderId === deleteOrderId) {
        setDrawerOpen(false);
        setSelectedOrderId(null);
      }
    },
  });

  const handleOpenDrawer = (orderId: string) => {
    setSelectedOrderId(orderId);
    setDrawerOpen(true);
    
    // Handle Telegram WebApp BackButton when drawer opens
    if (typeof window !== 'undefined' && window.Telegram?.WebApp?.BackButton) {
      const backButton = window.Telegram.WebApp.BackButton;
      backButton.show();
      backButton.onClick(() => {
        handleCloseDrawer();
      });
    }
  };

  const handleCloseDrawer = () => {
    setDrawerOpen(false);
    setSelectedOrderId(null);
    
    // Hide Telegram WebApp BackButton when drawer closes
    if (typeof window !== 'undefined' && window.Telegram?.WebApp?.BackButton) {
      window.Telegram.WebApp.BackButton.hide();
    }
  };

  const handleStatusChange = (status: 'NEW' | 'CONFIRMED' | 'IN_PROGRESS' | 'DONE' | 'CANCELED') => {
    if (selectedOrderId) {
      updateStatusMutation.mutate({ id: selectedOrderId, status });
    }
  };

  const handleDeleteClick = (orderId: string) => {
    setDeleteOrderId(orderId);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (deleteOrderId) {
      deleteOrderMutation.mutate(deleteOrderId);
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
      <div className="mb-4">
        <Link href="/admin">
          <Button variant="ghost" size="sm" className="text-gray-600">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Назад в админку
          </Button>
        </Link>
      </div>
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
            {/* Mobile: Card layout */}
            <div className="md:hidden space-y-4">
              {orders.map((order: OrderListItem) => (
                <div
                  key={order.id}
                  className="border rounded-lg p-4 space-y-3 bg-white"
                  onClick={() => handleOpenDrawer(order.id)}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-mono text-sm font-semibold">
                        {order.number || order.id.slice(0, 8)}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {new Date(order.createdAt).toLocaleDateString('ru-RU')}
                      </div>
                    </div>
                    <Badge variant={statusVariants[order.status] || 'default'}>
                      {statusLabels[order.status] || order.status}
                    </Badge>
                  </div>
                  <div className="space-y-1 text-sm">
                    <div>
                      <span className="text-gray-500">Клиент:</span>{' '}
                      <span className="font-medium">{order.customerName}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Телефон:</span>{' '}
                      <span className="font-medium">{order.customerPhone}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Сумма:</span>{' '}
                      <span className="font-semibold">{formatPrice(order.totalAmount)}</span>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenDrawer(order.id);
                    }}
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    Подробнее
                  </Button>
                </div>
              ))}
            </div>

            {/* Desktop: Table layout with horizontal scroll */}
            <div className="hidden md:block overflow-x-auto scrollbar-hide">
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
                        {order.number || order.id.slice(0, 8)}
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
            </div>
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
                <DrawerTitle>Заказ {selectedOrder.number || `#${selectedOrder.id.slice(0, 8)}`}</DrawerTitle>
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
                {/* Mobile: Card layout */}
                <div className="md:hidden space-y-3">
                  {selectedOrder.items.map((item) => (
                    <div key={item.id} className="border rounded-lg p-3 bg-gray-50">
                      <div className="font-medium text-sm mb-2">{item.titleSnapshot}</div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">
                          {formatPrice(item.priceSnapshot)} × {item.qty}
                        </span>
                        <span className="font-semibold">
                          {formatPrice(item.priceSnapshot * item.qty)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
                {/* Desktop: Table layout */}
                <div className="hidden md:block overflow-x-auto">
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

              <DrawerFooter className="flex-col sm:flex-row gap-2">
                <Button
                  variant="destructive"
                  onClick={() => handleDeleteClick(selectedOrder.id)}
                  disabled={deleteOrderMutation.isPending}
                  className="w-full sm:w-auto"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Удалить заказ
                </Button>
                <Button variant="outline" onClick={handleCloseDrawer} className="w-full sm:w-auto">
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

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить заказ?</AlertDialogTitle>
            <AlertDialogDescription>
              Вы уверены, что хотите удалить этот заказ? Заказ будет скрыт из списка, но данные сохранятся.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-red-600 hover:bg-red-700"
              disabled={deleteOrderMutation.isPending}
            >
              {deleteOrderMutation.isPending ? 'Удаление...' : 'Удалить'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
