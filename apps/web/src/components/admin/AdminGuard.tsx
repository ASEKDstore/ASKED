'use client';

import { useQuery } from '@tanstack/react-query';
import { AlertCircle, Lock } from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useTelegram } from '@/hooks/useTelegram';
import { api } from '@/lib/api';

interface AdminGuardProps {
  children: React.ReactNode;
}

export function AdminGuard({ children }: AdminGuardProps): JSX.Element {
  const { initData, isTelegram } = useTelegram();

  const { data, isLoading, error } = useQuery({
    queryKey: ['admin', 'me', initData],
    queryFn: () => api.getAdminMe(initData),
    enabled: !!initData && isTelegram,
    retry: false,
  });

  if (!isTelegram) {
    return (
      <div className="container mx-auto px-4 py-12">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertCircle className="w-6 h-6 text-orange-500" />
              <CardTitle>Откройте из Telegram</CardTitle>
            </div>
            <CardDescription>
              Для доступа к админ-панели необходимо открыть приложение через
              Telegram WebApp.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm text-gray-600">
              <p>1. Откройте Telegram на вашем устройстве</p>
              <p>2. Найдите бота или ссылку на это приложение</p>
              <p>3. Нажмите, чтобы открыть</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
          <p className="mt-4 text-gray-600">Проверка доступа...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    const statusCode = (error as { statusCode?: number })?.statusCode;
    
    if (statusCode === 401) {
      return (
        <div className="container mx-auto px-4 py-12">
          <Card className="max-w-md mx-auto">
            <CardHeader>
              <div className="flex items-center gap-2">
                <AlertCircle className="w-6 h-6 text-orange-500" />
                <CardTitle>Откройте из Telegram</CardTitle>
              </div>
              <CardDescription>
                Для доступа к админ-панели необходимо открыть приложение через
                Telegram WebApp.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      );
    }

    if (statusCode === 403) {
      return (
        <div className="container mx-auto px-4 py-12">
          <Card className="max-w-md mx-auto">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Lock className="w-6 h-6 text-red-500" />
                <CardTitle>Нет доступа</CardTitle>
              </div>
              <CardDescription>
                У вас нет прав для доступа к админ-панели. Обратитесь к
                администратору.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      );
    }

    return (
      <div className="container mx-auto px-4 py-12">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle>Ошибка</CardTitle>
            <CardDescription>
              Не удалось проверить доступ. Попробуйте обновить страницу.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}

