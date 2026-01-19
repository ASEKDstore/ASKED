'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Boxes, Plus, Eye, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
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
import { api, type CreatePoletDto } from '@/lib/api';
import { formatPrice } from '@/lib/utils';

const statusLabels: Record<string, string> = {
  DRAFT: 'Черновик',
  RECEIVED: 'Получен',
  DISASSEMBLED: 'Разобран',
  POSTED: 'Проведен',
  CANCELED: 'Отменен',
};

const statusVariants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  DRAFT: 'secondary',
  RECEIVED: 'default',
  DISASSEMBLED: 'outline',
  POSTED: 'outline',
  CANCELED: 'destructive',
};

export default function AdminPoletPage(): JSX.Element {
  const router = useRouter();
  const { initData } = useTelegram();
  const queryClient = useQueryClient();
  const token = getTokenFromUrl();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [poletToDelete, setPoletToDelete] = useState<string | null>(null);
  const [formData, setFormData] = useState<CreatePoletDto>({
    nazvanie: '',
    cenaPoletaRub: 0,
    dostavkaRub: 0,
    prochieRashodyRub: 0,
    primernoeKolvo: undefined,
  });

  const isDevMode = !!token;

  const { data: poleti, isLoading, error } = useQuery({
    queryKey: ['admin', 'poleti', initData],
    queryFn: () => api.getAdminPoleti(initData),
    enabled: !!initData || isDevMode,
  });

  const createMutation = useMutation({
    mutationFn: (data: CreatePoletDto) => api.createAdminPolet(initData, data),
    onSuccess: async (newPolet) => {
      await queryClient.invalidateQueries({ queryKey: ['admin', 'poleti'] });
      setCreateDialogOpen(false);
      setFormData({
        nazvanie: '',
        cenaPoletaRub: 0,
        dostavkaRub: 0,
        prochieRashodyRub: 0,
        primernoeKolvo: undefined,
      });
      router.push(`/admin/polet/${newPolet.id}`);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.deleteAdminPolet(initData, id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin', 'poleti'] });
      setDeleteDialogOpen(false);
      setPoletToDelete(null);
    },
  });

  const handleDelete = (id: string) => {
    setPoletToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (poletToDelete) {
      deleteMutation.mutate(poletToDelete);
    }
  };

  const handleCreate = () => {
    if (!formData.nazvanie.trim()) {
      return;
    }
    createMutation.mutate(formData);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Загрузка...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center text-red-600">
          Ошибка загрузки паллет
          {error instanceof Error && (
            <div className="mt-2 text-sm text-muted-foreground">{error.message}</div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Boxes className="w-8 h-8" />
            Паллеты
          </h1>
          <p className="text-muted-foreground mt-1">Управление паллетами и расчет себестоимости</p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Создать паллету
        </Button>
      </div>

      {poleti && poleti.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground mb-4">Пока нет паллет</p>
            <Button onClick={() => setCreateDialogOpen(true)}>Создать первую паллету</Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Список паллет</CardTitle>
            <CardDescription>Все паллеты системы</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Название</TableHead>
                  <TableHead>Статус</TableHead>
                  <TableHead>Общая сумма</TableHead>
                  <TableHead>Примерное кол-во</TableHead>
                  <TableHead>Дата создания</TableHead>
                  <TableHead className="text-right">Действия</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {poleti?.map((polet) => (
                  <TableRow key={polet.id}>
                    <TableCell className="font-medium">{polet.nazvanie}</TableCell>
                    <TableCell>
                      <Badge variant={statusVariants[polet.status] || 'secondary'}>
                        {statusLabels[polet.status] || polet.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatPrice(polet.obshayaSummaRub)}</TableCell>
                    <TableCell>{polet.primernoeKolvo || '-'}</TableCell>
                    <TableCell>{new Date(polet.createdAt).toLocaleDateString('ru-RU')}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => router.push(`/admin/polet/${polet.id}`)}
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          Открыть
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(polet.id)}
                          disabled={deleteMutation.isPending}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
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

      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Создать паллету</DialogTitle>
            <DialogDescription>Заполните данные для новой паллеты</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="nazvanie">Название *</Label>
              <Input
                id="nazvanie"
                value={formData.nazvanie}
                onChange={(e) => setFormData({ ...formData, nazvanie: e.target.value })}
                placeholder="Например: Паллета №1 Global Mini"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="cenaPoletaRub">Цена паллеты (рубли) *</Label>
              <Input
                id="cenaPoletaRub"
                type="number"
                value={formData.cenaPoletaRub}
                onChange={(e) => setFormData({ ...formData, cenaPoletaRub: parseInt(e.target.value) || 0 })}
                placeholder="в рублях"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="dostavkaRub">Доставка (рубли) *</Label>
              <Input
                id="dostavkaRub"
                type="number"
                value={formData.dostavkaRub}
                onChange={(e) => setFormData({ ...formData, dostavkaRub: parseInt(e.target.value) || 0 })}
                placeholder="в рублях"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="primernoeKolvo">Примерное количество (опционально)</Label>
              <Input
                id="primernoeKolvo"
                type="number"
                value={formData.primernoeKolvo || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    primernoeKolvo: e.target.value ? parseInt(e.target.value) : undefined,
                  })
                }
                placeholder="Примерное количество единиц"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="prochieRashodyRub">Прочие расходы (рубли)</Label>
              <Input
                id="prochieRashodyRub"
                type="number"
                value={formData.prochieRashodyRub}
                onChange={(e) => setFormData({ ...formData, prochieRashodyRub: parseInt(e.target.value) || 0 })}
                placeholder="в рублях"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              Отмена
            </Button>
            <Button onClick={handleCreate} disabled={createMutation.isPending || !formData.nazvanie.trim()}>
              {createMutation.isPending ? 'Создание...' : 'Создать'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить паллету?</AlertDialogTitle>
            <AlertDialogDescription>
              Паллета будет скрыта из списка (мягкое удаление). Это действие можно отменить позже.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={deleteMutation.isPending}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteMutation.isPending ? 'Удаление...' : 'Удалить'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

