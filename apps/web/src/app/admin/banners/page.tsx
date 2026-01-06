'use client';

import { Image, Plus, Edit, X, Search } from 'lucide-react';
import { useState } from 'react';
// eslint-disable-next-line import/order
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { Alert } from '@/components/ui/alert';
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
import { getTokenFromUrl } from '@/lib/admin-nav';
import { api, type Banner, type CreateBannerDto, type UpdateBannerDto } from '@/lib/api';

export default function AdminBannersPage(): JSX.Element {
  const { initData } = useTelegram();
  const queryClient = useQueryClient();
  const token = getTokenFromUrl();
  const isDevMode = !!token;
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const [deletingBanner, setDeletingBanner] = useState<Banner | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isActiveFilter, setIsActiveFilter] = useState<string>('All');
  const [formData, setFormData] = useState<CreateBannerDto>({
    title: '',
    subtitle: '',
    mediaType: 'IMAGE',
    mediaUrl: '',
    isActive: true,
    sort: 0,
    promoSlug: '',
  });
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ['admin', 'banners', initData, searchQuery, isActiveFilter],
    queryFn: () =>
      api.getAdminBanners(initData, {
        q: searchQuery || undefined,
        isActive: isActiveFilter !== 'All' ? isActiveFilter === 'true' : undefined,
        page: 1,
        pageSize: 100,
      }),
    enabled: !!initData || isDevMode,
  });

  // Get promos for dropdown
  const { data: promos } = useQuery({
    queryKey: ['admin', 'promos', initData],
    queryFn: () => api.getAdminPromos(initData),
    enabled: (!!initData || isDevMode) && dialogOpen,
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateBannerDto) => {
      if (process.env.NODE_ENV === 'development') {
        console.log('[CREATE]', {
          endpoint: '/admin/banners',
          hasDevToken: !!token,
        });
      }
      return api.createAdminBanner(initData, data);
    },
    onSuccess: async (createdBanner) => {
      await queryClient.invalidateQueries({ queryKey: ['admin', 'banners'] });
      await queryClient.refetchQueries({ queryKey: ['admin', 'banners'] });
      setDialogOpen(false);
      resetForm();
      setErrorMessage(null);
      if (typeof window !== 'undefined') {
        window.alert(`Создано: ${createdBanner.title} (${createdBanner.id})`);
      }
    },
    onError: (error: Error) => {
      setErrorMessage(error.message || 'Ошибка при создании баннера');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateBannerDto }) =>
      api.updateAdminBanner(initData, id, data),
    onSuccess: async (updatedBanner) => {
      await queryClient.invalidateQueries({ queryKey: ['admin', 'banners'] });
      await queryClient.refetchQueries({ queryKey: ['admin', 'banners'] });
      setDialogOpen(false);
      setEditingBanner(null);
      resetForm();
      setErrorMessage(null);
      if (typeof window !== 'undefined') {
        window.alert(`Обновлено: ${updatedBanner.title} (${updatedBanner.id})`);
      }
    },
    onError: (error: Error) => {
      setErrorMessage(error.message || 'Ошибка при обновлении баннера');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.deleteAdminBanner(initData, id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin', 'banners'] });
      await queryClient.refetchQueries({ queryKey: ['admin', 'banners'] });
      setDeleteDialogOpen(false);
      setDeletingBanner(null);
      if (typeof window !== 'undefined') {
        window.alert('Баннер отключен');
      }
    },
  });

  const resetForm = () => {
    setFormData({
      title: '',
      subtitle: '',
      mediaType: 'IMAGE',
      mediaUrl: '',
      isActive: true,
      sort: 0,
      promoSlug: '',
    });
    setEditingBanner(null);
  };

  const handleCreate = () => {
    resetForm();
    setDialogOpen(true);
  };

  const handleEdit = (banner: Banner) => {
    setEditingBanner(banner);
    setFormData({
      title: banner.title,
      subtitle: banner.subtitle || '',
      mediaType: banner.mediaType,
      mediaUrl: banner.mediaUrl,
      isActive: banner.isActive,
      sort: banner.sort,
      promoSlug: banner.promoSlug,
    });
    setDialogOpen(true);
  };

  const handleDelete = (banner: Banner) => {
    setDeletingBanner(banner);
    setDeleteDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    if (editingBanner) {
      updateMutation.mutate({
        id: editingBanner.id,
        data: {
          title: formData.title,
          subtitle: formData.subtitle || null,
          mediaType: formData.mediaType,
          mediaUrl: formData.mediaUrl,
          isActive: formData.isActive,
          sort: formData.sort,
          promoSlug: formData.promoSlug,
        },
      });
    } else {
      createMutation.mutate(formData);
    }
  };

  const confirmDelete = () => {
    if (deletingBanner) {
      deleteMutation.mutate(deletingBanner.id);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
          <p className="mt-4 text-gray-600">Загрузка баннеров...</p>
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
              Не удалось загрузить баннеры. Попробуйте обновить страницу.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const banners = data?.items || [];
  const total = data?.total || 0;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Баннеры</h1>
        <Button onClick={handleCreate}>
          <Plus className="w-4 h-4 mr-2" />
          Создать баннер
        </Button>
      </div>

      {/* Filters */}
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
              value={isActiveFilter}
              onChange={(e) => setIsActiveFilter(e.target.value)}
              className="w-48"
            >
              <option value="All">Все статусы</option>
              <option value="true">Активные</option>
              <option value="false">Неактивные</option>
            </Select>
          </div>
        </CardContent>
      </Card>

      {errorMessage && (
        <Alert variant="destructive" className="mb-6">
          {errorMessage}
        </Alert>
      )}

      {banners.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Image className="w-16 h-16 text-gray-400 mb-4" />
            <p className="text-gray-600 text-lg mb-2">Баннеры отсутствуют</p>
            <p className="text-gray-500 text-sm mb-4">
              Добавьте баннеры через кнопку &quot;Создать баннер&quot;
            </p>
            <Button onClick={handleCreate}>
              <Plus className="w-4 h-4 mr-2" />
              Создать баннер
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Список баннеров</CardTitle>
            <CardDescription>Всего баннеров: {total}</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>MediaType</TableHead>
                  <TableHead>Active</TableHead>
                  <TableHead>Sort</TableHead>
                  <TableHead>PromoSlug</TableHead>
                  <TableHead>Updated</TableHead>
                  <TableHead className="text-right">Действия</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {banners.map((banner) => (
                  <TableRow key={banner.id}>
                    <TableCell className="font-medium">{banner.title}</TableCell>
                    <TableCell>
                      <Badge variant={banner.mediaType === 'IMAGE' ? 'default' : 'secondary'}>
                        {banner.mediaType}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={banner.isActive ? 'default' : 'secondary'}>
                        {banner.isActive ? 'Да' : 'Нет'}
                      </Badge>
                    </TableCell>
                    <TableCell>{banner.sort}</TableCell>
                    <TableCell className="font-mono text-sm">{banner.promoSlug}</TableCell>
                    <TableCell>
                      {banner.updatedAt
                        ? new Date(banner.updatedAt).toLocaleDateString('ru-RU', {
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
                          onClick={() => handleEdit(banner)}
                        >
                          <Edit className="w-4 h-4 mr-1" />
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(banner)}
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
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingBanner ? 'Редактировать баннер' : 'Создать баннер'}
            </DialogTitle>
            <DialogDescription>
              {editingBanner ? 'Измените данные баннера' : 'Заполните данные для нового баннера'}
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
                  placeholder="Название баннера"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Subtitle</label>
                <Input
                  value={formData.subtitle || ''}
                  onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                  placeholder="Подзаголовок"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Media Type <span className="text-red-500">*</span>
                </label>
                <Select
                  value={formData.mediaType}
                  onChange={(e) =>
                    setFormData({ ...formData, mediaType: e.target.value as 'IMAGE' | 'VIDEO' })
                  }
                >
                  <option value="IMAGE">IMAGE</option>
                  <option value="VIDEO">VIDEO</option>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Media URL <span className="text-red-500">*</span>
                </label>
                <Input
                  required
                  type="url"
                  value={formData.mediaUrl}
                  onChange={(e) => setFormData({ ...formData, mediaUrl: e.target.value })}
                  placeholder="https://example.com/image.jpg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Promo Slug <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-2">
                  <Select
                    value={formData.promoSlug}
                    onChange={(e) => setFormData({ ...formData, promoSlug: e.target.value })}
                    className="flex-1"
                  >
                    <option value="">Выберите промо-страницу</option>
                    {promos?.map((promo) => (
                      <option key={promo.id} value={promo.slug}>
                        {promo.title} ({promo.slug})
                      </option>
                    ))}
                  </Select>
                  <Input
                    value={formData.promoSlug}
                    onChange={(e) => setFormData({ ...formData, promoSlug: e.target.value })}
                    placeholder="Или введите slug вручную"
                    className="flex-1"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Sort</label>
                  <Input
                    type="number"
                    value={formData.sort}
                    onChange={(e) =>
                      setFormData({ ...formData, sort: parseInt(e.target.value) || 0 })
                    }
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Active</label>
                  <Select
                    value={formData.isActive ? 'true' : 'false'}
                    onChange={(e) =>
                      setFormData({ ...formData, isActive: e.target.value === 'true' })
                    }
                  >
                    <option value="true">Да</option>
                    <option value="false">Нет</option>
                  </Select>
                </div>
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
                  : editingBanner
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
            <DialogTitle>Отключить баннер?</DialogTitle>
            <DialogDescription>
              Вы уверены, что хотите отключить баннер &quot;{deletingBanner?.title}&quot;?
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

