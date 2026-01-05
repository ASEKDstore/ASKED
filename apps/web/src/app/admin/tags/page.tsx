'use client';

import { Tag as TagIcon, Plus, Edit, Trash2 } from 'lucide-react';
import { useState } from 'react';
// eslint-disable-next-line import/order
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

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
import { api, type Tag } from '@/lib/api';

export default function AdminTagsPage(): JSX.Element {
  const { initData } = useTelegram();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingTag, setEditingTag] = useState<Tag | null>(null);
  const [deletingTag, setDeletingTag] = useState<Tag | null>(null);
  const [formData, setFormData] = useState({ name: '', slug: '' });

  const { data, isLoading, error } = useQuery({
    queryKey: ['admin', 'tags', initData],
    queryFn: () => api.getAdminTags(initData),
    enabled: !!initData,
  });

  const createMutation = useMutation({
    mutationFn: (data: { name: string; slug: string }) =>
      api.createAdminTag(initData, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'tags'] });
      setDialogOpen(false);
      resetForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { name?: string; slug?: string } }) =>
      api.updateAdminTag(initData, id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'tags'] });
      setDialogOpen(false);
      setEditingTag(null);
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.deleteAdminTag(initData, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'tags'] });
      setDeleteDialogOpen(false);
      setDeletingTag(null);
    },
  });

  const resetForm = () => {
    setFormData({ name: '', slug: '' });
    setEditingTag(null);
  };

  const handleCreate = () => {
    resetForm();
    setDialogOpen(true);
  };

  const handleEdit = (tag: Tag) => {
    setEditingTag(tag);
    setFormData({
      name: tag.name,
      slug: tag.slug,
    });
    setDialogOpen(true);
  };

  const handleDelete = (tag: Tag) => {
    setDeletingTag(tag);
    setDeleteDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingTag) {
      updateMutation.mutate({
        id: editingTag.id,
        data: {
          name: formData.name,
          slug: formData.slug,
        },
      });
    } else {
      createMutation.mutate({
        name: formData.name,
        slug: formData.slug,
      });
    }
  };

  const confirmDelete = () => {
    if (deletingTag) {
      deleteMutation.mutate(deletingTag.id);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
          <p className="mt-4 text-gray-600">Загрузка тегов...</p>
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
              Не удалось загрузить теги. Попробуйте обновить страницу.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const tags = data || [];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Теги</h1>
        <Button onClick={handleCreate}>
          <Plus className="w-4 h-4 mr-2" />
          Создать тег
        </Button>
      </div>

      {tags.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <TagIcon className="w-16 h-16 text-gray-400 mb-4" />
            <p className="text-gray-600 text-lg mb-2">Теги отсутствуют</p>
            <p className="text-gray-500 text-sm mb-4">
              Добавьте теги через кнопку &quot;Создать тег&quot;
            </p>
            <Button onClick={handleCreate}>
              <Plus className="w-4 h-4 mr-2" />
              Создать тег
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Список тегов</CardTitle>
            <CardDescription>Всего тегов: {tags.length}</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Название</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead className="text-right">Действия</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tags.map((tag) => (
                  <TableRow key={tag.id}>
                    <TableCell className="font-medium">{tag.name}</TableCell>
                    <TableCell className="font-mono text-sm">{tag.slug}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(tag)}
                        >
                          <Edit className="w-4 h-4 mr-1" />
                          Редактировать
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(tag)}
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

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingTag ? 'Редактировать тег' : 'Создать тег'}</DialogTitle>
            <DialogDescription>
              {editingTag ? 'Измените данные тега' : 'Заполните данные для нового тега'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Название <span className="text-red-500">*</span>
                </label>
                <Input
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Название тега"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Slug <span className="text-red-500">*</span>
                </label>
                <Input
                  required
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  placeholder="tag-slug"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setDialogOpen(false);
                  resetForm();
                }}
              >
                Отмена
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {createMutation.isPending || updateMutation.isPending
                  ? 'Сохранение...'
                  : editingTag
                    ? 'Сохранить'
                    : 'Создать'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Удалить тег?</DialogTitle>
            <DialogDescription>
              Вы уверены, что хотите удалить тег &quot;{deletingTag?.name}&quot;?
              {deletingTag && (
                <span className="block mt-2 text-red-600">
                  Внимание: Удаление невозможно, если тег используется в товарах.
                </span>
              )}
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

