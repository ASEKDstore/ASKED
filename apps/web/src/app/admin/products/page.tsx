'use client';

import { Package, Plus, Edit, Archive, Search } from 'lucide-react';
// eslint-disable-next-line import/order
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
// eslint-disable-next-line import/order
import { useRouter } from 'next/navigation';
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
import { Input } from '@/components/ui/input';
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
import { addTokenToUrl, getTokenFromUrl } from '@/lib/admin-nav';
import { api } from '@/lib/api';
import { formatPrice } from '@/lib/utils';

const statusLabels: Record<string, string> = {
  DRAFT: 'Черновик',
  ACTIVE: 'Активен',
  ARCHIVED: 'Архив',
};

const statusVariants: Record<string, 'default' | 'secondary' | 'destructive'> = {
  DRAFT: 'secondary',
  ACTIVE: 'default',
  ARCHIVED: 'destructive',
};

export default function AdminProductsPage(): JSX.Element {
  const router = useRouter();
  const { initData } = useTelegram();
  const queryClient = useQueryClient();
  const token = getTokenFromUrl();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [archiveDialogOpen, setArchiveDialogOpen] = useState(false);
  const [productToArchive, setProductToArchive] = useState<string | null>(null);

  // TEMP DEV ADMIN ACCESS - remove after Telegram WebApp enabled
  // In dev mode, initData might be null, but we still want to load data
  const isDevMode = !!token;

  const { data, isLoading, error } = useQuery({
    queryKey: ['admin', 'products', initData, searchQuery, statusFilter],
    queryFn: () =>
      api.getAdminProducts(initData, {
        q: searchQuery || undefined,
        status: statusFilter !== 'All' ? (statusFilter as 'DRAFT' | 'ACTIVE' | 'ARCHIVED') : undefined,
        page: 1,
        pageSize: 50,
      }),
    enabled: !!initData || isDevMode,
    staleTime: 0, // Admin data should always be fresh
    refetchOnWindowFocus: true, // Refresh admin data on focus
    keepPreviousData: true, // Prevent flicker when filtering
  });

  const archiveMutation = useMutation({
    mutationFn: (id: string) => api.deleteAdminProduct(initData, id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin', 'products'] });
      await queryClient.refetchQueries({ queryKey: ['admin', 'products'] });
      setArchiveDialogOpen(false);
      setProductToArchive(null);
    },
  });

  const handleArchive = (id: string) => {
    setProductToArchive(id);
    setArchiveDialogOpen(true);
  };

  const confirmArchive = () => {
    if (productToArchive) {
      archiveMutation.mutate(productToArchive);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
          <p className="mt-4 text-gray-600">Загрузка товаров...</p>
        </div>
      </div>
    );
  }

  if (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStatus = (error as { statusCode?: number })?.statusCode;
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Ошибка</CardTitle>
            <CardDescription>
              Не удалось загрузить товары. Попробуйте обновить страницу.
            </CardDescription>
          </CardHeader>
          {isDevMode && (
            <CardContent>
              <div className="text-sm text-red-600">
                Debug: {errorStatus ? `[${errorStatus}]` : ''} {errorMessage}
              </div>
            </CardContent>
          )}
        </Card>
      </div>
    );
  }

  // Parse response: support both array and object formats
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let products: any[] = [];
  let total = 0;
  
  if (data) {
    if (Array.isArray(data)) {
      // Format A: array response
      products = data;
      total = data.length;
    } else if (data.items && Array.isArray(data.items)) {
      // Format B: object with items
      products = data.items;
      total = data.total ?? data.items.length;
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Товары</h1>
        <Button onClick={() => router.push(addTokenToUrl('/admin/products/new', token))}>
          <Plus className="w-4 h-4 mr-2" />
          Создать товар
        </Button>
      </div>

      {/* TEMP DEBUG - remove after Telegram WebApp enabled */}
      {isDevMode && (
        <Card className="mb-4 bg-gray-100 border-gray-300">
          <CardContent className="pt-4">
            <div className="text-sm font-mono">
              Debug: Loaded products: {products.length} / total: {total}
              {error && (
                <span>
                  {' '}
                  | Error:{' '}
                  {String(error)}
                </span>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Фильтры</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Поиск по названию..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-48"
            >
              <option value="All">Все статусы</option>
              <option value="DRAFT">Черновик</option>
              <option value="ACTIVE">Активен</option>
              <option value="ARCHIVED">Архив</option>
            </Select>
          </div>
        </CardContent>
      </Card>

      {products.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Package className="w-16 h-16 text-gray-400 mb-4" />
            <p className="text-gray-600 text-lg mb-2">Товары отсутствуют</p>
            <p className="text-gray-500 text-sm mb-4">
              {searchQuery || statusFilter !== 'All'
                ? 'Попробуйте изменить параметры поиска'
                : 'Добавьте товары через кнопку "Создать товар"'}
            </p>
            {!searchQuery && statusFilter === 'All' && (
              <Button onClick={() => router.push(addTokenToUrl('/admin/products/new', token))}>
                <Plus className="w-4 h-4 mr-2" />
                Создать товар
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Список товаров</CardTitle>
            <CardDescription>
              Всего товаров: {total}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Updated</TableHead>
                  <TableHead className="text-right">Действия</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell className="font-medium">{product.title}</TableCell>
                    <TableCell>{formatPrice(product.price)}</TableCell>
                    <TableCell>
                      <Badge
                        variant={statusVariants[product.status] || 'default'}
                      >
                        {statusLabels[product.status] || product.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {product.updatedAt
                        ? new Date(product.updatedAt).toLocaleDateString('ru-RU', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                          })
                        : '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => router.push(addTokenToUrl(`/admin/products/${product.id}/edit`, token))}
                        >
                          <Edit className="w-4 h-4 mr-1" />
                          Редактировать
                        </Button>
                        {product.status !== 'ARCHIVED' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleArchive(product.id)}
                          >
                            <Archive className="w-4 h-4 mr-1" />
                            Архивировать
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <Dialog open={archiveDialogOpen} onOpenChange={setArchiveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Архивировать товар?</DialogTitle>
            <DialogDescription>
              Товар будет перемещен в архив. Вы сможете восстановить его позже.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setArchiveDialogOpen(false)}>
              Отмена
            </Button>
            <Button
              variant="destructive"
              onClick={confirmArchive}
              disabled={archiveMutation.isPending}
            >
              {archiveMutation.isPending ? 'Архивирование...' : 'Архивировать'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
