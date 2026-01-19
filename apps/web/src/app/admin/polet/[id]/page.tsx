'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Plus, Check, Package, Warehouse, Box, Trash2, ExternalLink, Save, X } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';

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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
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
import { useTelegram } from '@/hooks/useTelegram';
import { getTokenFromUrl } from '@/lib/admin-nav';
import { api, type CreatePoziciyaDto } from '@/lib/api';
import { formatPrice } from '@/lib/utils';

const statusLabels: Record<string, string> = {
  DRAFT: 'Черновик',
  RECEIVED: 'Получен',
  DISASSEMBLED: 'Разобран',
  POSTED: 'Проведен',
  CANCELED: 'Отменен',
};

const statusVariants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  DRAFT: 'secondary',
  RECEIVED: 'default',
  DISASSEMBLED: 'outline',
  POSTED: 'outline',
  CANCELED: 'destructive',
};

export default function AdminPoletDetailPage(): JSX.Element {
  const router = useRouter();
  const params = useParams();
  const poletId = params.id as string;
  const { initData } = useTelegram();
  const queryClient = useQueryClient();
  const token = getTokenFromUrl();
  const [addPoziciyaDialogOpen, setAddPoziciyaDialogOpen] = useState(false);
  const [deleteProductDialogOpen, setDeleteProductDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<{ productId: string; poziciyaId: string } | null>(null);
  const [editingProduct, setEditingProduct] = useState<{ productId: string; price: number } | null>(null);
  const [poziciyaFormData, setPoziciyaFormData] = useState<CreatePoziciyaDto>({
    nazvanie: '',
    kolichestvo: 1,
  });

  const isDevMode = !!token;

  const { data: polet, isLoading, error } = useQuery({
    queryKey: ['admin', 'polet', poletId, initData],
    queryFn: () => api.getAdminPolet(initData, poletId),
    enabled: !!poletId && (!!initData || isDevMode),
  });

  const addPoziciyaMutation = useMutation({
    mutationFn: (data: CreatePoziciyaDto) => api.addPoziciya(initData, poletId, data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin', 'polet', poletId] });
      setAddPoziciyaDialogOpen(false);
      setPoziciyaFormData({
        nazvanie: '',
        kolichestvo: 1,
      });
    },
  });

  const poluchenMutation = useMutation({
    mutationFn: () => api.poluchenPolet(initData, poletId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin', 'polet', poletId] });
    },
  });

  const razobratMutation = useMutation({
    mutationFn: () => api.razobratPolet(initData, poletId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin', 'polet', poletId] });
    },
  });

  const sozdatTovarMutation = useMutation({
    mutationFn: (poziciyaId: string) => api.sozdatTovar(initData, poletId, poziciyaId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin', 'polet', poletId] });
    },
  });

  const provestiMutation = useMutation({
    mutationFn: () => api.provestiPolet(initData, poletId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin', 'polet', poletId] });
    },
  });

  const updateProductMutation = useMutation({
    mutationFn: ({ productId, price }: { productId: string; price: number }) =>
      api.updateAdminProduct(initData, productId, { price }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin', 'polet', poletId] });
      setEditingProduct(null);
    },
  });

  const deleteProductMutation = useMutation({
    mutationFn: (productId: string) => api.deleteAdminProduct(initData, productId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin', 'polet', poletId] });
      setDeleteProductDialogOpen(false);
      setProductToDelete(null);
    },
  });

  const handleEditProduct = (productId: string, currentPrice: number) => {
    setEditingProduct({ productId, price: currentPrice });
  };

  const handleSaveProduct = () => {
    if (editingProduct) {
      updateProductMutation.mutate(editingProduct);
    }
  };

  const handleDeleteProduct = (productId: string, poziciyaId: string) => {
    setProductToDelete({ productId, poziciyaId });
    setDeleteProductDialogOpen(true);
  };

  const confirmDeleteProduct = () => {
    if (productToDelete) {
      deleteProductMutation.mutate(productToDelete.productId);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Загрузка...</div>
      </div>
    );
  }

  if (error || !polet) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center text-red-600">
          Ошибка загрузки паллеты
          {error instanceof Error && (
            <div className="mt-2 text-sm text-muted-foreground">{error.message}</div>
          )}
        </div>
        <Button onClick={() => router.push('/admin/polet')} className="mt-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Назад к списку
        </Button>
      </div>
    );
  }

  const canPoluchen = polet.status === 'DRAFT';
  const canAddPoziciya = polet.status === 'RECEIVED';
  const canRazobrat = polet.status === 'RECEIVED' && polet.pozicii.length > 0;
  const canSozdatTovar = polet.status === 'DISASSEMBLED';
  const canProvesti = polet.status === 'DISASSEMBLED' && polet.pozicii.some((p) => p.tovarId);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Button variant="ghost" onClick={() => router.push('/admin/polet')} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Назад к списку
        </Button>
        <h1 className="text-3xl font-bold">{polet.nazvanie}</h1>
        <div className="flex items-center gap-2 mt-2">
          <Badge variant={statusVariants[polet.status] || 'secondary'}>
            {statusLabels[polet.status] || polet.status}
          </Badge>
          {polet.primernoeKolvo && (
            <span className="text-muted-foreground">Примерное кол-во: {polet.primernoeKolvo}</span>
          )}
        </div>
        {polet.status === 'DRAFT' && (
          <p className="text-sm text-muted-foreground mt-2">
            💡 Состав паллеты определяется после получения
          </p>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-2 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Сводка</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Цена паллеты:</span>
              <span className="font-medium">{formatPrice(polet.cenaPoletaRub)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Доставка:</span>
              <span className="font-medium">{formatPrice(polet.dostavkaRub)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Прочие расходы:</span>
              <span className="font-medium">{formatPrice(polet.prochieRashodyRub)}</span>
            </div>
            <div className="flex justify-between pt-2 border-t">
              <span className="font-semibold">Итого:</span>
              <span className="font-bold text-lg">{formatPrice(polet.obshayaSummaRub)}</span>
            </div>
            {polet.status === 'RECEIVED' && polet.pozicii.length > 0 && (
              <div className="flex justify-between pt-2 border-t">
                <span className="text-muted-foreground">Себестоимость на единицу:</span>
                <span className="font-medium">
                  {formatPrice(polet.pozicii[0]?.sebestoimostItogoRub || 0)}
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Действия</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {canPoluchen && (
              <Button
                onClick={() => poluchenMutation.mutate()}
                disabled={poluchenMutation.isPending}
                className="w-full"
              >
                <Check className="w-4 h-4 mr-2" />
                {poluchenMutation.isPending ? 'Отметка...' : 'Получен'}
              </Button>
            )}
            {canAddPoziciya && (
              <Button
                onClick={() => setAddPoziciyaDialogOpen(true)}
                className="w-full"
                variant="outline"
              >
                <Plus className="w-4 h-4 mr-2" />
                Добавить позицию
              </Button>
            )}
            {canRazobrat && (
              <Button
                onClick={() => razobratMutation.mutate()}
                disabled={razobratMutation.isPending}
                className="w-full"
                variant="outline"
              >
                <Box className="w-4 h-4 mr-2" />
                {razobratMutation.isPending ? 'Разборка...' : 'Разобрать'}
              </Button>
            )}
            {canProvesti && (
              <Button
                onClick={() => provestiMutation.mutate()}
                disabled={provestiMutation.isPending}
                className="w-full"
              >
                <Warehouse className="w-4 h-4 mr-2" />
                {provestiMutation.isPending ? 'Проведение...' : 'Провести на склад'}
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      {polet.status === 'RECEIVED' || polet.status === 'DISASSEMBLED' || polet.status === 'POSTED' ? (
        <Card>
          <CardHeader>
            <CardTitle>Позиции паллеты</CardTitle>
            <CardDescription>
              {polet.pozicii.length} {polet.pozicii.length === 1 ? 'позиция' : 'позиций'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Название позиции</TableHead>
                  <TableHead className="text-right">Кол-во</TableHead>
                  <TableHead className="text-right">Себестоимость за 1 шт</TableHead>
                  <TableHead className="text-right">Итоговая себестоимость</TableHead>
                  <TableHead>Товар</TableHead>
                  {canSozdatTovar && <TableHead className="text-right">Действия</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {polet.pozicii.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={canSozdatTovar ? 6 : 5} className="text-center text-muted-foreground">
                      Нет позиций. Добавьте первую позицию после получения паллеты.
                    </TableCell>
                  </TableRow>
                ) : (
                  polet.pozicii.map((poz) => (
                    <TableRow key={poz.id}>
                      <TableCell className="font-medium">{poz.nazvanie}</TableCell>
                      <TableCell className="text-right">{poz.kolichestvo}</TableCell>
                      <TableCell className="text-right">
                        {formatPrice(poz.sebestoimostItogoRub)}
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        {formatPrice(poz.sebestoimostItogoRub * poz.kolichestvo)}
                      </TableCell>
                      <TableCell>
                        {poz.tovar ? (
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <Button
                                variant="link"
                                size="sm"
                                className="h-auto p-0 font-medium"
                                onClick={() => router.push(`/admin/products/${poz.tovar?.id}/edit`)}
                              >
                                {poz.tovar.title}
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0"
                                onClick={() => router.push(`/admin/products/${poz.tovar?.id}/edit`)}
                              >
                                <ExternalLink className="w-3 h-3" />
                              </Button>
                            </div>
                            <div className="text-xs text-muted-foreground space-y-1">
                              <div>Цена продажи: {editingProduct?.productId === poz.tovar.id ? (
                                <div className="flex items-center gap-1 mt-1">
                                  <Input
                                    type="number"
                                    value={editingProduct.price}
                                    onChange={(e) => setEditingProduct({ ...editingProduct, price: parseInt(e.target.value) || 0 })}
                                    className="h-6 w-24 text-xs"
                                  />
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-6 w-6 p-0"
                                    onClick={handleSaveProduct}
                                    disabled={updateProductMutation.isPending}
                                  >
                                    <Save className="w-3 h-3" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-6 w-6 p-0"
                                    onClick={() => setEditingProduct(null)}
                                  >
                                    <X className="w-3 h-3" />
                                  </Button>
                                </div>
                              ) : (
                                <span className="font-medium">{formatPrice(poz.tovar.price)}</span>
                              )}
                              </div>
                              <div>На складе: <span className="font-medium">{poz.tovar.stock}</span></div>
                              <div>Статус: <span className="font-medium">
                                {poz.tovar.status === 'ACTIVE' ? 'Активен' : poz.tovar.status === 'DRAFT' ? 'Черновик' : 'Архив'}
                              </span></div>
                            </div>
                            <div className="flex items-center gap-1 mt-2">
                              {editingProduct?.productId !== poz.tovar.id && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-6 text-xs"
                                  onClick={() => handleEditProduct(poz.tovar.id, poz.tovar.price)}
                                >
                                  Изменить цену
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
                                onClick={() => handleDeleteProduct(poz.tovar.id, poz.id)}
                                disabled={deleteProductMutation.isPending}
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <span className="text-muted-foreground text-sm">Товар не создан</span>
                            {canSozdatTovar && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => sozdatTovarMutation.mutate(poz.id)}
                                disabled={sozdatTovarMutation.isPending}
                              >
                                <Package className="w-4 h-4 mr-1" />
                                Создать товар
                              </Button>
                            )}
                          </div>
                        )}
                      </TableCell>
                      {canSozdatTovar && !poz.tovar && (
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => sozdatTovarMutation.mutate(poz.id)}
                            disabled={sozdatTovarMutation.isPending}
                          >
                            <Package className="w-4 h-4 mr-1" />
                            Создать товар
                          </Button>
                        </TableCell>
                      )}
                      {!canSozdatTovar && !poz.tovar && (
                        <TableCell className="text-right">-</TableCell>
                      )}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              Позиции появятся после отметки паллеты как «Получен»
            </p>
          </CardContent>
        </Card>
      )}

      <Dialog open={addPoziciyaDialogOpen} onOpenChange={setAddPoziciyaDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Добавить позицию</DialogTitle>
            <DialogDescription>
              Себестоимость будет рассчитана автоматически на основе общей суммы паллеты
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="poziciya-nazvanie">Название *</Label>
              <Input
                id="poziciya-nazvanie"
                value={poziciyaFormData.nazvanie}
                onChange={(e) => setPoziciyaFormData({ ...poziciyaFormData, nazvanie: e.target.value })}
                placeholder="Название товара"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="poziciya-kolichestvo">Количество *</Label>
              <Input
                id="poziciya-kolichestvo"
                type="number"
                value={poziciyaFormData.kolichestvo}
                onChange={(e) =>
                  setPoziciyaFormData({ ...poziciyaFormData, kolichestvo: parseInt(e.target.value) || 1 })
                }
                min="1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddPoziciyaDialogOpen(false)}>
              Отмена
            </Button>
            <Button
              onClick={() => addPoziciyaMutation.mutate(poziciyaFormData)}
              disabled={addPoziciyaMutation.isPending || !poziciyaFormData.nazvanie.trim()}
            >
              {addPoziciyaMutation.isPending ? 'Добавление...' : 'Добавить'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteProductDialogOpen} onOpenChange={setDeleteProductDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить товар?</AlertDialogTitle>
            <AlertDialogDescription>
              Товар будет архивирован (мягкое удаление) и скрыт из публичного каталога. Это действие можно отменить позже.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteProduct}
              disabled={deleteProductMutation.isPending}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteProductMutation.isPending ? 'Удаление...' : 'Удалить'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
