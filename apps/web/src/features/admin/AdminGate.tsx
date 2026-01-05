'use client';

import { AlertCircle, Lock } from 'lucide-react';
import { useEffect, useState } from 'react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface AdminGateProps {
  children: React.ReactNode;
}

interface TelegramState {
  hasWebApp: boolean;
  initDataLen: number;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export function AdminGate({ children }: AdminGateProps): JSX.Element {
  const [telegramState, setTelegramState] = useState<TelegramState>({
    hasWebApp: false,
    initDataLen: 0,
  });
  const [authStatus, setAuthStatus] = useState<'checking' | 'authorized' | 'unauthorized' | 'forbidden' | 'error'>('checking');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Get Telegram WebApp
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const wa = typeof window !== 'undefined' ? (window as any).Telegram?.WebApp : null;

    if (!wa) {
      setTelegramState({ hasWebApp: false, initDataLen: 0 });
      setAuthStatus('unauthorized');
      setIsLoading(false);
      return;
    }

    // Initialize Telegram WebApp
    try {
      wa.ready?.();
      wa.expand?.();
    } catch (error) {
      console.error('[AdminGate] Error initializing Telegram WebApp:', error);
    }

    // Get initData
    const initData = wa.initData ?? '';

    setTelegramState({
      hasWebApp: true,
      initDataLen: initData.length,
    });

    // If initData is empty, show error
    if (initData.length === 0) {
      setAuthStatus('unauthorized');
      setIsLoading(false);
      return;
    }

    // Make request to /admin/me
    fetch(`${API_BASE_URL}/admin/me`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-telegram-init-data': initData,
      },
    })
      .then((response) => {
        if (response.status === 200) {
          setAuthStatus('authorized');
        } else if (response.status === 401) {
          setAuthStatus('unauthorized');
        } else if (response.status === 403) {
          setAuthStatus('forbidden');
        } else {
          setAuthStatus('error');
        }
      })
      .catch((error) => {
        console.error('[AdminGate] Error checking admin access:', error);
        setAuthStatus('error');
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  // Show loading state
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

  // Not in Telegram WebApp
  if (!telegramState.hasWebApp) {
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

  // In Telegram but initData is empty
  if (telegramState.initDataLen === 0) {
    return (
      <div className="container mx-auto px-4 py-12">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertCircle className="w-6 h-6 text-orange-500" />
              <CardTitle>Откройте из Telegram</CardTitle>
            </div>
            <CardDescription>
              Не удалось получить данные авторизации. Попробуйте открыть приложение через кнопку в Telegram.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm text-gray-600">
              <p>Убедитесь, что вы открыли приложение через Telegram WebApp.</p>
              <p>Если проблема сохраняется, попробуйте перезагрузить страницу.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // 401 - Unauthorized
  if (authStatus === 'unauthorized') {
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

  // 403 - Forbidden
  if (authStatus === 'forbidden') {
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

  // Error
  if (authStatus === 'error') {
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

  // Authorized - show children
  if (authStatus === 'authorized') {
    return (
      <>
        {children}
        {/* Diagnostic info (always visible for debugging) */}
        <div className="fixed bottom-0 left-0 right-0 bg-black/80 text-white text-xs p-2 text-center z-50">
          TG WebApp: {telegramState.hasWebApp ? 'yes' : 'no'} | initData length: {telegramState.initDataLen}
        </div>
      </>
    );
  }

  return <>{children}</>;
}

