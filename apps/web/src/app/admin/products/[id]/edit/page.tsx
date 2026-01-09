'use client';

import { ArrowLeft, Plus, X, Save, ChevronUp, ChevronDown } from 'lucide-react';
import Image from 'next/image';
import { useState, useEffect } from 'react';
// eslint-disable-next-line import/order
import { useRouter, useParams } from 'next/navigation';
// eslint-disable-next-line import/order
import { useMutation, useQuery } from '@tanstack/react-query';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useTelegram } from '@/hooks/useTelegram';
import { addTokenToUrl, getTokenFromUrl } from '@/lib/admin-nav';
import { api, type UpdateProductDto } from '@/lib/api';

export default function EditProductPage(): JSX.Element {
  const router = useRouter();
  const params = useParams();
  const { initData } = useTelegram();
  const productId = params.id as string;
  const token = getTokenFromUrl();

  const [formData, setFormData] = useState<UpdateProductDto>({
    title: '',
    description: '',
    sku: null,
    price: 0,
    currency: 'RUB',
    status: 'DRAFT',
    stock: 0,
    images: [],
    categoryIds: [],
    tagIds: [],
  });

  const [imageInputs, setImageInputs] = useState<Array<{ url: string; sort: number }>>([
    { url: '', sort: 0 },
  ]);

  // TEMP DEV ADMIN ACCESS - remove after Telegram WebApp enabled
  // In dev mode, initData might be null, but we still want to load data
  const isDevMode = !!token;

  const { data: product, isLoading: isLoadingProduct, error: productError } = useQuery({
    queryKey: ['admin', 'product', productId, initData],
    queryFn: () => api.getAdminProduct(initData, productId),
    enabled: (!!initData || isDevMode) && !!productId,
  });

  const { data: categories } = useQuery({
    queryKey: ['admin', 'categories', initData],
    queryFn: () => api.getAdminCategories(initData),
    enabled: !!initData || isDevMode,
  });

  const { data: tags } = useQuery({
    queryKey: ['admin', 'tags', initData],
    queryFn: () => api.getAdminTags(initData),
    enabled: !!initData || isDevMode,
  });

  const updateMutation = useMutation({
    mutationFn: (data: UpdateProductDto) => api.updateAdminProduct(initData, productId, data),
    onSuccess: () => {
      router.push(addTokenToUrl('/admin/products', token));
    },
  });

  useEffect(() => {
    if (product) {
      setFormData({
        title: product.title,
        description: product.description || '',
        sku: product.sku || null,
        price: product.price,
        currency: product.currency,
        status: product.status,
        stock: product.stock,
        categoryIds: product.categories.map((c) => c.id),
        tagIds: product.tags.map((t) => t.id),
      });

      if (product.images && product.images.length > 0) {
        // Sort images by sort field and recalculate sort to be sequential
        const sortedImages = [...product.images].sort((a, b) => (a.sort || 0) - (b.sort || 0));
        setImageInputs(
          sortedImages.map((img, idx) => ({ url: img.url, sort: idx }))
        );
      } else {
        setImageInputs([{ url: '', sort: 0 }]);
      }
    }
  }, [product]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Filter empty URLs and recalculate sort automatically (0..n-1)
    const images = imageInputs
      .filter((img) => img.url.trim())
      .map((img, idx) => ({
        url: img.url.trim(),
        sort: idx, // Auto-calculate sort by order
      }));

    updateMutation.mutate({
      ...formData,
      images: images.length > 0 ? images : [],
      categoryIds: formData.categoryIds?.length ? formData.categoryIds : [],
      tagIds: formData.tagIds?.length ? formData.tagIds : [],
    });
  };

  const addImageInput = () => {
    setImageInputs([...imageInputs, { url: '', sort: imageInputs.length }]);
  };

  const removeImageInput = (index: number) => {
    const updated = imageInputs.filter((_, i) => i !== index);
    // Recalculate sort after removal
    setImageInputs(updated.map((img, idx) => ({ ...img, sort: idx })));
  };

  const updateImageInput = (index: number, field: 'url', value: string) => {
    const updated = [...imageInputs];
    updated[index] = { ...updated[index], [field]: value };
    setImageInputs(updated);
  };

  const moveImageUp = (index: number) => {
    if (index === 0) return;
    const updated = [...imageInputs];
    [updated[index - 1], updated[index]] = [updated[index], updated[index - 1]];
    // Recalculate sort
    setImageInputs(updated.map((img, idx) => ({ ...img, sort: idx })));
  };

  const moveImageDown = (index: number) => {
    if (index === imageInputs.length - 1) return;
    const updated = [...imageInputs];
    [updated[index], updated[index + 1]] = [updated[index + 1], updated[index]];
    // Recalculate sort
    setImageInputs(updated.map((img, idx) => ({ ...img, sort: idx })));
  };

  if (isLoadingProduct) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
          <p className="mt-4 text-gray-600">Загрузка товара...</p>
        </div>
      </div>
    );
  }

  // Handle errors
  if (productError) {
    const statusCode = (productError as { statusCode?: number })?.statusCode;
    
    if (statusCode === 403) {
      return (
        <div className="container mx-auto px-4 py-8">
          <Card>
            <CardHeader>
              <CardTitle>Нет доступа</CardTitle>
              <CardDescription>
                У вас нет прав для просмотра этого товара.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => router.push(addTokenToUrl('/admin/products', token))}>
                Вернуться к списку
              </Button>
            </CardContent>
          </Card>
        </div>
      );
    }
    
    if (statusCode === 404 || !product) {
      return (
        <div className="container mx-auto px-4 py-8">
          <Card>
            <CardHeader>
              <CardTitle>Товар не найден</CardTitle>
              <CardDescription>
                Товар с указанным ID не найден.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => router.push(addTokenToUrl('/admin/products', token))}>
                Вернуться к списку
              </Button>
            </CardContent>
          </Card>
        </div>
      );
    }
  }

  if (!product) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Товар не найден</CardTitle>
            <CardDescription>
              Товар с указанным ID не найден.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push(addTokenToUrl('/admin/products', token))}>
              Вернуться к списку
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Button
        variant="ghost"
        onClick={() => router.back()}
        className="mb-6"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Назад
      </Button>

      <h1 className="text-3xl font-bold mb-8">Редактировать товар</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Основное */}
        <Card>
          <CardHeader>
            <CardTitle>Основное</CardTitle>
            <CardDescription>Основная информация о товаре</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Название <span className="text-red-500">*</span>
              </label>
              <Input
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Введите название товара"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Описание</label>
              <Textarea
                value={formData.description || ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Введите описание товара"
                rows={4}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Артикул (SKU)
              </label>
              <Input
                value={formData.sku || ''}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value.trim() || null })}
                placeholder="Введите артикул (необязательно)"
              />
              <p className="text-xs text-gray-500 mt-1">Рекомендуется указать уникальный артикул</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Цена <span className="text-red-500">*</span>
                </label>
                <Input
                  type="number"
                  required
                  min="0"
                  value={formData.price}
                  onChange={(e) =>
                    setFormData({ ...formData, price: parseInt(e.target.value) || 0 })
                  }
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Валюта</label>
                <Select
                  value={formData.currency}
                  onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                >
                  <option value="RUB">RUB</option>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Статус</label>
                <Select
                  value={formData.status}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      status: e.target.value as 'DRAFT' | 'ACTIVE' | 'ARCHIVED',
                    })
                  }
                >
                  <option value="DRAFT">Черновик</option>
                  <option value="ACTIVE">Активен</option>
                  <option value="ARCHIVED">Архив</option>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Остаток</label>
                <Input
                  type="number"
                  min="0"
                  value={formData.stock}
                  onChange={(e) =>
                    setFormData({ ...formData, stock: parseInt(e.target.value) || 0 })
                  }
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Images */}
        <Card>
          <CardHeader>
            <CardTitle>Фото</CardTitle>
            <CardDescription>URL изображений товара (порядок определяется автоматически)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {imageInputs.map((img, index) => (
              <div key={index} className="flex gap-2 items-start">
                <div className="flex-1 flex gap-2">
                  <Input
                    type="url"
                    placeholder="https://example.com/image.jpg"
                    value={img.url}
                    onChange={(e) => updateImageInput(index, 'url', e.target.value)}
                    className="flex-1"
                  />
                  {img.url.trim() && (
                    <div className="w-20 h-20 border rounded overflow-hidden flex-shrink-0 relative bg-gray-100">
                      <Image
                        src={img.url}
                        alt={`Preview ${index + 1}`}
                        fill
                        className="object-cover"
                        sizes="80px"
                        unoptimized
                      />
                    </div>
                  )}
                </div>
                <div className="flex flex-col gap-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => moveImageUp(index)}
                    disabled={index === 0}
                    className="h-8 w-8"
                  >
                    <ChevronUp className="w-4 h-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => moveImageDown(index)}
                    disabled={index === imageInputs.length - 1}
                    className="h-8 w-8"
                  >
                    <ChevronDown className="w-4 h-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => removeImageInput(index)}
                    className="h-8 w-8"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
            <Button type="button" variant="outline" onClick={addImageInput}>
              <Plus className="w-4 h-4 mr-2" />
              Добавить фото
            </Button>
          </CardContent>
        </Card>

        {/* Categories */}
        <Card>
          <CardHeader>
            <CardTitle>Категории</CardTitle>
            <CardDescription>Выберите категории товара (можно выбрать несколько)</CardDescription>
          </CardHeader>
          <CardContent>
            {categories && categories.length > 0 ? (
              <div className="space-y-2 max-h-48 overflow-y-auto border rounded-md p-4">
                {categories.map((cat) => (
                  <label key={cat.id} className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-2 rounded">
                    <input
                      type="checkbox"
                      checked={formData.categoryIds?.includes(cat.id) || false}
                      onChange={(e) => {
                        const current = formData.categoryIds || [];
                        if (e.target.checked) {
                          setFormData({ ...formData, categoryIds: [...current, cat.id] });
                        } else {
                          setFormData({ ...formData, categoryIds: current.filter((id) => id !== cat.id) });
                        }
                      }}
                      className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    <span className="text-sm">{cat.name}</span>
                  </label>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 mt-2">Категории не найдены</p>
            )}
          </CardContent>
        </Card>

        {/* Tags */}
        <Card>
          <CardHeader>
            <CardTitle>Теги</CardTitle>
            <CardDescription>Выберите теги товара (можно выбрать несколько)</CardDescription>
          </CardHeader>
          <CardContent>
            {tags && tags.length > 0 ? (
              <div className="space-y-2 max-h-48 overflow-y-auto border rounded-md p-4">
                {tags.map((tag) => (
                  <label key={tag.id} className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-2 rounded">
                    <input
                      type="checkbox"
                      checked={formData.tagIds?.includes(tag.id) || false}
                      onChange={(e) => {
                        const current = formData.tagIds || [];
                        if (e.target.checked) {
                          setFormData({ ...formData, tagIds: [...current, tag.id] });
                        } else {
                          setFormData({ ...formData, tagIds: current.filter((id) => id !== tag.id) });
                        }
                      }}
                      className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    <span className="text-sm">{tag.name}</span>
                  </label>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 mt-2">Теги не найдены</p>
            )}
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Отмена
          </Button>
          <Button type="submit" disabled={updateMutation.isPending}>
            <Save className="w-4 h-4 mr-2" />
            {updateMutation.isPending ? 'Сохранение...' : 'Сохранить изменения'}
          </Button>
        </div>
      </form>
    </div>
  );
}

