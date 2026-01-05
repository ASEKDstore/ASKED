'use client';

import { ArrowLeft, Plus, X, Save } from 'lucide-react';
import { useState } from 'react';
// eslint-disable-next-line import/order
import { useRouter } from 'next/navigation';
// eslint-disable-next-line import/order
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useTelegram } from '@/hooks/useTelegram';
import { addTokenToUrl, getTokenFromUrl } from '@/lib/admin-nav';
import { api, type CreateProductDto } from '@/lib/api';

export default function NewProductPage(): JSX.Element {
  const router = useRouter();
  const { initData } = useTelegram();
  const token = getTokenFromUrl();
  const queryClient = useQueryClient();

  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [formData, setFormData] = useState<CreateProductDto>({
    title: '',
    description: '',
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

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => api.getCategories(),
  });

  const { data: tags } = useQuery({
    queryKey: ['tags'],
    queryFn: () => api.getTags(),
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateProductDto) => {
      // Log in dev mode
      if (process.env.NODE_ENV === 'development') {
        console.log('[CREATE]', {
          endpoint: '/admin/products',
          hasDevToken: !!token,
        });
      }
      return api.createAdminProduct(initData, data);
    },
    onSuccess: async (createdProduct) => {
      // Invalidate and refetch queries
      await queryClient.invalidateQueries({ queryKey: ['admin', 'products'] });
      await queryClient.refetchQueries({ queryKey: ['admin', 'products'] });
      // Show success message with details
      if (typeof window !== 'undefined') {
        window.alert(`Создано: ${createdProduct.title} (${createdProduct.id})`);
      }
      router.push(addTokenToUrl('/admin/products', token));
    },
    onError: (error: Error) => {
      setErrorMessage(error.message || 'Ошибка при создании товара');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    const images = imageInputs.filter((img) => img.url.trim()).map((img, idx) => ({
      url: img.url.trim(),
      sort: img.sort || idx,
    }));

    createMutation.mutate({
      ...formData,
      images: images.length > 0 ? images : undefined,
      categoryIds: formData.categoryIds?.length ? formData.categoryIds : undefined,
      tagIds: formData.tagIds?.length ? formData.tagIds : undefined,
    });
  };

  const addImageInput = () => {
    setImageInputs([...imageInputs, { url: '', sort: imageInputs.length }]);
  };

  const removeImageInput = (index: number) => {
    setImageInputs(imageInputs.filter((_, i) => i !== index));
  };

  const updateImageInput = (index: number, field: 'url' | 'sort', value: string | number) => {
    const updated = [...imageInputs];
    updated[index] = { ...updated[index], [field]: value };
    setImageInputs(updated);
  };

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

      <h1 className="text-3xl font-bold mb-8">Создать товар</h1>

      {errorMessage && (
        <Alert variant="destructive" className="mb-6">
          {errorMessage}
        </Alert>
      )}

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
                    setFormData({ ...formData, status: e.target.value as 'DRAFT' | 'ACTIVE' | 'ARCHIVED' })
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
            <CardTitle>Изображения</CardTitle>
            <CardDescription>URL изображений товара</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {imageInputs.map((img, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  type="url"
                  placeholder="https://example.com/image.jpg"
                  value={img.url}
                  onChange={(e) => updateImageInput(index, 'url', e.target.value)}
                  className="flex-1"
                />
                <Input
                  type="number"
                  placeholder="Sort"
                  value={img.sort}
                  onChange={(e) => updateImageInput(index, 'sort', parseInt(e.target.value) || 0)}
                  className="w-20"
                />
                {imageInputs.length > 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => removeImageInput(index)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>
            ))}
            <Button type="button" variant="outline" onClick={addImageInput}>
              <Plus className="w-4 h-4 mr-2" />
              Добавить изображение
            </Button>
          </CardContent>
        </Card>

        {/* Categories */}
        <Card>
          <CardHeader>
            <CardTitle>Категории</CardTitle>
            <CardDescription>Выберите категории товара</CardDescription>
          </CardHeader>
          <CardContent>
            <Select
              multiple
              value={formData.categoryIds}
              onChange={(e) => {
                const selected = Array.from(e.target.selectedOptions, (option) => option.value);
                setFormData({ ...formData, categoryIds: selected });
              }}
              className="min-h-[100px]"
            >
              {categories?.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </Select>
            {(!categories || categories.length === 0) && (
              <p className="text-sm text-gray-500 mt-2">Категории не найдены</p>
            )}
          </CardContent>
        </Card>

        {/* Tags */}
        <Card>
          <CardHeader>
            <CardTitle>Теги</CardTitle>
            <CardDescription>Выберите теги товара</CardDescription>
          </CardHeader>
          <CardContent>
            <Select
              multiple
              value={formData.tagIds}
              onChange={(e) => {
                const selected = Array.from(e.target.selectedOptions, (option) => option.value);
                setFormData({ ...formData, tagIds: selected });
              }}
              className="min-h-[100px]"
            >
              {tags?.map((tag) => (
                <option key={tag.id} value={tag.id}>
                  {tag.name}
                </option>
              ))}
            </Select>
            {(!tags || tags.length === 0) && (
              <p className="text-sm text-gray-500 mt-2">Теги не найдены</p>
            )}
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Отмена
          </Button>
          <Button type="submit" disabled={createMutation.isPending}>
            <Save className="w-4 h-4 mr-2" />
            {createMutation.isPending ? 'Создание...' : 'Создать товар'}
          </Button>
        </div>
      </form>
    </div>
  );
}

