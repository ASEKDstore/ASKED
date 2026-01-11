'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Check, CheckCheck } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { HEADER_HEIGHT_PX } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { useTelegram } from '@/hooks/useTelegram';
import { api, type Notification } from '@/lib/api';

const BG_IMAGE_URL = '/home-bg.jpg';

function formatNotificationTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'только что';
  if (diffMins < 60) return `${diffMins} мин. назад`;
  if (diffHours < 24) return `${diffHours} ч. назад`;
  if (diffDays < 7) return `${diffDays} дн. назад`;

  return new Intl.DateTimeFormat('ru-RU', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export default function NotificationsPage(): JSX.Element {
  const { initData, isTelegram } = useTelegram();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [cursor, setCursor] = useState<string | undefined>(undefined);
  const [allNotifications, setAllNotifications] = useState<Notification[]>([]);

  const headerTotalHeight = `calc(${HEADER_HEIGHT_PX}px + env(safe-area-inset-top, 0px))`;

  const {
    data,
    isLoading,
    error,
    isFetching,
  } = useQuery({
    queryKey: ['notifications', 'my', initData, cursor],
    queryFn: async () => {
      const result = await api.getNotifications(initData, { limit: 20, cursor });
      return result;
    },
    enabled: !!initData && isTelegram,
  });

  // Reset notifications when cursor resets
  useEffect(() => {
    if (!cursor) {
      setAllNotifications([]);
    }
  }, [cursor]);

  // Update notifications list when data changes
  useEffect(() => {
    if (data) {
      const items = data.items || [];
      if (cursor) {
        // Append new items when loading more
        setAllNotifications((prev) => {
          // Avoid duplicates
          const existingIds = new Set(prev.map((n) => n.id));
          const newItems = items.filter((item) => !existingIds.has(item.id));
          return [...prev, ...newItems];
        });
      } else {
        // Replace all items when loading first page
        setAllNotifications(items);
      }
    }
  }, [data, cursor]);

  const markReadMutation = useMutation({
    mutationFn: (dto: { ids?: string[]; all?: boolean }) => api.markNotificationsRead(initData, dto),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['notifications'] });
      void queryClient.invalidateQueries({ queryKey: ['notifications', 'unreadCount'] });
    },
  });

  const handleNotificationClick = async (notification: Notification) => {
    // Mark as read if unread
    if (!notification.isRead) {
      await markReadMutation.mutateAsync({ ids: [notification.id] });
    }

    // Navigate to deepLink if exists
    const deepLink = notification.notification.data?.deepLink as string | undefined;
    if (deepLink) {
      router.push(deepLink);
    }
  };

  const handleMarkAllRead = async () => {
    await markReadMutation.mutateAsync({ all: true });
  };

  const handleLoadMore = () => {
    if (data?.nextCursor && !isFetching) {
      setCursor(data.nextCursor);
    }
  };

  if (!isTelegram) {
    return (
      <div className="fixed inset-0 overflow-hidden">
        <div className="fixed inset-0 z-0">
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{ backgroundImage: `url(${BG_IMAGE_URL})`, backgroundAttachment: 'fixed' }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/50 to-black/70" />
        </div>
        <div
          className="relative z-10 h-full overflow-y-auto overflow-x-hidden overscroll-none"
          style={{
            paddingTop: headerTotalHeight,
            paddingBottom: 'env(safe-area-inset-bottom, 0px)',
          }}
        >
          <div className="min-h-full flex items-center justify-center px-4 py-12">
            <p className="text-white/60">Откройте приложение в Telegram</p>
          </div>
        </div>
      </div>
    );
  }

  const unreadCount = allNotifications.filter((n) => !n.isRead).length;

  return (
    <div className="fixed inset-0 overflow-hidden">
      <div className="fixed inset-0 z-0">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${BG_IMAGE_URL})`, backgroundAttachment: 'fixed' }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/50 to-black/70" />
        <div
          className="absolute inset-0 backdrop-blur-[12px]"
          style={{ WebkitBackdropFilter: 'blur(12px)' }}
        />
      </div>

      <div
        className="relative z-10 h-full overflow-y-auto overflow-x-hidden overscroll-none"
        style={{
          paddingTop: headerTotalHeight,
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        <div className="min-h-full flex flex-col pb-16 px-4">
          {/* Header */}
          <div className="w-full mb-4 pt-6 flex items-center justify-between">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 text-white/90 active:opacity-70 transition-opacity"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="text-[clamp(16px,4vw,18px)] font-medium">Уведомления</span>
            </button>
            {unreadCount > 0 && (
              <Button
                onClick={handleMarkAllRead}
                disabled={markReadMutation.isPending}
                variant="ghost"
                size="sm"
                className="text-white/90 hover:text-white hover:bg-white/10"
              >
                <CheckCheck className="w-4 h-4 mr-1" />
                Отметить все
              </Button>
            )}
          </div>

          {/* Loading */}
          {isLoading && (
            <div className="flex-1 flex items-center justify-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-white/30"></div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="flex-1 flex items-center justify-center py-12 px-4">
              <div className="text-center">
                <p className="text-red-400 mb-2">Ошибка загрузки</p>
                <p className="text-white/60 text-sm">
                  {error instanceof Error ? error.message : 'Неизвестная ошибка'}
                </p>
              </div>
            </div>
          )}

          {/* Empty */}
          {!isLoading && !error && allNotifications.length === 0 && (
            <div className="flex-1 flex items-center justify-center py-12 px-4">
              <div className="text-center">
                <p className="text-white/60 text-lg mb-2">Нет уведомлений</p>
                <p className="text-white/40 text-sm">Новые уведомления появятся здесь</p>
              </div>
            </div>
          )}

          {/* Notifications List */}
          {!isLoading && !error && allNotifications.length > 0 && (
            <div className="space-y-3">
              {allNotifications.map((notification) => (
                <button
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className="w-full rounded-[16px] bg-black/30 backdrop-blur-xl border border-white/10 p-4 text-left hover:bg-black/40 transition-colors active:opacity-80"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-white font-semibold text-sm truncate">
                          {notification.notification.title}
                        </h3>
                        {!notification.isRead && (
                          <span className="flex-shrink-0 w-2 h-2 rounded-full bg-blue-500"></span>
                        )}
                      </div>
                      <p className="text-white/70 text-sm mb-2 line-clamp-2">
                        {notification.notification.body}
                      </p>
                      <p className="text-white/40 text-xs">
                        {formatNotificationTime(notification.notification.createdAt)}
                      </p>
                    </div>
                    {notification.isRead && (
                      <Check className="w-4 h-4 text-white/40 flex-shrink-0 mt-1" />
                    )}
                  </div>
                </button>
              ))}

              {/* Load More */}
              {data?.nextCursor && (
                <div className="pt-4 pb-8">
                  <Button
                    onClick={handleLoadMore}
                    disabled={isFetching}
                    variant="outline"
                    className="w-full bg-black/30 border-white/10 text-white hover:bg-black/40"
                  >
                    {isFetching ? 'Загрузка...' : 'Загрузить еще'}
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

