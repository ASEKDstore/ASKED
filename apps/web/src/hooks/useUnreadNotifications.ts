import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';

import { useTelegram } from '@/hooks/useTelegram';
import { api } from '@/lib/api';

/**
 * Hook to fetch and poll unread notifications count
 * Polls every 45 seconds or refetches on window focus
 */
export function useUnreadNotifications(): {
  unreadCount: number;
  isLoading: boolean;
  error: Error | null;
  isAuthError: boolean;
} {
  const { initData, isTelegram } = useTelegram();

  const {
    data,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['notifications', 'unreadCount', initData],
    queryFn: () => api.getUnreadCount(initData),
    // Always try to fetch if in Telegram (initData will be auto-detected by API client)
    // This ensures the request is made even if initData is not immediately available
    enabled: isTelegram,
    refetchInterval: 45000, // Poll every 45 seconds
    retry: (failureCount, error) => {
      // Don't retry on auth errors (401/403)
      if (error instanceof Error && 'statusCode' in error) {
        const statusCode = (error as { statusCode?: number }).statusCode;
        if (statusCode === 401 || statusCode === 403) {
          return false;
        }
      }
      return failureCount < 2;
    },
  });

  // Refetch on window focus
  useEffect(() => {
    const handleFocus = () => {
      if (document.visibilityState === 'visible') {
        void refetch();
      }
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleFocus);

    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleFocus);
    };
  }, [refetch]);

  // Check if error is auth-related (401/403)
  const isAuthError = error && 'statusCode' in error && 
    ((error as { statusCode?: number }).statusCode === 401 || 
     (error as { statusCode?: number }).statusCode === 403);

  return {
    unreadCount: data?.unreadCount ?? 0,
    isLoading,
    error: error as Error | null,
    isAuthError: isAuthError ?? false,
  };
}

