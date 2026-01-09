'use client';

import { FolderTree, Plus, Edit, Trash2 } from 'lucide-react';
// eslint-disable-next-line import/order
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
import { api, type Category } from '@/lib/api';

export default function AdminCategoriesPage(): JSX.Element {
  const { initData } = useTelegram();
  const queryClient = useQueryClient();
  const token = getTokenFromUrl();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<{ id: string; name: string; slug: string; sort: number } | null>(null);
  const [formData, setFormData] = useState({ name: '', slug: '', sort: 0 });

  // TEMP DEV ADMIN ACCESS - remove after Telegram WebApp enabled
  const isDevMode = !!token;

  const { data: categories, isLoading, error } = useQuery({
    queryKey: ['admin', 'categories', initData],
    queryFn: () => api.getAdminCategories(initData),
    enabled: !!initData || isDevMode,
    refetchOnWindowFocus: false,
  });

  const createMutation = useMutation({
    mutationFn: (data: { name: string; slug: string; sort: number }) =>
      api.createAdminCategory(initData, data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin', 'categories'] });
      setCreateDialogOpen(false);
      setFormData({ name: '', slug: '', sort: 0 });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { name?: string; slug?: string; sort?: number } }) =>
      api.updateAdminCategory(initData, id, data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin', 'categories'] });
      setEditDialogOpen(false);
      setSelectedCategory(null);
      setFormData({ name: '', slug: '', sort: 0 });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.deleteAdminCategory(initData, id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin', 'categories'] });
      setDeleteDialogOpen(false);
      setSelectedCategory(null);
    },
  });

  const handleCreate = () => {
    createMutation.mutate(formData);
  };

  const handleEdit = (category: Category) => {
    setSelectedCategory({
      id: category.id,
      name: category.name,
      slug: category.slug,
      sort: category.sort ?? 0, // Normalize to 0 if undefined (defensive programming)
    });
    setFormData({ name: category.name, slug: category.slug, sort: category.sort ?? 0 });
    setEditDialogOpen(true);
  };

  const handleUpdate = () => {
    if (selectedCategory) {
      updateMutation.mutate({ id: selectedCategory.id, data: formData });
    }
  };

  const handleDelete = (category: Category) => {
    setSelectedCategory({
      id: category.id,
      name: category.name,
      slug: category.slug,
      sort: category.sort ?? 0,
    });
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (selectedCategory) {
      deleteMutation.mutate(selectedCategory.id);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
          <p className="mt-4 text-gray-600">Загрузка категорий...</p>
        </div>
      </div>
    );
  }

  if (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStatus = (error as { statusCode?: number })?.statusCode;
    const isForbidden = errorStatus === 403;
    
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-foreground">Ошибка</CardTitle>
            <CardDescription className="text-muted-foreground">
              {isForbidden
                ? 'Доступ запрещен. Только администраторы могут управлять категориями.'
                : 'Не удалось загрузить категории. Попробуйте обновить страницу.'}
            </CardDescription>
          </CardHeader>
          {isDevMode && !isForbidden && (
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

  const categoriesList = categories || [];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-foreground">Категории</h1>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Создать категорию
        </Button>
      </div>

      {categoriesList.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FolderTree className="w-16 h-16 text-gray-400 mb-4" />
            <p className="text-gray-600 text-lg mb-2">Категории отсутствуют</p>
            <p className="text-gray-500 text-sm mb-4">Создайте первую категорию для организации товаров</p>
            <Button onClick={() => setCreateDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Создать категорию
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-foreground">Список категорий</CardTitle>
            <CardDescription className="text-muted-foreground">
              Всего категорий: {categoriesList.length}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-foreground">Название</TableHead>
                  <TableHead className="text-foreground">Slug</TableHead>
                  <TableHead className="text-foreground">Сортировка</TableHead>
                  <TableHead className="text-right text-foreground">Действия</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categoriesList.map((category) => (
                  <TableRow key={category.id}>
                    <TableCell className="font-medium text-foreground">{category.name}</TableCell>
                    <TableCell className="text-muted-foreground font-mono text-sm">{category.slug}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{category.sort}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(category)}
                        >
                          <Edit className="w-4 h-4 mr-1" />
                          Изменить
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDelete(category)}
                        >
                          <Trash2 className="w-4 h-4 mr-1" />
                          Удалить
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Create Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Создать категорию</DialogTitle>
            <DialogDescription>
              Заполните форму для создания новой категории товаров.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium text-foreground">Название</label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Например: Футболки"
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Slug</label>
              <Input
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                placeholder="Например: t-shirts"
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Сортировка</label>
              <Input
                type="number"
                value={formData.sort}
                onChange={(e) => setFormData({ ...formData, sort: parseInt(e.target.value) || 0 })}
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              Отмена
            </Button>
            <Button
              onClick={handleCreate}
              disabled={!formData.name || !formData.slug || createMutation.isPending}
            >
              {createMutation.isPending ? 'Создание...' : 'Создать'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Изменить категорию</DialogTitle>
            <DialogDescription>
              Обновите информацию о категории.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium text-foreground">Название</label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Slug</label>
              <Input
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Сортировка</label>
              <Input
                type="number"
                value={formData.sort}
                onChange={(e) => setFormData({ ...formData, sort: parseInt(e.target.value) || 0 })}
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Отмена
            </Button>
            <Button
              onClick={handleUpdate}
              disabled={!formData.name || !formData.slug || updateMutation.isPending}
            >
              {updateMutation.isPending ? 'Сохранение...' : 'Сохранить'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Удалить категорию?</DialogTitle>
            <DialogDescription>
              Вы уверены, что хотите удалить категорию &quot;{selectedCategory?.name}&quot;?
              {selectedCategory && ' Это действие нельзя отменить.'}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Отмена
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? 'Удаление...' : 'Удалить'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
