'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEffect, useState, type ReactNode } from 'react';

import { initTelegram, getTelegramWebApp, getInitData } from './telegram';

export function Providers({ children }: { children: ReactNode }): JSX.Element {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
          },
        },
      })
  );

  useEffect(() => {
    initTelegram();

    // Diagnostic logging in dev mode
    if (process.env.NODE_ENV === 'development') {
      const wa = getTelegramWebApp();
      const initData = getInitData();
      console.log('[TG]', {
        hasWebApp: !!wa,
        initDataLen: initData.length,
      });
    }
  }, []);

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}



