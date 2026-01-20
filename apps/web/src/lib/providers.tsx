'use client';

import { QueryClient, QueryClientProvider, keepPreviousData } from '@tanstack/react-query';
import { useEffect, useState, useRef, type ReactNode } from 'react';

import { api } from './api';
import { initTelegram, getTelegramWebApp, getInitData } from './telegram';

export function Providers({ children }: { children: ReactNode }): JSX.Element {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30 * 1000, // 30s for public data (products, banners, lab works)
            refetchOnWindowFocus: false, // Avoid Telegram focus spam
            retry: (failureCount, error: unknown) => {
              // Don't retry on 4xx errors
              if (error && typeof error === 'object' && 'statusCode' in error) {
                const statusCode = (error as { statusCode?: number }).statusCode;
                if (statusCode && statusCode >= 400 && statusCode < 500) {
                  return false;
                }
              }
              // Retry once for other errors
              return failureCount < 1;
            },
            placeholderData: keepPreviousData, // Prevent flicker on paginated lists
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

    // Call /users/me endpoint on startup to authenticate user and create/update AppUser
    // This ensures users are created in DB and APP_OPEN events are tracked
    if (!hasCalledStartup.current) {
      hasCalledStartup.current = true;
      const initData = getInitData();
      
      if (initData) {
        // Fire and forget - don't block UI if this fails
        api.getMe(initData).catch((error) => {
          // Log in dev mode to help debug user creation issues
          if (process.env.NODE_ENV === 'development') {
            console.error('[Startup] Failed to call /users/me:', error);
            // Show temporary debug message in dev mode
            if (typeof window !== 'undefined') {
              const debugDiv = document.createElement('div');
              debugDiv.style.cssText = 'position:fixed;top:10px;right:10px;background:red;color:white;padding:8px;z-index:9999;font-size:12px;border-radius:4px;';
              debugDiv.textContent = `User creation failed: ${error instanceof Error ? error.message : String(error)}`;
              document.body.appendChild(debugDiv);
              setTimeout(() => debugDiv.remove(), 5000);
            }
          }
        });
      } else if (process.env.NODE_ENV === 'development') {
        // Log warning if no initData in dev mode
        console.warn('[Startup] No Telegram initData available - user will not be created');
      }
    }
  }, []);

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}



