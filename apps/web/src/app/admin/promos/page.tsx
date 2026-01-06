'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FileText, Plus, Edit, X, ChevronUp, ChevronDown } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Alert } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useTelegram } from '@/hooks/useTelegram';
import { getTokenFromUrl } from '@/lib/admin-nav';
import {
  api,
  type Promo,
  type CreatePromoDto,
  type UpdatePromoDto,
} from '@/lib/api';

export default function AdminPromosPage(): JSX.Element {
  const { initData } = useTelegram();
  const queryClient = useQueryClient();
  const token = getTokenFromUrl();
  const isDevMode = !!token;
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingPromo, setEditingPromo] = useState<Promo | null>(null);
  const [deletingPromo, setDeletingPromo] = useState<Promo | null>(null);
  const [formData, setFormData] = useState<CreatePromoDto>({
    slug: '',
    title: '',
    description: '',
    isActive: true,
    ctaType: 'URL',
    ctaText: 'Посмотреть',
    ctaUrl: '',
    media: [],
  });
  const [mediaInputs, setMediaInputs] = useState<Array<{ mediaType: 'IMAGE' | 'VIDEO'; mediaUrl: string; sort: number }>>([
    { mediaType: 'IMAGE', mediaUrl: '', sort: 0 },
  ]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ['admin', 'promos', initData],
    queryFn: () => api.getAdminPromos(initData),
    enabled: !!initData || isDevMode,
  });

  const createMutation = useMutation({
    mutationFn: (data: CreatePromoDto) => {
      if (process.env.NODE_ENV === 'development') {
        console.log('[CREATE]', {
          endpoint: '/admin/promos',
          hasDevToken: !!token,
        });
      }
      return api.createAdminPromo(initData, data);
    },
    onSuccess: async (createdPromo) => {
      await queryClient.invalidateQueries({ queryKey: ['admin', 'promos'] });
      await queryClient.refetchQueries({ queryKey: ['admin', 'promos'] });
      setDialogOpen(false);
      resetForm();
      setErrorMessage(null);
      if (typeof window !== 'undefined') {
        window.alert(`Создано: ${createdPromo.title} (${createdPromo.slug})`);
      }
    },
    onError: (error: Error) => {
      setErrorMessage(error.message || 'Ошибка при создании промо-страницы');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdatePromoDto }) =>
      api.updateAdminPromo(initData, id, data),
    onSuccess: async (updatedPromo) => {
      await queryClient.invalidateQueries({ queryKey: ['admin', 'promos'] });
      await queryClient.refetchQueries({ queryKey: ['admin', 'promos'] });
      setDialogOpen(false);
      setEditingPromo(null);
      resetForm();
      setErrorMessage(null);
      if (typeof window !== 'undefined') {
        window.alert(`Обновлено: ${updatedPromo.title} (${updatedPromo.slug})`);
      }
    },
    onError: (error: Error) => {
      setErrorMessage(error.message || 'Ошибка при обновлении промо-страницы');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.deleteAdminPromo(initData, id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin', 'promos'] });
      await queryClient.refetchQueries({ queryKey: ['admin', 'promos'] });
      setDeleteDialogOpen(false);
      setDeletingPromo(null);
      if (typeof window !== 'undefined') {
        window.alert('Промо-страница отключена');
      }
    },
  });

  const resetForm = () => {
    setFormData({
      slug: '',
      title: '',
      description: '',
      isActive: true,
      ctaType: 'URL',
      ctaText: 'Посмотреть',
      ctaUrl: '',
      media: [],
    });
    setMediaInputs([{ mediaType: 'IMAGE', mediaUrl: '', sort: 0 }]);
    setEditingPromo(null);
  };

  const handleCreate = () => {
    resetForm();
    setDialogOpen(true);
  };

  const handleEdit = (promo: Promo) => {
    setEditingPromo(promo);
    setFormData({
      slug: promo.slug,
      title: promo.title,
      description: promo.description || '',
      isActive: promo.isActive,
      ctaType: promo.ctaType,
      ctaText: promo.ctaText || 'Посмотреть',
      ctaUrl: promo.ctaUrl || '',
      media: [],
    });
    if (promo.media && promo.media.length > 0) {
      const sortedMedia = [...promo.media].sort((a, b) => a.sort - b.sort);
      setMediaInputs(
        sortedMedia.map((m, idx) => ({
          mediaType: m.mediaType,
          mediaUrl: m.mediaUrl,
          sort: idx,
        }))
      );
    } else {
      setMediaInputs([{ mediaType: 'IMAGE', mediaUrl: '', sort: 0 }]);
    }
    setDialogOpen(true);
  };

  const handleDelete = (promo: Promo) => {
    setDeletingPromo(promo);
    setDeleteDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    const media = mediaInputs
      .filter((m) => m.mediaUrl.trim())
      .map((m, idx) => ({
        mediaType: m.mediaType,
        mediaUrl: m.mediaUrl.trim(),
        sort: idx,
      }));

    const submitData: CreatePromoDto | UpdatePromoDto = {
      ...formData,
      description: formData.description || null,
      ctaText: formData.ctaText || null,
      ctaUrl: formData.ctaUrl || null,
      media: media.length > 0 ? media : undefined,
    };

    if (editingPromo) {
      updateMutation.mutate({
        id: editingPromo.id,
        data: submitData,
      });
    } else {
      createMutation.mutate(submitData as CreatePromoDto);
    }
  };

  const confirmDelete = () => {
    if (deletingPromo) {
      deleteMutation.mutate(deletingPromo.id);
    }
  };

  const addMediaInput = () => {
    setMediaInputs([...mediaInputs, { mediaType: 'IMAGE', mediaUrl: '', sort: mediaInputs.length }]);
  };

  const removeMediaInput = (index: number) => {
    const updated = mediaInputs.filter((_, i) => i !== index);
    setMediaInputs(updated.map((m, idx) => ({ ...m, sort: idx })));
  };

  const updateMediaInput = (
    index: number,
    field: 'mediaType' | 'mediaUrl',
    value: string
  ) => {
    const updated = [...mediaInputs];
    updated[index] = { ...updated[index], [field]: value };
    setMediaInputs(updated);
  };

  const moveMediaUp = (index: number) => {
    if (index === 0) return;
    const updated = [...mediaInputs];
    [updated[index - 1], updated[index]] = [updated[index], updated[index - 1]];
    setMediaInputs(updated.map((m, idx) => ({ ...m, sort: idx })));
  };

  const moveMediaDown = (index: number) => {
    if (index === mediaInputs.length - 1) return;
    const updated = [...mediaInputs];
    [updated[index], updated[index + 1]] = [updated[index + 1], updated[index]];
    setMediaInputs(updated.map((m, idx) => ({ ...m, sort: idx })));
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
          <p className="mt-4 text-gray-600">Загрузка промо-страниц...</p>
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
              Не удалось загрузить промо-страницы. Попробуйте обновить страницу.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const promos = data || [];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Промо-страницы</h1>
        <Button onClick={handleCreate}>
          <Plus className="w-4 h-4 mr-2" />
          Создать промо-страницу
        </Button>
      </div>

      {errorMessage && (
        <Alert variant="destructive" className="mb-6">
          {errorMessage}
        </Alert>
      )}

      {promos.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="w-16 h-16 text-gray-400 mb-4" />
            <p className="text-gray-600 text-lg mb-2">Промо-страницы отсутствуют</p>
            <p className="text-gray-500 text-sm mb-4">
              Добавьте промо-страницы через кнопку &quot;Создать промо-страницу&quot;
            </p>
            <Button onClick={handleCreate}>
              <Plus className="w-4 h-4 mr-2" />
              Создать промо-страницу
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Список промо-страниц</CardTitle>
            <CardDescription>Всего промо-страниц: {promos.length}</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead>Active</TableHead>
                  <TableHead>Updated</TableHead>
                  <TableHead className="text-right">Действия</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {promos.map((promo) => (
                  <TableRow key={promo.id}>
                    <TableCell className="font-medium">{promo.title}</TableCell>
                    <TableCell className="font-mono text-sm">{promo.slug}</TableCell>
                    <TableCell>
                      <Badge variant={promo.isActive ? 'default' : 'secondary'}>
                        {promo.isActive ? 'Да' : 'Нет'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {promo.updatedAt
                        ? new Date(promo.updatedAt).toLocaleDateString('ru-RU', {
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
                          onClick={() => handleEdit(promo)}
                        >
                          <Edit className="w-4 h-4 mr-1" />
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(promo)}
                        >
                          <X className="w-4 h-4 mr-1" />
                          Disable
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
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingPromo ? 'Редактировать промо-страницу' : 'Создать промо-страницу'}
            </DialogTitle>
            <DialogDescription>
              {editingPromo
                ? 'Измените данные промо-страницы'
                : 'Заполните данные для новой промо-страницы'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            {errorMessage && (
              <Alert variant="destructive" className="mb-4">
                {errorMessage}
              </Alert>
            )}
            <div className="space-y-4 py-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Title <span className="text-red-500">*</span>
                </label>
                <Input
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Название промо-страницы"
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
                  placeholder="promo-slug"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Description</label>
                <Textarea
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Описание промо-страницы"
                  rows={4}
                />
              </div>

              {/* Gallery */}
              <div>
                <label className="block text-sm font-medium mb-2">Gallery</label>
                <div className="space-y-2">
                  {mediaInputs.map((media, index) => (
                    <div key={index} className="flex gap-2 items-start">
                      <div className="flex-1 flex gap-2">
                        <select
                          value={media.mediaType}
                          onChange={(e) =>
                            updateMediaInput(index, 'mediaType', e.target.value)
                          }
                          className="h-10 w-32 rounded-md border bg-background px-3 text-sm"
                        >
                          <option value="IMAGE">IMAGE</option>
                          <option value="VIDEO">VIDEO</option>
                        </select>
                        <Input
                          type="url"
                          placeholder="https://example.com/media.jpg"
                          value={media.mediaUrl}
                          onChange={(e) => updateMediaInput(index, 'mediaUrl', e.target.value)}
                          className="flex-1"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => moveMediaUp(index)}
                          disabled={index === 0}
                          className="h-8 w-8"
                        >
                          <ChevronUp className="w-4 h-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => moveMediaDown(index)}
                          disabled={index === mediaInputs.length - 1}
                          className="h-8 w-8"
                        >
                          <ChevronDown className="w-4 h-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => removeMediaInput(index)}
                          className="h-8 w-8"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  <Button type="button" variant="outline" onClick={addMediaInput}>
                    <Plus className="w-4 h-4 mr-2" />
                    Добавить медиа
                  </Button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">CTA Type</label>
                <select
                  value={formData.ctaType}
                  onChange={(e) =>
                    setFormData({ ...formData, ctaType: e.target.value as 'PRODUCT' | 'URL' })
                  }
                  className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                >
                  <option value="URL">URL</option>
                  <option value="PRODUCT">PRODUCT</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">CTA Text</label>
                <Input
                  value={formData.ctaText || ''}
                  onChange={(e) => setFormData({ ...formData, ctaText: e.target.value })}
                  placeholder="Посмотреть"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">CTA URL</label>
                <Input
                  type={formData.ctaType === 'PRODUCT' ? 'text' : 'url'}
                  value={formData.ctaUrl || ''}
                  onChange={(e) => setFormData({ ...formData, ctaUrl: e.target.value })}
                  placeholder={
                    formData.ctaType === 'PRODUCT'
                      ? '/p/:id или productId'
                      : 'https://example.com'
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Active</label>
                <select
                  value={formData.isActive ? 'true' : 'false'}
                  onChange={(e) =>
                    setFormData({ ...formData, isActive: e.target.value === 'true' })
                  }
                  className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                >
                  <option value="true">Да</option>
                  <option value="false">Нет</option>
                </select>
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
                  : editingPromo
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
            <DialogTitle>Отключить промо-страницу?</DialogTitle>
            <DialogDescription>
              Вы уверены, что хотите отключить промо-страницу &quot;{deletingPromo?.title}&quot;?
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
              {deleteMutation.isPending ? 'Отключение...' : 'Отключить'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

