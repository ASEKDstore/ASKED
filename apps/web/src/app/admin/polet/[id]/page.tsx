'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Plus, Check, Package, Warehouse } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
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
import { Label } from '@/components/ui/label';
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
import { api, type CreatePoziciyaDto } from '@/lib/api';
import { formatPrice } from '@/lib/utils';

const statusLabels: Record<string, string> = {
  DRAFT: 'Черновик',
  ACCEPTED: 'Принят',
  POSTED: 'Проведен',
  CANCELED: 'Отменен',
};

const statusVariants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  DRAFT: 'secondary',
  ACCEPTED: 'default',
  POSTED: 'outline',
  CANCELED: 'destructive',
};

const metodLabels: Record<string, string> = {
  BY_QUANTITY: 'По количеству',
  BY_COST: 'По стоимости',
};

export default function AdminPoletDetailPage(): JSX.Element {
  const router = useRouter();
  const params = useParams();
  const poletId = params.id as string;
  const { initData } = useTelegram();
  const queryClient = useQueryClient();
  const token = getTokenFromUrl();
  const [addPoziciyaDialogOpen, setAddPoziciyaDialogOpen] = useState(false);
  const [poziciyaFormData, setPoziciyaFormData] = useState<CreatePoziciyaDto>({
    artikul: '',
    nazvanie: '',
    kolichestvo: 1,
    sebestoimostBazovaya: 0,
  });

  const isDevMode = !!token;

  const { data: polet, isLoading, error } = useQuery({
    queryKey: ['admin', 'polet', poletId, initData],
    queryFn: () => api.getAdminPolet(initData, poletId),
    enabled: !!poletId && (!!initData || isDevMode),
  });

  const addPoziciyaMutation = useMutation({
    mutationFn: (data: CreatePoziciyaDto) => api.addPoziciya(initData, poletId, data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin', 'polet', poletId] });
      setAddPoziciyaDialogOpen(false);
      setPoziciyaFormData({
        artikul: '',
        nazvanie: '',
        kolichestvo: 1,
        sebestoimostBazovaya: 0,
      });
    },
  });

  const prinyatMutation = useMutation({
    mutationFn: () => api.prinyatPolet(initData, poletId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin', 'polet', poletId] });
    },
  });

  const sozdanieTovarovMutation = useMutation({
    mutationFn: () => api.sozdanieTovarov(initData, poletId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin', 'polet', poletId] });
    },
  });

  const provestiMutation = useMutation({
    mutationFn: () => api.provestiPolet(initData, poletId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin', 'polet', poletId] });
    },
  });

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Загрузка...</div>
      </div>
    );
  }

  if (error || !polet) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center text-red-600">Ошибка загрузки полета</div>
        <Button onClick={() => router.push('/admin/polet')} className="mt-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Назад к списку
        </Button>
      </div>
    );
  }

  const canEdit = polet.status === 'DRAFT';
  const canPrinyat = polet.status === 'DRAFT' && polet.pozicii.length > 0;
  const canSozdanieTovarov = polet.status === 'ACCEPTED' && polet.pozicii.some((p) => !p.tovarId);
  const canProvesti = polet.status === 'ACCEPTED' && polet.pozicii.some((p) => p.tovarId);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Button variant="ghost" onClick={() => router.push('/admin/polet')} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Назад к списку
        </Button>
        <h1 className="text-3xl font-bold">{polet.nazvanie}</h1>
        <div className="flex items-center gap-2 mt-2">
          <Badge variant={statusVariants[polet.status] || 'secondary'}>
            {statusLabels[polet.status] || polet.status}
          </Badge>
          <span className="text-muted-foreground">
            {metodLabels[polet.metodRaspredeleniya] || polet.metodRaspredeleniya}
          </span>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Сводка</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Стоимость полета:</span>
              <span className="font-medium">{formatPrice(polet.stoimostPoleta)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Доставка:</span>
              <span className="font-medium">{formatPrice(polet.stoimostDostavki)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Прочие расходы:</span>
              <span className="font-medium">{formatPrice(polet.prochieRashody)}</span>
            </div>
            <div className="flex justify-between pt-2 border-t">
              <span className="font-semibold">Итого:</span>
              <span className="font-bold text-lg">{formatPrice(polet.obshayaSummaZatrat)}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Действия</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {canEdit && (
              <Button
                onClick={() => setAddPoziciyaDialogOpen(true)}
                className="w-full"
                variant="outline"
              >
                <Plus className="w-4 h-4 mr-2" />
                Добавить позицию
              </Button>
            )}
            {canPrinyat && (
              <Button
                onClick={() => prinyatMutation.mutate()}
                disabled={prinyatMutation.isPending}
                className="w-full"
              >
                <Check className="w-4 h-4 mr-2" />
                {prinyatMutation.isPending ? 'Принятие...' : 'Принять полет'}
              </Button>
            )}
            {canSozdanieTovarov && (
              <Button
                onClick={() => sozdanieTovarovMutation.mutate()}
                disabled={sozdanieTovarovMutation.isPending}
                className="w-full"
                variant="outline"
              >
                <Package className="w-4 h-4 mr-2" />
                {sozdanieTovarovMutation.isPending ? 'Создание...' : 'Создать товары'}
              </Button>
            )}
            {canProvesti && (
              <Button
                onClick={() => provestiMutation.mutate()}
                disabled={provestiMutation.isPending}
                className="w-full"
              >
                <Warehouse className="w-4 h-4 mr-2" />
                {provestiMutation.isPending ? 'Проведение...' : 'Провести на склад'}
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Позиции полета</CardTitle>
          <CardDescription>
            {polet.pozicii.length} {polet.pozicii.length === 1 ? 'позиция' : 'позиций'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Название</TableHead>
                <TableHead>Артикул</TableHead>
                <TableHead className="text-right">Количество</TableHead>
                <TableHead className="text-right">Базовая себестоимость</TableHead>
                <TableHead className="text-right">Доставка на единицу</TableHead>
                <TableHead className="text-right">Себестоимость итого</TableHead>
                <TableHead>Товар</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {polet.pozicii.map((poz) => (
                <TableRow key={poz.id}>
                  <TableCell className="font-medium">{poz.nazvanie}</TableCell>
                  <TableCell>{poz.artikul || '-'}</TableCell>
                  <TableCell className="text-right">{poz.kolichestvo}</TableCell>
                  <TableCell className="text-right">{formatPrice(poz.sebestoimostBazovaya)}</TableCell>
                  <TableCell className="text-right">{formatPrice(poz.sebestoimostDostavka)}</TableCell>
                  <TableCell className="text-right font-semibold">
                    {formatPrice(poz.sebestoimostItogo)}
                  </TableCell>
                  <TableCell>
                    {poz.tovar ? (
                      <Button
                        variant="link"
                        onClick={() => router.push(`/admin/products/${poz.tovar?.id}/edit`)}
                      >
                        {poz.tovar.title}
                      </Button>
                    ) : (
                      <span className="text-muted-foreground">Не создан</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={addPoziciyaDialogOpen} onOpenChange={setAddPoziciyaDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Добавить позицию</DialogTitle>
            <DialogDescription>Заполните данные для новой позиции</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="poziciya-nazvanie">Название *</Label>
              <Input
                id="poziciya-nazvanie"
                value={poziciyaFormData.nazvanie}
                onChange={(e) => setPoziciyaFormData({ ...poziciyaFormData, nazvanie: e.target.value })}
                placeholder="Название товара"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="poziciya-artikul">Артикул</Label>
              <Input
                id="poziciya-artikul"
                value={poziciyaFormData.artikul}
                onChange={(e) => setPoziciyaFormData({ ...poziciyaFormData, artikul: e.target.value })}
                placeholder="Артикул (необязательно)"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="poziciya-kolichestvo">Количество *</Label>
              <Input
                id="poziciya-kolichestvo"
                type="number"
                value={poziciyaFormData.kolichestvo}
                onChange={(e) =>
                  setPoziciyaFormData({ ...poziciyaFormData, kolichestvo: parseInt(e.target.value) || 1 })
                }
                min="1"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="poziciya-sebestoimost">Базовая себестоимость (копейки) *</Label>
              <Input
                id="poziciya-sebestoimost"
                type="number"
                value={poziciyaFormData.sebestoimostBazovaya}
                onChange={(e) =>
                  setPoziciyaFormData({
                    ...poziciyaFormData,
                    sebestoimostBazovaya: parseInt(e.target.value) || 0,
                  })
                }
                min="0"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddPoziciyaDialogOpen(false)}>
              Отмена
            </Button>
            <Button
              onClick={() => addPoziciyaMutation.mutate(poziciyaFormData)}
              disabled={addPoziciyaMutation.isPending || !poziciyaFormData.nazvanie.trim()}
            >
              {addPoziciyaMutation.isPending ? 'Добавление...' : 'Добавить'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

