'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ImageIcon, FileText, Plus, Edit, X, Search, ChevronUp, ChevronDown } from 'lucide-react';
import { useState } from 'react';

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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { useTelegram } from '@/hooks/useTelegram';
import { getTokenFromUrl } from '@/lib/admin-nav';
import { api, type Banner, type CreateBannerDto, type UpdateBannerDto, type Promo, type CreatePromoDto, type UpdatePromoDto, ApiClientError } from '@/lib/api';

function formatError(error: unknown): string {
  if (error instanceof ApiClientError) {
    return `Ошибка загрузки (${error.statusCode || '?'}): ${error.message}`;
  }
  if (error instanceof Error) {
    return `Ошибка: ${error.message}`;
  }
  return 'Неизвестная ошибка';
}

// Banners Tab Component
function BannersTab(): JSX.Element {
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

  const { data: promos } = useQuery({
    queryKey: ['admin', 'promos', initData],
    queryFn: () => api.getAdminPromos(initData),
    enabled: (!!initData || isDevMode) && dialogOpen,
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateBannerDto) => api.createAdminBanner(initData, data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin', 'banners'] });
      setDialogOpen(false);
      resetForm();
      setErrorMessage(null);
    },
    onError: (error: Error) => {
      setErrorMessage(formatError(error));
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateBannerDto }) =>
      api.updateAdminBanner(initData, id, data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin', 'banners'] });
      setDialogOpen(false);
      setEditingBanner(null);
      resetForm();
      setErrorMessage(null);
    },
    onError: (error: Error) => {
      setErrorMessage(formatError(error));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.deleteAdminBanner(initData, id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin', 'banners'] });
      setDeleteDialogOpen(false);
      setDeletingBanner(null);
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
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
        <p className="mt-4 text-gray-600">Загрузка баннеров...</p>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        {formatError(error)}
      </Alert>
    );
  }

  const banners = data?.items || [];
  const total = data?.total || 0;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Баннеры</h2>
        <Button onClick={handleCreate}>
          <Plus className="w-4 h-4 mr-2" />
          Создать баннер
        </Button>
      </div>

      <Card>
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
            <select
              value={isActiveFilter}
              onChange={(e) => setIsActiveFilter(e.target.value)}
              className="w-48 border border-gray-300 rounded-lg px-3 py-2"
            >
              <option value="All">Все статусы</option>
              <option value="true">Активные</option>
              <option value="false">Неактивные</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {errorMessage && (
        <Alert variant="destructive">{errorMessage}</Alert>
      )}

      {banners.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="w-16 h-16 text-gray-400 mb-4 flex items-center justify-center" aria-hidden="true">
              <ImageIcon className="w-8 h-8" />
            </div>
            <p className="text-gray-600 text-lg mb-2">Баннеры отсутствуют</p>
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
                <select
                  value={formData.mediaType}
                  onChange={(e) =>
                    setFormData({ ...formData, mediaType: e.target.value as 'IMAGE' | 'VIDEO' })
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                >
                  <option value="IMAGE">IMAGE</option>
                  <option value="VIDEO">VIDEO</option>
                </select>
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
                  <select
                    value={formData.promoSlug}
                    onChange={(e) => setFormData({ ...formData, promoSlug: e.target.value })}
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2"
                  >
                    <option value="">Выберите промо-страницу</option>
                    {promos?.map((promo) => (
                      <option key={promo.id} value={promo.slug}>
                        {promo.title} ({promo.slug})
                      </option>
                    ))}
                  </select>
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
                  <select
                    value={formData.isActive ? 'true' : 'false'}
                    onChange={(e) =>
                      setFormData({ ...formData, isActive: e.target.value === 'true' })
                    }
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  >
                    <option value="true">Да</option>
                    <option value="false">Нет</option>
                  </select>
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

// Promos Tab Component
function PromosTab(): JSX.Element {
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
    mutationFn: (data: CreatePromoDto) => api.createAdminPromo(initData, data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin', 'promos'] });
      setDialogOpen(false);
      resetForm();
      setErrorMessage(null);
    },
    onError: (error: Error) => {
      setErrorMessage(formatError(error));
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdatePromoDto }) =>
      api.updateAdminPromo(initData, id, data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin', 'promos'] });
      setDialogOpen(false);
      setEditingPromo(null);
      resetForm();
      setErrorMessage(null);
    },
    onError: (error: Error) => {
      setErrorMessage(formatError(error));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.deleteAdminPromo(initData, id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin', 'promos'] });
      setDeleteDialogOpen(false);
      setDeletingPromo(null);
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
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
        <p className="mt-4 text-gray-600">Загрузка промо-страниц...</p>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        {formatError(error)}
      </Alert>
    );
  }

  const promos = data || [];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Промо-страницы</h2>
        <Button onClick={handleCreate}>
          <Plus className="w-4 h-4 mr-2" />
          Создать промо-страницу
        </Button>
      </div>

      {errorMessage && (
        <Alert variant="destructive">{errorMessage}</Alert>
      )}

      {promos.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="w-16 h-16 text-gray-400 mb-4" />
            <p className="text-gray-600 text-lg mb-2">Промо-страницы отсутствуют</p>
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

// Notifications Tab Component
function NotificationsTab(): JSX.Element {
  const { initData } = useTelegram();
  const [mode, setMode] = useState<'broadcast' | 'targeted'>('broadcast');
  const [formData, setFormData] = useState({
    title: '',
    body: '',
    deepLink: '',
  });
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // User selection state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  // Fetch users for targeted mode
  const {
    data: usersData,
    isLoading: isLoadingUsers,
  } = useQuery({
    queryKey: ['admin', 'users', searchQuery, currentPage, pageSize],
    queryFn: () => api.getAdminUsers(initData, { search: searchQuery || undefined, page: currentPage, pageSize }),
    enabled: mode === 'targeted',
    staleTime: 0, // Always consider data stale
    refetchOnWindowFocus: true, // Refetch when window regains focus
    refetchOnMount: true, // Refetch on component mount
    gcTime: 0, // Don't cache in memory (gcTime replaces cacheTime in React Query v5+)
  });

  const broadcastMutation = useMutation({
    mutationFn: (data: { title: string; body: string; data?: Record<string, unknown> }) =>
      api.sendAdminBroadcast(initData, data),
    onSuccess: async (response) => {
      if (response.delivered === 0) {
        setSuccessMessage(`Уведомление создано, но не доставлено (пользователей в системе: ${response.totalUsers})`);
      } else {
        setSuccessMessage(`Уведомление отправлено ${response.delivered} из ${response.totalUsers} пользователей`);
      }
      setFormData({ title: '', body: '', deepLink: '' });
      setErrorMessage(null);
      setTimeout(() => setSuccessMessage(null), 5000);
    },
    onError: (error: Error) => {
      setErrorMessage(formatError(error));
      setSuccessMessage(null);
    },
  });

  const targetedMutation = useMutation({
    mutationFn: (data: {
      title: string;
      body: string;
      data?: Record<string, unknown>;
      recipientTelegramIds: (string | number)[];
    }) => api.sendAdminTargeted(initData, data),
    onSuccess: async (data) => {
      setSuccessMessage(`Уведомление отправлено ${data.recipientsCount} пользователям`);
      setFormData({ title: '', body: '', deepLink: '' });
      setSelectedUserIds(new Set());
      setErrorMessage(null);
      setTimeout(() => setSuccessMessage(null), 5000);
    },
    onError: (error: Error) => {
      setErrorMessage(formatError(error));
      setSuccessMessage(null);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!formData.title.trim() || !formData.body.trim()) {
      setErrorMessage('Заполните заголовок и текст уведомления');
      return;
    }

    const notificationData: { title: string; body: string; data?: Record<string, unknown> } = {
      title: formData.title.trim(),
      body: formData.body.trim(),
    };

    if (formData.deepLink.trim()) {
      notificationData.data = {
        deepLink: formData.deepLink.trim(),
      };
    }

    if (mode === 'broadcast') {
      broadcastMutation.mutate(notificationData);
    } else {
      if (selectedUserIds.size === 0) {
        setErrorMessage('Выберите хотя бы одного пользователя');
        return;
      }
      targetedMutation.mutate({
        ...notificationData,
        recipientTelegramIds: Array.from(selectedUserIds),
      });
    }
  };

  const handleUserToggle = (telegramId: string) => {
    setSelectedUserIds((prev) => {
      const next = new Set(prev);
      if (next.has(telegramId)) {
        next.delete(telegramId);
      } else {
        next.add(telegramId);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    if (!usersData?.items) return;
    const allIds = new Set(usersData.items.map((u) => u.telegramId));
    setSelectedUserIds((prev) => {
      const next = new Set(prev);
      allIds.forEach((id) => next.add(id));
      return next;
    });
  };

  const handleDeselectAll = () => {
    if (!usersData?.items) return;
    const userIdsOnPage = new Set(usersData.items.map((u) => u.telegramId));
    setSelectedUserIds((prev) => {
      const next = new Set(prev);
      userIdsOnPage.forEach((id) => next.delete(id));
      return next;
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Уведомления</h2>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Отправить уведомление</CardTitle>
          <CardDescription>
            Выберите режим отправки: всем пользователям или выбранным
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {errorMessage && <Alert variant="destructive">{errorMessage}</Alert>}
            {successMessage && (
              <Alert className="bg-green-50 border-green-200 text-green-800">{successMessage}</Alert>
            )}

            {/* Mode Toggle */}
            <div className="flex gap-4">
              <Button
                type="button"
                variant={mode === 'broadcast' ? 'default' : 'outline'}
                onClick={() => {
                  setMode('broadcast');
                  setSelectedUserIds(new Set());
                }}
              >
                Всем
              </Button>
              <Button
                type="button"
                variant={mode === 'targeted' ? 'default' : 'outline'}
                onClick={() => setMode('targeted')}
              >
                Выбранным
              </Button>
            </div>

            {/* User Selection (Targeted Mode) */}
            {mode === 'targeted' && (
              <div className="space-y-4 border rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">Выбор пользователей</h3>
                  <div className="flex gap-2">
                    <Button type="button" variant="outline" size="sm" onClick={handleSelectAll}>
                      Выбрать всех на странице
                    </Button>
                    <Button type="button" variant="outline" size="sm" onClick={handleDeselectAll}>
                      Снять выбор
                    </Button>
                  </div>
                </div>
                <div className="text-sm text-gray-600">
                  Выбрано: {selectedUserIds.size} пользователей
                </div>

                {/* Search */}
                <div>
                  <Input
                    placeholder="Поиск по username, Telegram ID, имени..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setCurrentPage(1);
                    }}
                  />
                </div>

                {/* Users List */}
                {isLoadingUsers ? (
                  <div className="text-center py-8 text-gray-500">Загрузка пользователей...</div>
                ) : usersData && usersData.items.length > 0 ? (
                  <div className="border rounded-lg max-h-96 overflow-y-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-12"></TableHead>
                          <TableHead>Telegram ID</TableHead>
                          <TableHead>Username</TableHead>
                          <TableHead>Имя</TableHead>
                          <TableHead>Открытий</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {usersData.items.map((user) => (
                          <TableRow key={user.telegramId}>
                            <TableCell>
                              <input
                                type="checkbox"
                                checked={selectedUserIds.has(user.telegramId)}
                                onChange={() => handleUserToggle(user.telegramId)}
                                className="cursor-pointer"
                              />
                            </TableCell>
                            <TableCell className="font-mono text-xs">{user.telegramId}</TableCell>
                            <TableCell>@{user.username || '—'}</TableCell>
                            <TableCell>
                              {user.firstName || user.lastName
                                ? `${user.firstName || ''} ${user.lastName || ''}`.trim()
                                : '—'}
                            </TableCell>
                            <TableCell>{user.opensCount ?? '—'}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">Пользователи не найдены</div>
                )}

                {/* Pagination */}
                {usersData && usersData.total > pageSize && (
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-600">
                      Страница {usersData.page} из {Math.ceil(usersData.total / usersData.pageSize)}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      >
                        Назад
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={currentPage >= Math.ceil(usersData.total / usersData.pageSize)}
                        onClick={() => setCurrentPage((p) => p + 1)}
                      >
                        Вперед
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Notification Form */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Заголовок <span className="text-red-500">*</span>
              </label>
              <Input
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Заголовок уведомления"
                maxLength={100}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Текст <span className="text-red-500">*</span>
              </label>
              <Textarea
                required
                value={formData.body}
                onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                placeholder="Текст уведомления"
                rows={4}
                maxLength={500}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Deep Link (опционально)</label>
              <Input
                value={formData.deepLink}
                onChange={(e) => setFormData({ ...formData, deepLink: e.target.value })}
                placeholder="Например: /promo/new-year-sale или /orders"
              />
              <p className="text-xs text-gray-500 mt-1">
                Ссылка внутри приложения, куда перейдет пользователь при нажатии на уведомление.
              </p>
            </div>

            <Button
              type="submit"
              disabled={
                mode === 'targeted'
                  ? targetedMutation.isPending || selectedUserIds.size === 0
                  : broadcastMutation.isPending
              }
            >
              {mode === 'targeted'
                ? targetedMutation.isPending
                  ? 'Отправка...'
                  : `Отправить выбранным (${selectedUserIds.size})`
                : broadcastMutation.isPending
                  ? 'Отправка...'
                  : 'Отправить всем'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

// Main Marketing Page
export default function AdminMarketingPage(): JSX.Element {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Маркетинг</h1>

      <Tabs defaultValue="banners" className="w-full">
        <TabsList>
          <TabsTrigger value="banners">Баннеры</TabsTrigger>
          <TabsTrigger value="promos">Промо</TabsTrigger>
          <TabsTrigger value="notifications">Уведомления</TabsTrigger>
        </TabsList>
        <TabsContent value="banners">
          <BannersTab />
        </TabsContent>
        <TabsContent value="promos">
          <PromosTab />
        </TabsContent>
        <TabsContent value="notifications">
          <NotificationsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}


