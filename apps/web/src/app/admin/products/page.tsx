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
  const { initData } = useTelegram();

  const { data, isLoading, error } = useQuery({
    queryKey: ['admin', 'products', initData],
    queryFn: () => api.getAdminProducts(initData),
    enabled: !!initData,
  });

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
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Ошибка</CardTitle>
            <CardDescription>
              Не удалось загрузить товары. Попробуйте обновить страницу.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (!data || data.items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Товары</h1>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Package className="w-16 h-16 text-gray-400 mb-4" />
            <p className="text-gray-600 text-lg mb-2">Товары отсутствуют</p>
            <p className="text-gray-500 text-sm">
              Добавьте товары через админ-панель
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Товары</h1>

      <Card>
        <CardHeader>
          <CardTitle>Список товаров</CardTitle>
          <CardDescription>
            Всего товаров: {data.meta.total}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Название</TableHead>
                <TableHead>Цена</TableHead>
                <TableHead>Остаток</TableHead>
                <TableHead>Статус</TableHead>
                <TableHead>Категории</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.items.map((product) => (
                <TableRow key={product.id}>
                  <TableCell className="font-medium">{product.title}</TableCell>
                  <TableCell>{formatPrice(product.price)}</TableCell>
                  <TableCell>{product.stock} шт.</TableCell>
                  <TableCell>
                    <Badge
                      variant={statusVariants[product.status] || 'default'}
                    >
                      {statusLabels[product.status] || product.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1 flex-wrap">
                      {product.categories.slice(0, 2).map((cat) => (
                        <Badge key={cat.id} variant="secondary" className="text-xs">
                          {cat.name}
                        </Badge>
                      ))}
                      {product.categories.length > 2 && (
                        <Badge variant="secondary" className="text-xs">
                          +{product.categories.length - 2}
                        </Badge>
                      )}
                    </div>
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

