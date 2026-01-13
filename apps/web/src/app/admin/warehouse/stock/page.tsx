'use client';

import { Search, XCircle } from 'lucide-react';
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

export default function WarehouseStockPage(): JSX.Element {
  const router = useRouter();
  const { initData } = useTelegram();
  const queryClient = useQueryClient();
  const token = getTokenFromUrl();
  const [searchQuery, setSearchQuery] = useState('');
  const [writeOffDialogOpen, setWriteOffDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<{
    productId: string;
    title: string;
    currentStock: number;
  } | null>(null);
  const [writeOffQty, setWriteOffQty] = useState('');
  const [writeOffReason, setWriteOffReason] = useState('');

  const isDevMode = !!token;

  const { data, isLoading, error } = useQuery({
    queryKey: ['admin', 'warehouse', 'stock', initData],
    queryFn: () => api.getWarehouseStock(initData),
    enabled: !!initData || isDevMode,
    staleTime: 0,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });

  // Fetch lots for each product to calculate average FIFO cost
  const productIds = data?.items.map((item) => item.productId) || [];
  const { data: lotsData } = useQuery({
    queryKey: ['admin', 'warehouse', 'lots', 'bulk', productIds, initData],
    queryFn: async () => {
      if (productIds.length === 0) return {};
      const lotsPromises = productIds.map((productId) =>
        api.getWarehouseLots(initData, { productId, pageSize: 100 }).then((result) => ({
          productId,
          lots: result.items,
        })),
      );
      const results = await Promise.all(lotsPromises);
      return results.reduce(
        (acc, { productId, lots }) => {
          acc[productId] = lots;
          return acc;
        },
        {} as Record<string, typeof results[0]['lots']>,
      );
    },
    enabled: (!!initData || isDevMode) && productIds.length > 0,
    staleTime: 0,
  });

  const writeOffMutation = useMutation({
    mutationFn: (data: { productId: string; qty: number; reason?: string }) =>
      api.createWarehouseWriteOff(initData, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'warehouse'] });
      setWriteOffDialogOpen(false);
      setSelectedProduct(null);
      setWriteOffQty('');
      setWriteOffReason('');
    },
  });

  const handleOpenWriteOffDialog = (item: {
    productId: string;
    title: string;
    currentStock: number;
  }) => {
    setSelectedProduct(item);
    setWriteOffQty('');
    setWriteOffReason('');
    setWriteOffDialogOpen(true);
  };

  const handleSubmitWriteOff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct || !writeOffQty) return;
    const qty = parseInt(writeOffQty);
    if (qty <= 0 || qty > selectedProduct.currentStock) return;
    writeOffMutation.mutate({
      productId: selectedProduct.productId,
      qty,
      reason: writeOffReason || undefined,
    });
  };

  // Calculate average FIFO cost for a product
  const getAverageFifoCost = (productId: string): number | null => {
    const lots = lotsData?.[productId] || [];
    if (lots.length === 0) return null;
    const totalRemaining = lots.reduce((sum, lot) => sum + lot.qtyRemaining, 0);
    if (totalRemaining === 0) return null;
    const totalCost = lots.reduce((sum, lot) => sum + lot.qtyRemaining * lot.unitCost, 0);
    return totalCost / totalRemaining;
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
        <h1 className="text-3xl font-bold">Остатки</h1>
        <Button
          variant="outline"
          onClick={() => router.push(addTokenToUrl('/admin/warehouse/movements', token))}
        >
          История движений
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
                    <TableHead className="text-right">Себест. (FIFO)</TableHead>
                    <TableHead className="text-right">Упаковка</TableHead>
                    <TableHead className="text-right">Прибыль/ед</TableHead>
                    <TableHead className="text-right">Маржа %</TableHead>
                    <TableHead className="text-right">Действия</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredItems.map((item) => {
                    const avgFifoCost = getAverageFifoCost(item.productId);
                    const estimatedProfit =
                      avgFifoCost !== null
                        ? item.price - avgFifoCost - (item.packagingCost ?? 0)
                        : item.unitProfit;
                    const estimatedMargin =
                      avgFifoCost !== null && item.price > 0 && estimatedProfit !== null
                        ? (estimatedProfit / item.price) * 100
                        : item.marginPercent;

                    return (
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
                          {avgFifoCost !== null ? (
                            <span className="font-medium">{formatPrice(avgFifoCost)}</span>
                          ) : item.costPrice !== null ? (
                            <span className="text-gray-500">{formatPrice(item.costPrice)}</span>
                          ) : (
                            '-'
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {item.packagingCost !== null ? formatPrice(item.packagingCost) : '-'}
                        </TableCell>
                        <TableCell className="text-right">
                          {estimatedProfit !== null ? (
                            <span className={estimatedProfit >= 0 ? 'text-green-600' : 'text-red-600'}>
                              {formatPrice(estimatedProfit)}
                            </span>
                          ) : (
                            '-'
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {estimatedMargin !== null
                            ? `${estimatedMargin.toFixed(1)}%`
                            : '-'}
                        </TableCell>
                        <TableCell
                          className="text-right"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenWriteOffDialog({
                              productId: item.productId,
                              title: item.title,
                              currentStock: item.currentStock,
                            });
                          }}
                        >
                          <Button size="sm" variant="outline" className="gap-1">
                            <XCircle className="w-4 h-4" />
                            Списание
                          </Button>
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

      {/* Write-Off Dialog */}
      <Dialog open={writeOffDialogOpen} onOpenChange={setWriteOffDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Списание товара</DialogTitle>
            <DialogDescription>
              Списать товар: {selectedProduct?.title}
              <br />
              Доступно: {selectedProduct?.currentStock} ед.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmitWriteOff}>
            <div className="space-y-4 py-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Количество <span className="text-red-500">*</span>
                </label>
                <Input
                  type="number"
                  required
                  min="1"
                  max={selectedProduct?.currentStock}
                  value={writeOffQty}
                  onChange={(e) => setWriteOffQty(e.target.value)}
                  placeholder="Введите количество"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Максимум: {selectedProduct?.currentStock} ед.
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Причина списания</label>
                <Textarea
                  value={writeOffReason}
                  onChange={(e) => setWriteOffReason(e.target.value)}
                  placeholder="Например: порча, брак, утеря"
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setWriteOffDialogOpen(false)}
              >
                Отмена
              </Button>
              <Button type="submit" disabled={writeOffMutation.isPending}>
                {writeOffMutation.isPending ? 'Списание...' : 'Списать'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

