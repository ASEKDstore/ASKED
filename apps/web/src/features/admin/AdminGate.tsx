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

interface DebugInfo {
  hasWindow: boolean;
  hasTelegramObject: boolean;
  hasWebApp: boolean;
  initDataLength: number;
  initDataPreview: string;
  platform: string;
  version: string;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
const DEV_ADMIN_TOKEN = process.env.NEXT_PUBLIC_ADMIN_DEV_TOKEN || 'ASKED_DEV_ADMIN';

export function AdminGate({ children }: AdminGateProps): JSX.Element {
  const [telegramState, setTelegramState] = useState<TelegramState>({
    hasWebApp: false,
    initDataLen: 0,
  });
  const [authStatus, setAuthStatus] = useState<'checking' | 'authorized' | 'unauthorized' | 'forbidden' | 'error'>('checking');
  const [isLoading, setIsLoading] = useState(true);
  const [debugInfo, setDebugInfo] = useState<DebugInfo>({
    hasWindow: false,
    hasTelegramObject: false,
    hasWebApp: false,
    initDataLength: 0,
    initDataPreview: '',
    platform: '',
    version: '',
  });

  useEffect(() => {
    // TEMP DEV ACCESS — remove after Telegram WebApp enabled
    // Check for dev token in query params if Telegram WebApp is not available
    const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
    const tokenParam = urlParams?.get('token') ?? null;
    const hasValidDevToken = tokenParam === DEV_ADMIN_TOKEN;

    // Get Telegram WebApp
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const hasWindow = typeof window !== 'undefined';
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const telegramObj = hasWindow ? (window as any).Telegram : null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const wa = telegramObj?.WebApp ?? null;

    // Collect debug info
    const initData = wa?.initData ?? '';
    const debug: DebugInfo = {
      hasWindow,
      hasTelegramObject: !!telegramObj,
      hasWebApp: !!wa,
      initDataLength: initData.length,
      initDataPreview: initData.length > 0 ? initData.substring(0, 20) : '',
      platform: wa?.platform ?? '',
      version: wa?.version ?? '',
    };
    setDebugInfo(debug);

    // TEMP DEV ACCESS — if no Telegram WebApp but valid dev token, allow access
    if (!wa && hasValidDevToken) {
      setTelegramState({ hasWebApp: false, initDataLen: 0 });
      setAuthStatus('authorized');
      setIsLoading(false);
      return;
    }

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

    // Get initData (already collected in debug info above)
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

  // Helper function to render debug panel
  const renderDebugPanel = () => (
    <Card className="mt-4 bg-gray-100 border-gray-300">
      <CardHeader>
        <CardTitle className="text-sm">DEBUG Info</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-1 text-xs font-mono">
          <div>hasWindow: {debugInfo.hasWindow ? 'true' : 'false'}</div>
          <div>hasTelegramObject: {debugInfo.hasTelegramObject ? 'true' : 'false'}</div>
          <div>hasWebApp: {debugInfo.hasWebApp ? 'true' : 'false'}</div>
          <div>initDataLength: {debugInfo.initDataLength}</div>
          <div>initDataPreview: {debugInfo.initDataPreview || '(empty)'}</div>
          <div>platform: {debugInfo.platform || '(empty)'}</div>
          <div>version: {debugInfo.version || '(empty)'}</div>
        </div>
      </CardContent>
    </Card>
  );

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
        {renderDebugPanel()}
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
        {renderDebugPanel()}
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
        {renderDebugPanel()}
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

