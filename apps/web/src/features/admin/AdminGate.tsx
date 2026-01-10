'use client';

import { useQuery } from '@tanstack/react-query';
import { AlertCircle, Lock } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { api } from '@/lib/api';
import { isInTelegramWebApp } from '@/lib/telegram';

interface AdminGateProps {
  children: React.ReactNode;
}

const DEV_ADMIN_TOKEN = process.env.NEXT_PUBLIC_ADMIN_DEV_TOKEN ?? '';

function AdminGateContent({ children }: AdminGateProps): JSX.Element {
  const searchParams = useSearchParams();
  const isTelegram = isInTelegramWebApp();
  
  // Check dev token first (bypasses all checks if valid)
  const token = searchParams.get('token') ?? '';
  const hasDevToken = DEV_ADMIN_TOKEN !== '' && token === DEV_ADMIN_TOKEN;

  // Use React Query for caching and proper state management
  const { data, isLoading, error } = useQuery({
    queryKey: ['admin', 'me', token], // Include token in key for dev mode
    queryFn: () => api.getAdminMe(null), // initData will be added automatically by api client
    enabled: isTelegram || hasDevToken, // Only run if in Telegram or has dev token
    retry: false,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
  });

  // Show loading state WHILE checking (not after error)
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

  // Dev token bypass - authorized immediately
  if (hasDevToken) {
    return <>{children}</>;
  }

  // Not in Telegram WebApp
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

  // Error handling - only show errors AFTER loading completes
  if (error) {
    const statusCode = (error as { statusCode?: number })?.statusCode;
    
    // 401 - Unauthorized (empty or invalid initData)
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

    // 403 - Forbidden (user is not admin)
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

    // Other errors
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

  // Authorized - show children (data exists and no error)
  if (data) {
    return <>{children}</>;
  }

  // Fallback (should not reach here, but just in case)
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

export function AdminGate({ children }: AdminGateProps): JSX.Element {
  return (
    <Suspense fallback={
      <div className="container mx-auto px-4 py-12">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
          <p className="mt-4 text-gray-600">Загрузка...</p>
        </div>
      </div>
    }>
      <AdminGateContent>{children}</AdminGateContent>
    </Suspense>
  );
}

