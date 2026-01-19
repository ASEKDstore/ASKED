'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Boxes, Plus, Eye } from 'lucide-react';
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
  const [formData, setFormData] = useState<CreatePoletDto>({
    nazvanie: '',
    cenaPoleta: 0,
    dostavka: 0,
    prochieRashody: 0,
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
        cenaPoleta: 0,
        dostavka: 0,
        prochieRashody: 0,
        primernoeKolvo: undefined,
      });
      router.push(`/admin/polet/${newPolet.id}`);
    },
  });

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
                    <TableCell>{formatPrice(polet.obshayaSumma)}</TableCell>
                    <TableCell>{polet.primernoeKolvo || '-'}</TableCell>
                    <TableCell>{new Date(polet.createdAt).toLocaleDateString('ru-RU')}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => router.push(`/admin/polet/${polet.id}`)}
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        Открыть
                      </Button>
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
              <Label htmlFor="cenaPoleta">Цена паллеты (копейки) *</Label>
              <Input
                id="cenaPoleta"
                type="number"
                value={formData.cenaPoleta}
                onChange={(e) => setFormData({ ...formData, cenaPoleta: parseInt(e.target.value) || 0 })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="dostavka">Доставка (копейки) *</Label>
              <Input
                id="dostavka"
                type="number"
                value={formData.dostavka}
                onChange={(e) => setFormData({ ...formData, dostavka: parseInt(e.target.value) || 0 })}
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
              <Label htmlFor="prochieRashody">Прочие расходы (копейки)</Label>
              <Input
                id="prochieRashody"
                type="number"
                value={formData.prochieRashody}
                onChange={(e) => setFormData({ ...formData, prochieRashody: parseInt(e.target.value) || 0 })}
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
    </div>
  );
}

