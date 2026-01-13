'use client';

import { Search, Plus, Edit } from 'lucide-react';
// eslint-disable-next-line import/order
import { useRouter } from 'next/navigation';
// eslint-disable-next-line import/order
import { useState } from 'react';
// eslint-disable-next-line import/order
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { useTelegram } from '@/hooks/useTelegram';
import { addTokenToUrl, getTokenFromUrl } from '@/lib/admin-nav';
import { api } from '@/lib/api';
import { formatPrice } from '@/lib/utils';

export default function WarehousePage(): JSX.Element {
  const router = useRouter();
  const { initData } = useTelegram();
  const queryClient = useQueryClient();
  const token = getTokenFromUrl();
  const [searchQuery, setSearchQuery] = useState('');
  const [inMovementDialogOpen, setInMovementDialogOpen] = useState(false);
  const [adjustDialogOpen, setAdjustDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<{
    productId: string;
    title: string;
  } | null>(null);
  const [movementQty, setMovementQty] = useState('');
  const [movementNote, setMovementNote] = useState('');

  const isDevMode = !!token;

  const { data, isLoading, error } = useQuery({
    queryKey: ['admin', 'warehouse', 'stock', initData],
    queryFn: () => api.getWarehouseStock(initData),
    enabled: !!initData || isDevMode,
    staleTime: 0,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });

  const inMovementMutation = useMutation({
    mutationFn: (data: { productId: string; qty: number; note?: string }) =>
      api.createInventoryMovementIn(initData, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'warehouse'] });
      setInMovementDialogOpen(false);
      setSelectedProduct(null);
      setMovementQty('');
      setMovementNote('');
    },
  });

  const adjustMovementMutation = useMutation({
    mutationFn: (data: { productId: string; qtyDelta: number; note?: string }) =>
      api.createInventoryMovementAdjust(initData, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'warehouse'] });
      setAdjustDialogOpen(false);
      setSelectedProduct(null);
      setMovementQty('');
      setMovementNote('');
    },
  });

  const handleOpenInDialog = (product: { productId: string; title: string }) => {
    setSelectedProduct(product);
    setInMovementDialogOpen(true);
  };

  const handleOpenAdjustDialog = (product: { productId: string; title: string }) => {
    setSelectedProduct(product);
    setAdjustDialogOpen(true);
  };

  const handleSubmitInMovement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct || !movementQty) return;
    const qty = parseInt(movementQty);
    if (qty <= 0) return;
    inMovementMutation.mutate({
      productId: selectedProduct.productId,
      qty,
      note: movementNote || undefined,
    });
  };

  const handleSubmitAdjustMovement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct || !movementQty) return;
    const qtyDelta = parseInt(movementQty);
    if (qtyDelta === 0) return;
    adjustMovementMutation.mutate({
      productId: selectedProduct.productId,
      qtyDelta,
      note: movementNote || undefined,
    });
  };

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
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Склад</h1>
          <p className="text-gray-600">Управление остатками и движениями товаров</p>
        </div>
        <Button onClick={() => router.push(addTokenToUrl('/admin/warehouse/profit', token))}>
          Отчет по прибыли
        </Button>
      </div>

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
          <CardTitle>Остатки</CardTitle>
          <CardDescription>Текущие остатки товаров на складе</CardDescription>
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
                    <TableHead className="text-right">Действия</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredItems.map((item) => {
                    const unitProfit =
                      item.price - (item.costPrice ?? 0) - (item.packagingCost ?? 0);
                    const margin = item.price > 0 ? (unitProfit / item.price) * 100 : 0;
                    return (
                      <TableRow
                        key={item.productId}
                        className="cursor-pointer hover:bg-gray-50"
                        onClick={() => router.push(addTokenToUrl(`/admin/products/${item.productId}/edit`, token))}
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
                          {item.costPrice !== null || item.packagingCost !== null
                            ? formatPrice(unitProfit)
                            : '-'}
                        </TableCell>
                        <TableCell className="text-right">
                          {item.costPrice !== null || item.packagingCost !== null
                            ? `${margin.toFixed(1)}%`
                            : '-'}
                        </TableCell>
                        <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex gap-2 justify-end">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleOpenInDialog(item)}
                            >
                              <Plus className="w-4 h-4 mr-1" />
                              Приход
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleOpenAdjustDialog(item)}
                            >
                              <Edit className="w-4 h-4 mr-1" />
                              Корр.
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* In Movement Dialog */}
      <Dialog open={inMovementDialogOpen} onOpenChange={setInMovementDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Приход товара</DialogTitle>
            <DialogDescription>
              Добавить товар на склад: {selectedProduct?.title}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmitInMovement}>
            <div className="space-y-4 py-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Количество <span className="text-red-500">*</span>
                </label>
                <Input
                  type="number"
                  required
                  min="1"
                  value={movementQty}
                  onChange={(e) => setMovementQty(e.target.value)}
                  placeholder="Введите количество"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Примечание</label>
                <Textarea
                  value={movementNote}
                  onChange={(e) => setMovementNote(e.target.value)}
                  placeholder="Необязательное примечание"
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setInMovementDialogOpen(false)}
              >
                Отмена
              </Button>
              <Button type="submit" disabled={inMovementMutation.isPending}>
                {inMovementMutation.isPending ? 'Сохранение...' : 'Добавить'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Adjust Movement Dialog */}
      <Dialog open={adjustDialogOpen} onOpenChange={setAdjustDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Корректировка остатка</DialogTitle>
            <DialogDescription>
              Изменить остаток товара: {selectedProduct?.title}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmitAdjustMovement}>
            <div className="space-y-4 py-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Изменение <span className="text-red-500">*</span>
                </label>
                <Input
                  type="number"
                  required
                  value={movementQty}
                  onChange={(e) => setMovementQty(e.target.value)}
                  placeholder="Положительное для увеличения, отрицательное для уменьшения"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Например: +10 для увеличения, -5 для уменьшения
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Примечание</label>
                <Textarea
                  value={movementNote}
                  onChange={(e) => setMovementNote(e.target.value)}
                  placeholder="Необязательное примечание"
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setAdjustDialogOpen(false)}
              >
                Отмена
              </Button>
              <Button type="submit" disabled={adjustMovementMutation.isPending}>
                {adjustMovementMutation.isPending ? 'Сохранение...' : 'Сохранить'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

