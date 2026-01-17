'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FlaskConical, Plus, Edit, X, Search, Image as ImageIcon } from 'lucide-react';
import Image from 'next/image';
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
import { api, ApiClientError, type LabProduct, type CreateLabProductDto, type LabWork, type CreateLabWorkDto } from '@/lib/api';

function formatError(error: unknown): string {
  if (error instanceof ApiClientError) {
    return `Ошибка загрузки (${error.statusCode || '?'}): ${error.message}`;
  }
  if (error instanceof Error) {
    return `Ошибка: ${error.message}`;
  }
  return 'Неизвестная ошибка';
}

function LabProductsTab(): JSX.Element {
  const { initData } = useTelegram();
  const queryClient = useQueryClient();
  const token = getTokenFromUrl();
  const isDevMode = !!token;
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<LabProduct | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<LabProduct | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isActiveFilter, setIsActiveFilter] = useState<string>('All');
  const [formData, setFormData] = useState<CreateLabProductDto>({
    title: '',
    subtitle: '',
    description: '',
    price: 0,
    currency: 'RUB',
    isActive: true,
    sortOrder: 0,
    coverMediaType: 'IMAGE',
    coverMediaUrl: '',
    ctaType: 'NONE',
    ctaProductId: '',
    ctaUrl: '',
  });
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ['admin', 'lab-products', initData, searchQuery, isActiveFilter],
    queryFn: () =>
      api.getAdminLabProducts(initData, {
        q: searchQuery || undefined,
        isActive: isActiveFilter !== 'All' ? isActiveFilter === 'true' : undefined,
        page: 1,
        pageSize: 100,
      }),
    enabled: !!initData || isDevMode,
  });

  const { data: products } = useQuery({
    queryKey: ['admin', 'products', initData],
    queryFn: () => api.getAdminProducts(initData, { page: 1, pageSize: 1000 }),
    enabled: (!!initData || isDevMode) && dialogOpen && formData.ctaType === 'PRODUCT',
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateLabProductDto) => api.createAdminLabProduct(initData, data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin', 'lab-products'] });
      setDialogOpen(false);
      resetForm();
      setErrorMessage(null);
    },
    onError: (error: Error) => {
      setErrorMessage(formatError(error));
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateLabProductDto> }) =>
      api.updateAdminLabProduct(initData, id, data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin', 'lab-products'] });
      setDialogOpen(false);
      setEditingProduct(null);
      resetForm();
      setErrorMessage(null);
    },
    onError: (error: Error) => {
      setErrorMessage(formatError(error));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.deleteAdminLabProduct(initData, id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin', 'lab-products'] });
      setDeleteDialogOpen(false);
      setDeletingProduct(null);
    },
  });

  const resetForm = () => {
    setFormData({
      title: '',
      subtitle: '',
      description: '',
      price: 0,
      currency: 'RUB',
      isActive: true,
      sortOrder: 0,
      coverMediaType: 'IMAGE',
      coverMediaUrl: '',
      ctaType: 'NONE',
      ctaProductId: '',
      ctaUrl: '',
    });
    setEditingProduct(null);
  };

  const handleCreate = () => {
    resetForm();
    setDialogOpen(true);
  };

  const handleEdit = (product: LabProduct) => {
    setEditingProduct(product);
    setFormData({
      title: product.title,
      subtitle: product.subtitle || '',
      description: product.description || '',
      price: product.price,
      currency: product.currency,
      isActive: product.isActive,
      sortOrder: product.sortOrder,
      coverMediaType: product.coverMediaType,
      coverMediaUrl: product.coverMediaUrl,
      ctaType: product.ctaType,
      ctaProductId: product.ctaProductId || '',
      ctaUrl: product.ctaUrl || '',
    });
    setDialogOpen(true);
  };

  const handleDelete = (product: LabProduct) => {
    setDeletingProduct(product);
    setDeleteDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const submitData: CreateLabProductDto = {
      title: formData.title,
      subtitle: formData.subtitle || undefined,
      description: formData.description || undefined,
      price: formData.price,
      currency: formData.currency,
      isActive: formData.isActive,
      sortOrder: formData.sortOrder,
      coverMediaType: formData.coverMediaType,
      coverMediaUrl: formData.coverMediaUrl,
      ctaType: formData.ctaType,
      ...(formData.ctaType === 'PRODUCT'
        ? { ctaProductId: formData.ctaProductId || undefined, ctaUrl: undefined }
        : {}),
      ...(formData.ctaType === 'URL'
        ? { ctaUrl: formData.ctaUrl || undefined, ctaProductId: undefined }
        : {}),
      ...(formData.ctaType === 'NONE' ? { ctaProductId: undefined, ctaUrl: undefined } : {}),
    };

    if (editingProduct) {
      updateMutation.mutate({ id: editingProduct.id, data: submitData });
    } else {
      createMutation.mutate(submitData);
    }
  };

  const confirmDelete = () => {
    if (deletingProduct) {
      deleteMutation.mutate(deletingProduct.id);
    }
  };

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
        <p className="mt-4 text-gray-600">Загрузка карточек LAB...</p>
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

  const labProducts: LabProduct[] = data?.items || [];
  const total = data?.total || 0;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Карточки LAB</h2>
        <Button onClick={handleCreate}>
          <Plus className="w-4 h-4 mr-2" />
          Создать карточку
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

      {labProducts.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FlaskConical className="w-16 h-16 text-gray-400 mb-4" />
            <p className="text-gray-600 text-lg mb-2">Карточки LAB отсутствуют</p>
            <Button onClick={handleCreate}>
              <Plus className="w-4 h-4 mr-2" />
              Создать карточку
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Список карточек LAB</CardTitle>
            <CardDescription>Всего карточек: {total}</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cover</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Active</TableHead>
                  <TableHead>Sort</TableHead>
                  <TableHead>Updated</TableHead>
                  <TableHead className="text-right">Действия</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {labProducts.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell>
                      {product.coverMediaType === 'IMAGE' ? (
                        <div className="relative w-16 h-16 rounded overflow-hidden">
                          <Image
                            src={product.coverMediaUrl}
                            alt={product.title || 'Lab product cover'}
                            fill
                            className="object-cover"
                            sizes="64px"
                            unoptimized
                          />
                        </div>
                      ) : (
                        <div className="w-16 h-16 bg-gray-200 rounded flex items-center justify-center">
                          <ImageIcon className="w-6 h-6 text-gray-400" />
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="font-medium">{product.title}</TableCell>
                    <TableCell>
                      <Badge variant={product.isActive ? 'default' : 'secondary'}>
                        {product.isActive ? 'Да' : 'Нет'}
                      </Badge>
                    </TableCell>
                    <TableCell>{product.sortOrder}</TableCell>
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
                          onClick={() => handleEdit(product)}
                        >
                          <Edit className="w-4 h-4 mr-1" />
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(product)}
                        >
                          <X className="w-4 h-4 mr-1" />
                          Delete
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
              {editingProduct ? 'Редактировать карточку LAB' : 'Создать карточку LAB'}
            </DialogTitle>
            <DialogDescription>
              {editingProduct
                ? 'Измените данные карточки'
                : 'Заполните данные для новой карточки LAB'}
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
                  placeholder="Название карточки"
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
                <label className="block text-sm font-medium mb-2">Description</label>
                <Textarea
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Описание"
                  rows={4}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Price</label>
                  <Input
                    type="number"
                    min="0"
                    value={formData.price}
                    onChange={(e) =>
                      setFormData({ ...formData, price: parseInt(e.target.value) || 0 })
                    }
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Currency</label>
                  <Input
                    value={formData.currency}
                    onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                    placeholder="RUB"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Cover Media Type <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.coverMediaType}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      coverMediaType: e.target.value as 'IMAGE' | 'VIDEO',
                    })
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                >
                  <option value="IMAGE">IMAGE</option>
                  <option value="VIDEO">VIDEO</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Cover Media URL <span className="text-red-500">*</span>
                </label>
                <Input
                  required
                  type="url"
                  value={formData.coverMediaUrl}
                  onChange={(e) => setFormData({ ...formData, coverMediaUrl: e.target.value })}
                  placeholder="https://example.com/image.jpg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">CTA Type</label>
                <select
                  value={formData.ctaType}
                  onChange={(e) => {
                    const ctaType = e.target.value as 'NONE' | 'PRODUCT' | 'URL';
                    setFormData({
                      ...formData,
                      ctaType,
                      ctaProductId: ctaType === 'PRODUCT' ? formData.ctaProductId : '',
                      ctaUrl: ctaType === 'URL' ? formData.ctaUrl : '',
                    });
                  }}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                >
                  <option value="NONE">NONE</option>
                  <option value="PRODUCT">PRODUCT</option>
                  <option value="URL">URL</option>
                </select>
              </div>
              {formData.ctaType === 'PRODUCT' && (
                <div>
                  <label className="block text-sm font-medium mb-2">
                    CTA Product <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.ctaProductId || ''}
                    onChange={(e) => setFormData({ ...formData, ctaProductId: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    required
                  >
                    <option value="">Выберите товар</option>
                    {products?.items?.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.title}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              {formData.ctaType === 'URL' && (
                <div>
                  <label className="block text-sm font-medium mb-2">
                    CTA URL <span className="text-red-500">*</span>
                  </label>
                  <Input
                    required
                    type="url"
                    value={formData.ctaUrl || ''}
                    onChange={(e) => setFormData({ ...formData, ctaUrl: e.target.value })}
                    placeholder="https://example.com"
                  />
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Sort Order</label>
                  <Input
                    type="number"
                    value={formData.sortOrder}
                    onChange={(e) =>
                      setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 0 })
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
                  : editingProduct
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
            <DialogTitle>Удалить карточку LAB?</DialogTitle>
            <DialogDescription>
              Вы уверены, что хотите удалить карточку &quot;{deletingProduct?.title}&quot;?
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

function LabWorksTab(): JSX.Element {
  const { initData } = useTelegram();
  const queryClient = useQueryClient();
  const token = getTokenFromUrl();
  const isDevMode = !!token;
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingWork, setEditingWork] = useState<LabWork | null>(null);
  const [deletingWork, setDeletingWork] = useState<LabWork | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [formData, setFormData] = useState<CreateLabWorkDto>({
    title: '',
    slug: '',
    description: '',
    ratingAvg: 0,
    ratingCount: 0,
    status: 'DRAFT',
  });
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ['admin', 'lab-works', initData, searchQuery, statusFilter],
    queryFn: () =>
      api.getAdminLabWorks(initData, {
        q: searchQuery || undefined,
        status: statusFilter !== 'All' ? (statusFilter as 'DRAFT' | 'PUBLISHED' | 'ARCHIVED') : undefined,
        page: 1,
        pageSize: 100,
      }),
    enabled: !!initData || isDevMode,
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateLabWorkDto) => api.createAdminLabWork(initData, data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin', 'lab-works'] });
      setDialogOpen(false);
      resetForm();
      setErrorMessage(null);
    },
    onError: (error: Error) => {
      setErrorMessage(formatError(error));
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: CreateLabWorkDto }) =>
      api.updateAdminLabWork(initData, id, data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin', 'lab-works'] });
      setDialogOpen(false);
      setEditingWork(null);
      resetForm();
      setErrorMessage(null);
    },
    onError: (error: Error) => {
      setErrorMessage(formatError(error));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.deleteAdminLabWork(initData, id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin', 'lab-works'] });
      setDeleteDialogOpen(false);
      setDeletingWork(null);
    },
  });

  const publishMutation = useMutation({
    mutationFn: (id: string) => api.publishAdminLabWork(initData, id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin', 'lab-works'] });
    },
  });

  const archiveMutation = useMutation({
    mutationFn: (id: string) => api.archiveAdminLabWork(initData, id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin', 'lab-works'] });
    },
  });

  const resetForm = () => {
    setFormData({
      title: '',
      slug: '',
      description: '',
      ratingAvg: 0,
      ratingCount: 0,
      status: 'DRAFT',
    });
    setEditingWork(null);
  };

  const handleCreate = () => {
    resetForm();
    setDialogOpen(true);
  };

  const handleEdit = (work: LabWork) => {
    setEditingWork(work);
    setFormData({
      title: work.title,
      slug: work.slug || '',
      description: work.description || '',
      ratingAvg: work.ratingAvg,
      ratingCount: work.ratingCount,
      status: work.status,
    });
    setDialogOpen(true);
  };

  const handleDelete = (work: LabWork) => {
    setDeletingWork(work);
    setDeleteDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const submitData: CreateLabWorkDto = {
      title: formData.title,
      slug: formData.slug || null,
      description: formData.description || null,
      ratingAvg: formData.ratingAvg,
      ratingCount: formData.ratingCount,
      status: formData.status,
    };

    if (editingWork) {
      updateMutation.mutate({ id: editingWork.id, data: submitData });
    } else {
      createMutation.mutate(submitData);
    }
  };

  const confirmDelete = () => {
    if (deletingWork) {
      deleteMutation.mutate(deletingWork.id);
    }
  };

  const statusLabels: Record<string, string> = {
    DRAFT: 'Черновик',
    PUBLISHED: 'Опубликовано',
    ARCHIVED: 'Архив',
  };

  const statusVariants: Record<string, 'default' | 'secondary' | 'destructive'> = {
    DRAFT: 'secondary',
    PUBLISHED: 'default',
    ARCHIVED: 'destructive',
  };

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
        <p className="mt-4 text-gray-600">Загрузка работ...</p>
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

  const labWorks: LabWork[] = data?.items || [];
  const total = data?.total || 0;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Готовые работы</h2>
        <Button onClick={handleCreate}>
          <Plus className="w-4 h-4 mr-2" />
          Создать работу
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
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-48 border border-gray-300 rounded-lg px-3 py-2"
            >
              <option value="All">Все статусы</option>
              <option value="DRAFT">Черновик</option>
              <option value="PUBLISHED">Опубликовано</option>
              <option value="ARCHIVED">Архив</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {errorMessage && (
        <Alert variant="destructive">{errorMessage}</Alert>
      )}

      {labWorks.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FlaskConical className="w-16 h-16 text-gray-400 mb-4" />
            <p className="text-gray-600 text-lg mb-2">Работы отсутствуют</p>
            <Button onClick={handleCreate}>
              <Plus className="w-4 h-4 mr-2" />
              Создать работу
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Список работ</CardTitle>
            <CardDescription>Всего работ: {total}</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Rating</TableHead>
                  <TableHead>Media</TableHead>
                  <TableHead>Updated</TableHead>
                  <TableHead className="text-right">Действия</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {labWorks.map((work) => (
                  <TableRow key={work.id}>
                    <TableCell className="font-medium">{work.title}</TableCell>
                    <TableCell>
                      <Badge variant={statusVariants[work.status] || 'secondary'}>
                        {statusLabels[work.status] || work.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {work.ratingAvg > 0 ? `${work.ratingAvg.toFixed(1)} (${work.ratingCount})` : '-'}
                    </TableCell>
                    <TableCell>{work.media?.length || 0}</TableCell>
                    <TableCell>
                      {work.updatedAt
                        ? new Date(work.updatedAt).toLocaleDateString('ru-RU', {
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
                          onClick={() => handleEdit(work)}
                        >
                          <Edit className="w-4 h-4 mr-1" />
                          Edit
                        </Button>
                        {work.status !== 'PUBLISHED' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => publishMutation.mutate(work.id)}
                            disabled={publishMutation.isPending}
                          >
                            Publish
                          </Button>
                        )}
                        {work.status !== 'ARCHIVED' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => archiveMutation.mutate(work.id)}
                            disabled={archiveMutation.isPending}
                          >
                            Archive
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(work)}
                        >
                          <X className="w-4 h-4 mr-1" />
                          Delete
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
              {editingWork ? 'Редактировать работу' : 'Создать работу'}
            </DialogTitle>
            <DialogDescription>
              {editingWork
                ? 'Измените данные работы'
                : 'Заполните данные для новой работы'}
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
                  placeholder="Название работы"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Slug</label>
                <Input
                  value={formData.slug || ''}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  placeholder="slug-url"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Description</label>
                <Textarea
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Описание"
                  rows={4}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Rating Avg</label>
                  <Input
                    type="number"
                    min="0"
                    max="5"
                    step="0.1"
                    value={formData.ratingAvg}
                    onChange={(e) =>
                      setFormData({ ...formData, ratingAvg: parseFloat(e.target.value) || 0 })
                    }
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Rating Count</label>
                  <Input
                    type="number"
                    min="0"
                    value={formData.ratingCount}
                    onChange={(e) =>
                      setFormData({ ...formData, ratingCount: parseInt(e.target.value) || 0 })
                    }
                    placeholder="0"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      status: e.target.value as 'DRAFT' | 'PUBLISHED' | 'ARCHIVED',
                    })
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                >
                  <option value="DRAFT">Черновик</option>
                  <option value="PUBLISHED">Опубликовано</option>
                  <option value="ARCHIVED">Архив</option>
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
                  : editingWork
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
            <DialogTitle>Удалить работу?</DialogTitle>
            <DialogDescription>
              Вы уверены, что хотите удалить работу &quot;{deletingWork?.title}&quot;?
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

export default function AdminLabPage(): JSX.Element {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">LAB</h1>

      <Tabs defaultValue="products" className="w-full">
        <TabsList>
          <TabsTrigger value="products">Карточки</TabsTrigger>
          <TabsTrigger value="works">Готовые работы</TabsTrigger>
        </TabsList>
        <TabsContent value="products">
          <LabProductsTab />
        </TabsContent>
        <TabsContent value="works">
          <LabWorksTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

