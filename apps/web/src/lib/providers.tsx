'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEffect, useState, useRef, type ReactNode } from 'react';

import { api } from './api';
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

  const hasCalledStartup = useRef(false);

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

    // Call /me endpoint on startup to authenticate user and create analytics
    // This ensures users are created in DB and APP_OPEN events are tracked
    if (!hasCalledStartup.current) {
      hasCalledStartup.current = true;
      const initData = getInitData();
      
      if (initData) {
        // Fire and forget - don't block UI if this fails
        api.getMeStartup(initData).catch((error) => {
          // Only log in dev mode to avoid console noise in production
          if (process.env.NODE_ENV === 'development') {
            console.error('[Startup] Failed to call /me:', error);
          }
        });
      }
    }
  }, []);

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}



