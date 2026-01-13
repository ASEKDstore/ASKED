'use client';

import { Plus, Eye, CheckCircle, XCircle } from 'lucide-react';
// eslint-disable-next-line import/order
import { useState, useEffect } from 'react';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { getTokenFromUrl } from '@/lib/admin-nav';
import { api } from '@/lib/api';
import { formatPrice } from '@/lib/utils';

const statusLabels: Record<string, string> = {
  DRAFT: 'Черновик',
  POSTED: 'Проведена',
  CANCELED: 'Отменена',
};

const statusVariants: Record<string, 'default' | 'secondary' | 'destructive'> = {
  DRAFT: 'secondary',
  POSTED: 'default',
  CANCELED: 'destructive',
};

interface PurchaseItemForm {
  productId: string;
  qty: number;
  unitCost: number;
}

export default function WarehousePurchasesPage(): JSX.Element {
  const { initData } = useTelegram();
  const queryClient = useQueryClient();
  const token = getTokenFromUrl();
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedPurchaseId, setSelectedPurchaseId] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [postConfirmOpen, setPostConfirmOpen] = useState(false);
  const [postingPurchaseId, setPostingPurchaseId] = useState<string | null>(null);
  const [updateCostPrice, setUpdateCostPrice] = useState(false);

  const isDevMode = !!token;
  const pageSize = 20;

  const { data, isLoading, error } = useQuery({
    queryKey: ['admin', 'warehouse', 'purchases', initData, currentPage, statusFilter],
    queryFn: () =>
      api.getWarehousePurchases(initData, {
        page: currentPage,
        pageSize,
        status: statusFilter !== 'All' ? (statusFilter as 'DRAFT' | 'POSTED' | 'CANCELED') : undefined,
      }),
    enabled: !!initData || isDevMode,
    staleTime: 0,
    refetchOnWindowFocus: true,
  });

  const { data: selectedPurchase, isLoading: isLoadingPurchase } = useQuery({
    queryKey: ['admin', 'warehouse', 'purchase', selectedPurchaseId, initData],
    queryFn: () => api.getWarehousePurchase(initData, selectedPurchaseId!),
    enabled: !!selectedPurchaseId && !!initData && drawerOpen,
  });

  const { data: products } = useQuery({
    queryKey: ['admin', 'products', initData],
    queryFn: () => api.getAdminProducts(initData, { page: 1, pageSize: 1000 }),
    enabled: (!!initData || isDevMode) && (createDialogOpen || drawerOpen),
  });

  const createMutation = useMutation({
    mutationFn: (data: {
      supplier?: string;
      comment?: string;
      items: Array<{ productId: string; qty: number; unitCost: number }>;
    }) => api.createWarehousePurchase(initData, data),
    onSuccess: (purchase) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'warehouse', 'purchases'] });
      setCreateDialogOpen(false);
      setSelectedPurchaseId(purchase.id);
      setDrawerOpen(true);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: {
        supplier?: string;
        comment?: string;
        items?: Array<{ productId: string; qty: number; unitCost: number }>;
      };
    }) => api.updateWarehousePurchase(initData, id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'warehouse', 'purchases'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'warehouse', 'purchase'] });
    },
  });

  const postMutation = useMutation({
    mutationFn: ({ id, updateCostPrice }: { id: string; updateCostPrice?: boolean }) =>
      api.postWarehousePurchase(initData, id, { updateCostPrice }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'warehouse', 'purchases'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'warehouse', 'purchase'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'warehouse', 'stock'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'warehouse', 'movements'] });
      setPostConfirmOpen(false);
      setPostingPurchaseId(null);
      setUpdateCostPrice(false);
    },
  });

  const cancelMutation = useMutation({
    mutationFn: (id: string) => api.cancelWarehousePurchase(initData, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'warehouse', 'purchases'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'warehouse', 'purchase'] });
    },
  });

  const [formData, setFormData] = useState<{
    supplier: string;
    comment: string;
    items: PurchaseItemForm[];
  }>({
    supplier: '',
    comment: '',
    items: [{ productId: '', qty: 1, unitCost: 0 }],
  });

  const handleOpenDrawer = (purchaseId: string) => {
    setSelectedPurchaseId(purchaseId);
    setDrawerOpen(true);
  };

  const handleCloseDrawer = () => {
    setDrawerOpen(false);
    setSelectedPurchaseId(null);
  };

  const handlePost = (id: string) => {
    setPostingPurchaseId(id);
    setPostConfirmOpen(true);
  };

  const handleConfirmPost = () => {
    if (postingPurchaseId) {
      postMutation.mutate({
        id: postingPurchaseId,
        updateCostPrice,
      });
    }
  };

  const handleAddItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { productId: '', qty: 1, unitCost: 0 }],
    });
  };

  const handleRemoveItem = (index: number) => {
    setFormData({
      ...formData,
      items: formData.items.filter((_, i) => i !== index),
    });
  };

  const handleUpdateItem = (index: number, field: keyof PurchaseItemForm, value: string | number) => {
    const updated = [...formData.items];
    updated[index] = { ...updated[index], [field]: value };
    setFormData({ ...formData, items: updated });
  };

  const handleCreate = () => {
    if (formData.items.length === 0 || formData.items.some((item) => !item.productId || item.qty <= 0)) {
      return;
    }
    createMutation.mutate({
      supplier: formData.supplier || undefined,
      comment: formData.comment || undefined,
      items: formData.items.map((item) => ({
        productId: item.productId,
        qty: item.qty,
        unitCost: item.unitCost,
      })),
    });
  };

  const handleSaveDraft = () => {
    if (!selectedPurchase || selectedPurchase.status !== 'DRAFT') return;
    updateMutation.mutate({
      id: selectedPurchase.id,
      data: {
        supplier: formData.supplier || undefined,
        comment: formData.comment || undefined,
        items: formData.items.map((item) => ({
          productId: item.productId,
          qty: item.qty,
          unitCost: item.unitCost,
        })),
      },
    });
  };

  // Load purchase data into form when drawer opens
  useEffect(() => {
    if (selectedPurchase && drawerOpen) {
      setFormData({
        supplier: selectedPurchase.supplier || '',
        comment: selectedPurchase.comment || '',
        items:
          selectedPurchase.items.length > 0
            ? selectedPurchase.items.map((item) => ({
                productId: item.productId,
                qty: item.qty,
                unitCost: item.unitCost,
              }))
            : [{ productId: '', qty: 1, unitCost: 0 }],
      });
    }
  }, [selectedPurchase, drawerOpen]);

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
          <p className="mt-4 text-gray-600">Загрузка поставок...</p>
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
            <CardDescription>Не удалось загрузить поставки. Попробуйте обновить страницу.</CardDescription>
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
        <h1 className="text-3xl font-bold">Поставки</h1>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Создать поставку
        </Button>
      </div>

      {/* Status Filter */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex gap-2 flex-wrap">
            <Button
              variant={statusFilter === 'All' ? 'default' : 'outline'}
              onClick={() => setStatusFilter('All')}
            >
              Все
            </Button>
            <Button
              variant={statusFilter === 'DRAFT' ? 'default' : 'outline'}
              onClick={() => setStatusFilter('DRAFT')}
            >
              Черновики
            </Button>
            <Button
              variant={statusFilter === 'POSTED' ? 'default' : 'outline'}
              onClick={() => setStatusFilter('POSTED')}
            >
              Проведенные
            </Button>
            <Button
              variant={statusFilter === 'CANCELED' ? 'default' : 'outline'}
              onClick={() => setStatusFilter('CANCELED')}
            >
              Отмененные
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Purchases List */}
      <Card>
        <CardHeader>
          <CardTitle>Список поставок</CardTitle>
          <CardDescription>Всего: {data?.total ?? 0}</CardDescription>
        </CardHeader>
        <CardContent>
          {!data || data.items.length === 0 ? (
            <div className="text-center py-12 text-gray-500">Нет поставок</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Поставщик</TableHead>
                    <TableHead>Статус</TableHead>
                    <TableHead className="text-right">Товаров</TableHead>
                    <TableHead className="text-right">Сумма</TableHead>
                    <TableHead>Создана</TableHead>
                    <TableHead>Действия</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.items.map((purchase) => (
                    <TableRow key={purchase.id}>
                      <TableCell>{purchase.supplier || '-'}</TableCell>
                      <TableCell>
                        <Badge variant={statusVariants[purchase.status]}>
                          {statusLabels[purchase.status]}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">{purchase.itemsCount}</TableCell>
                      <TableCell className="text-right">{formatPrice(purchase.totalCost)}</TableCell>
                      <TableCell>
                        {new Date(purchase.createdAt).toLocaleDateString('ru-RU')}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleOpenDrawer(purchase.id)}
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            Открыть
                          </Button>
                          {purchase.status === 'DRAFT' && (
                            <>
                              <Button
                                size="sm"
                                variant="default"
                                onClick={() => handlePost(purchase.id)}
                              >
                                <CheckCircle className="w-4 h-4 mr-1" />
                                Провести
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => cancelMutation.mutate(purchase.id)}
                              >
                                <XCircle className="w-4 h-4 mr-1" />
                                Отменить
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Pagination */}
          {data && data.total > pageSize && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-gray-600">
                Страница {data.page} из {Math.ceil(data.total / data.pageSize)}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  disabled={data.page === 1}
                  onClick={() => setCurrentPage(data.page - 1)}
                >
                  Назад
                </Button>
                <Button
                  variant="outline"
                  disabled={data.page >= Math.ceil(data.total / data.pageSize)}
                  onClick={() => setCurrentPage(data.page + 1)}
                >
                  Вперед
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Purchase Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Создать поставку</DialogTitle>
            <DialogDescription>Добавьте товары в поставку</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Поставщик</Label>
              <Input
                value={formData.supplier}
                onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                placeholder="Название поставщика"
              />
            </div>
            <div>
              <Label>Комментарий</Label>
              <Textarea
                value={formData.comment}
                onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
                placeholder="Необязательный комментарий"
                rows={3}
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Товары</Label>
                <Button type="button" variant="outline" size="sm" onClick={handleAddItem}>
                  <Plus className="w-4 h-4 mr-1" />
                  Добавить
                </Button>
              </div>
              <div className="space-y-2 border rounded-md p-4 max-h-64 overflow-y-auto">
                {formData.items.map((item, index) => (
                  <div key={index} className="flex gap-2 items-end">
                    <div className="flex-1">
                      <Label className="text-xs">Товар</Label>
                      <select
                        className="w-full px-3 py-2 border rounded-md"
                        value={item.productId}
                        onChange={(e) => handleUpdateItem(index, 'productId', e.target.value)}
                      >
                        <option value="">Выберите товар</option>
                        {products?.items?.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.title}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="w-24">
                      <Label className="text-xs">Кол-во</Label>
                      <Input
                        type="number"
                        min="1"
                        value={item.qty}
                        onChange={(e) => handleUpdateItem(index, 'qty', parseInt(e.target.value) || 1)}
                      />
                    </div>
                    <div className="w-32">
                      <Label className="text-xs">Цена за ед.</Label>
                      <Input
                        type="number"
                        min="0"
                        value={item.unitCost}
                        onChange={(e) =>
                          handleUpdateItem(index, 'unitCost', parseInt(e.target.value) || 0)
                        }
                      />
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => handleRemoveItem(index)}
                      disabled={formData.items.length === 1}
                    >
                      ×
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              Отмена
            </Button>
            <Button onClick={handleCreate} disabled={createMutation.isPending}>
              {createMutation.isPending ? 'Создание...' : 'Создать'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Purchase Details Drawer */}
      <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
        <DrawerContent className="max-h-[90vh]">
          <DrawerHeader>
            <DrawerTitle>
              Поставка {selectedPurchase?.id.slice(0, 8)}
              {selectedPurchase && (
                <Badge variant={statusVariants[selectedPurchase.status]} className="ml-2">
                  {statusLabels[selectedPurchase.status]}
                </Badge>
              )}
            </DrawerTitle>
            <DrawerDescription>
              {selectedPurchase?.supplier || 'Без поставщика'}
            </DrawerDescription>
          </DrawerHeader>
          {isLoadingPurchase ? (
            <div className="p-4 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
          ) : selectedPurchase ? (
            <div className="p-4 space-y-4 overflow-y-auto">
              <div>
                <Label>Поставщик</Label>
                <Input
                  value={formData.supplier}
                  onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                  disabled={selectedPurchase.status !== 'DRAFT'}
                />
              </div>
              <div>
                <Label>Комментарий</Label>
                <Textarea
                  value={formData.comment}
                  onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
                  disabled={selectedPurchase.status !== 'DRAFT'}
                  rows={3}
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>Товары</Label>
                  {selectedPurchase.status === 'DRAFT' && (
                    <Button type="button" variant="outline" size="sm" onClick={handleAddItem}>
                      <Plus className="w-4 h-4 mr-1" />
                      Добавить
                    </Button>
                  )}
                </div>
                <div className="space-y-2 border rounded-md p-4">
                  {formData.items.map((item, index) => {
                    return (
                      <div key={index} className="flex gap-2 items-end">
                        <div className="flex-1">
                          <Label className="text-xs">Товар</Label>
                          <select
                            className="w-full px-3 py-2 border rounded-md"
                            value={item.productId}
                            onChange={(e) => handleUpdateItem(index, 'productId', e.target.value)}
                            disabled={selectedPurchase.status !== 'DRAFT'}
                          >
                            <option value="">Выберите товар</option>
                            {products?.items?.map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.title}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="w-24">
                          <Label className="text-xs">Кол-во</Label>
                          <Input
                            type="number"
                            min="1"
                            value={item.qty}
                            onChange={(e) => handleUpdateItem(index, 'qty', parseInt(e.target.value) || 1)}
                            disabled={selectedPurchase.status !== 'DRAFT'}
                          />
                        </div>
                        <div className="w-32">
                          <Label className="text-xs">Цена за ед.</Label>
                          <Input
                            type="number"
                            min="0"
                            value={item.unitCost}
                            onChange={(e) =>
                              handleUpdateItem(index, 'unitCost', parseInt(e.target.value) || 0)
                            }
                            disabled={selectedPurchase.status !== 'DRAFT'}
                          />
                        </div>
                        <div className="w-32">
                          <Label className="text-xs">Сумма</Label>
                          <div className="px-3 py-2 border rounded-md bg-gray-50">
                            {formatPrice(item.qty * item.unitCost)}
                          </div>
                        </div>
                        {selectedPurchase.status === 'DRAFT' && (
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() => handleRemoveItem(index)}
                            disabled={formData.items.length === 1}
                          >
                            ×
                          </Button>
                        )}
                      </div>
                    );
                  })}
                </div>
                <div className="mt-4 text-right font-semibold">
                  Итого: {formatPrice(
                    formData.items.reduce((sum, item) => sum + item.qty * item.unitCost, 0)
                  )}
                </div>
              </div>
            </div>
          ) : null}
          <DrawerFooter>
            {selectedPurchase?.status === 'DRAFT' && (
              <>
                <Button onClick={handleSaveDraft} disabled={updateMutation.isPending}>
                  Сохранить черновик
                </Button>
                <Button onClick={() => handlePost(selectedPurchase.id)}>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Провести поставку
                </Button>
              </>
            )}
            <Button variant="outline" onClick={handleCloseDrawer}>
              Закрыть
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      {/* Post Confirmation Dialog */}
      <AlertDialog open={postConfirmOpen} onOpenChange={setPostConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Провести поставку?</AlertDialogTitle>
            <AlertDialogDescription>
              После проведения будут созданы движения поступления товаров на склад. Это действие
              нельзя отменить.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={updateCostPrice}
                onChange={(e) => setUpdateCostPrice(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300"
              />
              <span className="text-sm">Обновить себестоимость товаров из этой поставки</span>
            </label>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmPost} disabled={postMutation.isPending}>
              {postMutation.isPending ? 'Проведение...' : 'Провести'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

