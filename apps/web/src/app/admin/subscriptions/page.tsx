'use client';

import { Repeat, Plus, Edit, Trash2 } from 'lucide-react';
// eslint-disable-next-line import/order
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
import { api, type Subscription, type CreateSubscriptionDto, type UpdateSubscriptionDto } from '@/lib/api';
import { formatDate, dateToInputValue, inputValueToDate } from '@/lib/utils';

export default function AdminSubscriptionsPage(): JSX.Element {
  const { initData } = useTelegram();
  const queryClient = useQueryClient();
  const token = getTokenFromUrl();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedSubscription, setSelectedSubscription] = useState<Subscription | null>(null);
  const [formData, setFormData] = useState<CreateSubscriptionDto>({
    name: '',
    provider: null,
    lastPaidAt: new Date().toISOString(),
    periodMonths: 1,
    remindBeforeDays: 1,
    isActive: true,
  });

  // TEMP DEV ADMIN ACCESS - remove after Telegram WebApp enabled
  const isDevMode = !!token;

  const { data: subscriptions, isLoading, error } = useQuery({
    queryKey: ['admin', 'subscriptions', initData],
    queryFn: () => api.getAdminSubscriptions(initData),
    enabled: !!initData || isDevMode,
    refetchOnWindowFocus: false,
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateSubscriptionDto) => api.createAdminSubscription(initData, data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin', 'subscriptions'] });
      setCreateDialogOpen(false);
      setFormData({
        name: '',
        provider: null,
        lastPaidAt: new Date().toISOString(),
        periodMonths: 1,
        remindBeforeDays: 1,
        isActive: true,
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateSubscriptionDto }) =>
      api.updateAdminSubscription(initData, id, data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin', 'subscriptions'] });
      setEditDialogOpen(false);
      setSelectedSubscription(null);
      setFormData({
        name: '',
        provider: null,
        lastPaidAt: new Date().toISOString(),
        periodMonths: 1,
        remindBeforeDays: 1,
        isActive: true,
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.deleteAdminSubscription(initData, id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin', 'subscriptions'] });
      setDeleteDialogOpen(false);
      setSelectedSubscription(null);
    },
  });

  const handleCreate = () => {
    createMutation.mutate(formData);
  };

  const handleEdit = (subscription: Subscription) => {
    setSelectedSubscription(subscription);
    setFormData({
      name: subscription.name,
      provider: subscription.provider,
      lastPaidAt: subscription.lastPaidAt,
      periodMonths: subscription.periodMonths,
      remindBeforeDays: subscription.remindBeforeDays,
      isActive: subscription.isActive,
    });
    setEditDialogOpen(true);
  };

  const handleUpdate = () => {
    if (selectedSubscription) {
      updateMutation.mutate({ id: selectedSubscription.id, data: formData });
    }
  };

  const handleDelete = (subscription: Subscription) => {
    setSelectedSubscription(subscription);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (selectedSubscription) {
      deleteMutation.mutate(selectedSubscription.id);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
          <p className="mt-4 text-gray-600">Загрузка подписок...</p>
        </div>
      </div>
    );
  }

  if (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStatus = (error as { statusCode?: number })?.statusCode;
    const isForbidden = errorStatus === 403;

    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Ошибка</CardTitle>
            <CardDescription>
              {isForbidden
                ? 'Нет доступа. Только администраторы могут управлять подписками.'
                : 'Не удалось загрузить подписки. Попробуйте обновить страницу.'}
            </CardDescription>
          </CardHeader>
          {isDevMode && !isForbidden && (
            <CardContent>
              <div className="text-sm text-red-600">
                Debug: {errorStatus ? `[${errorStatus}]` : ''} {errorMessage}
              </div>
            </CardContent>
          )}
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Подписки</h1>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Создать подписку
        </Button>
      </div>

      {!subscriptions || subscriptions.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Repeat className="w-16 h-16 text-gray-400 mb-4" />
            <p className="text-gray-600 text-lg mb-2">Подписки отсутствуют</p>
            <p className="text-gray-500 text-sm mb-4">
              Добавьте подписку через кнопку &quot;Создать подписку&quot;
            </p>
            <Button onClick={() => setCreateDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Создать подписку
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Список подписок</CardTitle>
            <CardDescription>Всего подписок: {subscriptions.length}</CardDescription>
          </CardHeader>
          <CardContent>
            {/* Mobile: Card layout */}
            <div className="md:hidden space-y-4">
              {subscriptions.map((subscription) => (
                <div
                  key={subscription.id}
                  className="border rounded-lg p-4 space-y-3 bg-white"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-semibold text-lg">{subscription.name}</div>
                      {subscription.provider && (
                        <div className="text-sm text-gray-500 mt-1">{subscription.provider}</div>
                      )}
                    </div>
                    <Badge variant={subscription.isActive ? 'default' : 'secondary'}>
                      {subscription.isActive ? 'Активна' : 'Неактивна'}
                    </Badge>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-gray-500">Последняя оплата:</span>{' '}
                      <span className="font-medium">{formatDate(subscription.lastPaidAt)}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Период:</span>{' '}
                      <span className="font-medium">{subscription.periodMonths} мес.</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Следующая оплата:</span>{' '}
                      <span className="font-medium">{formatDate(subscription.nextDueAt)}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Напоминать за:</span>{' '}
                      <span className="font-medium">{subscription.remindBeforeDays} дн.</span>
                    </div>
                  </div>
                  <div className="flex gap-2 pt-2 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleEdit(subscription)}
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Редактировать
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleDelete(subscription)}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Удалить
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop: Table layout */}
            <div className="hidden md:block overflow-x-auto scrollbar-hide">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Название</TableHead>
                    <TableHead>Провайдер</TableHead>
                    <TableHead>Последняя оплата</TableHead>
                    <TableHead>Период</TableHead>
                    <TableHead>Следующая оплата</TableHead>
                    <TableHead>Напоминать за</TableHead>
                    <TableHead>Статус</TableHead>
                    <TableHead className="text-right">Действия</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {subscriptions.map((subscription) => (
                    <TableRow key={subscription.id}>
                      <TableCell className="font-medium">{subscription.name}</TableCell>
                      <TableCell>{subscription.provider || '-'}</TableCell>
                      <TableCell>{formatDate(subscription.lastPaidAt)}</TableCell>
                      <TableCell>{subscription.periodMonths} мес.</TableCell>
                      <TableCell>{formatDate(subscription.nextDueAt)}</TableCell>
                      <TableCell>{subscription.remindBeforeDays} дн.</TableCell>
                      <TableCell>
                        <Badge variant={subscription.isActive ? 'default' : 'secondary'}>
                          {subscription.isActive ? 'Активна' : 'Неактивна'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(subscription)}
                          >
                            <Edit className="w-4 h-4 mr-1" />
                            Редактировать
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(subscription)}
                          >
                            <Trash2 className="w-4 h-4 mr-1" />
                            Удалить
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Create Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Создать подписку</DialogTitle>
            <DialogDescription>
              Заполните информацию о подписке. Следующая дата оплаты будет рассчитана автоматически.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Название *</label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Например: Подписка GPT"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Провайдер</label>
              <Input
                value={formData.provider || ''}
                onChange={(e) =>
                  setFormData({ ...formData, provider: e.target.value || null })
                }
                placeholder="Например: OpenAI"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Последняя оплата *</label>
              <Input
                type="datetime-local"
                value={dateToInputValue(formData.lastPaidAt)}
                onChange={(e) => {
                  if (e.target.value) {
                    setFormData({ ...formData, lastPaidAt: inputValueToDate(e.target.value) });
                  }
                }}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Период (месяцев) *</label>
                <Input
                  type="number"
                  min="1"
                  value={formData.periodMonths}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      periodMonths: parseInt(e.target.value, 10) || 1,
                    })
                  }
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Напоминать за (дней) *</label>
                <Input
                  type="number"
                  min="0"
                  max="30"
                  value={formData.remindBeforeDays}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      remindBeforeDays: parseInt(e.target.value, 10) || 1,
                    })
                  }
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="w-4 h-4 rounded border-gray-300"
              />
              <label htmlFor="isActive" className="text-sm font-medium">
                Активна
              </label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              Отмена
            </Button>
            <Button
              onClick={handleCreate}
              disabled={!formData.name || !formData.lastPaidAt || createMutation.isPending}
            >
              {createMutation.isPending ? 'Создание...' : 'Создать'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Редактировать подписку</DialogTitle>
            <DialogDescription>
              Обновите информацию о подписке. Следующая дата оплаты будет пересчитана при изменении последней оплаты или периода.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Название *</label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Например: Подписка GPT"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Провайдер</label>
              <Input
                value={formData.provider || ''}
                onChange={(e) =>
                  setFormData({ ...formData, provider: e.target.value || null })
                }
                placeholder="Например: OpenAI"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Последняя оплата *</label>
              <Input
                type="datetime-local"
                value={dateToInputValue(formData.lastPaidAt)}
                onChange={(e) => {
                  if (e.target.value) {
                    setFormData({ ...formData, lastPaidAt: inputValueToDate(e.target.value) });
                  }
                }}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Период (месяцев) *</label>
                <Input
                  type="number"
                  min="1"
                  value={formData.periodMonths}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      periodMonths: parseInt(e.target.value, 10) || 1,
                    })
                  }
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Напоминать за (дней) *</label>
                <Input
                  type="number"
                  min="0"
                  max="30"
                  value={formData.remindBeforeDays}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      remindBeforeDays: parseInt(e.target.value, 10) || 1,
                    })
                  }
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isActiveEdit"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="w-4 h-4 rounded border-gray-300"
              />
              <label htmlFor="isActiveEdit" className="text-sm font-medium">
                Активна
              </label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Отмена
            </Button>
            <Button
              onClick={handleUpdate}
              disabled={!formData.name || !formData.lastPaidAt || updateMutation.isPending}
            >
              {updateMutation.isPending ? 'Сохранение...' : 'Сохранить'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Удалить подписку?</DialogTitle>
            <DialogDescription>
              Вы уверены, что хотите удалить подписку &quot;{selectedSubscription?.name}&quot;?
              Подписка будет деактивирована (мягкое удаление).
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

