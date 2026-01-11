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
    enabled: !!initData && isTelegram,
    refetchInterval: 45000, // Poll every 45 seconds
    retry: false,
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

  return {
    unreadCount: data?.unreadCount ?? 0,
    isLoading,
    error: error as Error | null,
  };
}

