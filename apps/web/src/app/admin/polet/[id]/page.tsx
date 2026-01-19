'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Plus, Check, Package, Warehouse, Box } from 'lucide-react';
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

export default function AdminPoletDetailPage(): JSX.Element {
  const router = useRouter();
  const params = useParams();
  const poletId = params.id as string;
  const { initData } = useTelegram();
  const queryClient = useQueryClient();
  const token = getTokenFromUrl();
  const [addPoziciyaDialogOpen, setAddPoziciyaDialogOpen] = useState(false);
  const [poziciyaFormData, setPoziciyaFormData] = useState<CreatePoziciyaDto>({
    nazvanie: '',
    kolichestvo: 1,
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
        nazvanie: '',
        kolichestvo: 1,
      });
    },
  });

  const poluchenMutation = useMutation({
    mutationFn: () => api.poluchenPolet(initData, poletId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin', 'polet', poletId] });
    },
  });

  const razobratMutation = useMutation({
    mutationFn: () => api.razobratPolet(initData, poletId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin', 'polet', poletId] });
    },
  });

  const sozdatTovarMutation = useMutation({
    mutationFn: (poziciyaId: string) => api.sozdatTovar(initData, poletId, poziciyaId),
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

  const canPoluchen = polet.status === 'DRAFT';
  const canAddPoziciya = polet.status === 'RECEIVED';
  const canRazobrat = polet.status === 'RECEIVED' && polet.pozicii.length > 0;
  const canSozdatTovar = polet.status === 'DISASSEMBLED';
  const canProvesti = polet.status === 'DISASSEMBLED' && polet.pozicii.some((p) => p.tovarId);

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
          {polet.primernoeKolvo && (
            <span className="text-muted-foreground">Примерное кол-во: {polet.primernoeKolvo}</span>
          )}
        </div>
        {polet.status === 'DRAFT' && (
          <p className="text-sm text-muted-foreground mt-2">
            💡 Состав полета определяется после получения
          </p>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-2 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Сводка</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Цена полета:</span>
              <span className="font-medium">{formatPrice(polet.cenaPoleta)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Доставка:</span>
              <span className="font-medium">{formatPrice(polet.dostavka)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Прочие расходы:</span>
              <span className="font-medium">{formatPrice(polet.prochieRashody)}</span>
            </div>
            <div className="flex justify-between pt-2 border-t">
              <span className="font-semibold">Итого:</span>
              <span className="font-bold text-lg">{formatPrice(polet.obshayaSumma)}</span>
            </div>
            {polet.status === 'RECEIVED' && polet.pozicii.length > 0 && (
              <div className="flex justify-between pt-2 border-t">
                <span className="text-muted-foreground">Себестоимость на единицу:</span>
                <span className="font-medium">
                  {formatPrice(polet.pozicii[0]?.sebestoimostNaEd || 0)}
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Действия</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {canPoluchen && (
              <Button
                onClick={() => poluchenMutation.mutate()}
                disabled={poluchenMutation.isPending}
                className="w-full"
              >
                <Check className="w-4 h-4 mr-2" />
                {poluchenMutation.isPending ? 'Отметка...' : 'Получен'}
              </Button>
            )}
            {canAddPoziciya && (
              <Button
                onClick={() => setAddPoziciyaDialogOpen(true)}
                className="w-full"
                variant="outline"
              >
                <Plus className="w-4 h-4 mr-2" />
                Добавить позицию
              </Button>
            )}
            {canRazobrat && (
              <Button
                onClick={() => razobratMutation.mutate()}
                disabled={razobratMutation.isPending}
                className="w-full"
                variant="outline"
              >
                <Box className="w-4 h-4 mr-2" />
                {razobratMutation.isPending ? 'Разборка...' : 'Разобрать'}
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

      {polet.status === 'RECEIVED' || polet.status === 'DISASSEMBLED' || polet.status === 'POSTED' ? (
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
                  <TableHead className="text-right">Количество</TableHead>
                  <TableHead className="text-right">Себестоимость на ед.</TableHead>
                  <TableHead className="text-right">Итого себестоимость</TableHead>
                  <TableHead>Товар</TableHead>
                  {canSozdatTovar && <TableHead className="text-right">Действия</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {polet.pozicii.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground">
                      Нет позиций. Добавьте первую позицию после получения полета.
                    </TableCell>
                  </TableRow>
                ) : (
                  polet.pozicii.map((poz) => (
                    <TableRow key={poz.id}>
                      <TableCell className="font-medium">{poz.nazvanie}</TableCell>
                      <TableCell className="text-right">{poz.kolichestvo}</TableCell>
                      <TableCell className="text-right">{formatPrice(poz.sebestoimostNaEd)}</TableCell>
                      <TableCell className="text-right font-semibold">
                        {formatPrice(poz.sebestoimostNaEd * poz.kolichestvo)}
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
                      {canSozdatTovar && (
                        <TableCell className="text-right">
                          {!poz.tovarId && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => sozdatTovarMutation.mutate(poz.id)}
                              disabled={sozdatTovarMutation.isPending}
                            >
                              <Package className="w-4 h-4 mr-1" />
                              Создать товар
                            </Button>
                          )}
                        </TableCell>
                      )}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              Позиции появятся после отметки полета как «Получен»
            </p>
          </CardContent>
        </Card>
      )}

      <Dialog open={addPoziciyaDialogOpen} onOpenChange={setAddPoziciyaDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Добавить позицию</DialogTitle>
            <DialogDescription>
              Себестоимость будет рассчитана автоматически на основе общей суммы полета
            </DialogDescription>
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
