'use client';

import { useQuery } from '@tanstack/react-query';
import { AlertCircle, Lock } from 'lucide-react';

import { LabLoadingScreen } from '@/components/lab/LabLoadingScreen';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useTelegram } from '@/hooks/useTelegram';
import { api } from '@/lib/api';
import { isInTelegramWebApp } from '@/lib/telegram';

interface AdminGuardProps {
  children: React.ReactNode;
}

export function AdminGuard({ children }: AdminGuardProps): JSX.Element {
  const isTelegram = isInTelegramWebApp();
  const { webApp } = useTelegram();

  const { data, isLoading, error } = useQuery({
    queryKey: ['admin', 'me'],
    queryFn: () => api.getAdminMe(null), // initData will be added automatically by api client
    enabled: isTelegram,
    retry: false,
  });

  const telegramUser = webApp?.initDataUnsafe?.user;
  const userName = telegramUser?.first_name || undefined;
  const avatarUrl = telegramUser?.photo_url || undefined;

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
    return <LabLoadingScreen userName={userName} avatarUrl={avatarUrl} />;
  }

  if (error || !data) {
    const statusCode = (error as { statusCode?: number })?.statusCode;
    
    // 401 means initData is empty or invalid
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

    // 403 means user doesn't have admin access
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

