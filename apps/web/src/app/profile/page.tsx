'use client';

import { useQuery } from '@tanstack/react-query';
import { useTelegram } from '@/hooks/useTelegram';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { AlertCircle, User as UserIcon } from 'lucide-react';

export default function ProfilePage(): JSX.Element {
  const { initData, isTelegram } = useTelegram();

  const {
    data: user,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['me', initData],
    queryFn: () => api.getMe(initData),
    enabled: !!initData && isTelegram,
    retry: false,
  });

  if (!isTelegram) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-6 bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <AlertCircle className="w-16 h-16 text-orange-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-4 text-gray-900">
            Open in Telegram
          </h1>
          <p className="text-gray-600 mb-6">
            This application is designed to work within Telegram. Please open it
            through Telegram WebApp to continue.
          </p>
          <div className="space-y-3 text-sm text-gray-500">
            <p>
              1. Open Telegram on your device
            </p>
            <p>
              2. Find the bot or link that sent you this application
            </p>
            <p>
              3. Tap to open the application
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-6">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
        <p className="mt-4 text-gray-600">Loading profile...</p>
      </div>
    );
  }

  if (error) {
    const apiError = error as { message?: string; statusCode?: number };
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-6 bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-4 text-gray-900">
            Error Loading Profile
          </h1>
          <p className="text-gray-600 mb-6">
            {apiError.message || 'An unexpected error occurred'}
          </p>
          <Button
            onClick={() => window.location.reload()}
            variant="outline"
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }

  const displayName =
    user?.firstName && user?.lastName
      ? `${user.firstName} ${user.lastName}`
      : user?.firstName || user?.username || 'User';

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="flex flex-col items-center space-y-6">
            {user?.photoUrl ? (
              <img
                src={user.photoUrl}
                alt={displayName}
                className="w-32 h-32 rounded-full object-cover border-4 border-gray-200"
              />
            ) : (
              <div className="w-32 h-32 rounded-full bg-gray-200 flex items-center justify-center border-4 border-gray-300">
                <UserIcon className="w-16 h-16 text-gray-400" />
              </div>
            )}

            <div className="text-center">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {displayName}
              </h1>
              {user?.username && (
                <p className="text-gray-600">@{user.username}</p>
              )}
            </div>

            <div className="w-full border-t pt-6 space-y-4">
              <div className="flex justify-between items-center py-2">
                <span className="text-gray-600">Telegram ID:</span>
                <span className="font-mono text-sm text-gray-900">
                  {user?.telegramId}
                </span>
              </div>
              {user?.firstName && (
                <div className="flex justify-between items-center py-2">
                  <span className="text-gray-600">First Name:</span>
                  <span className="text-gray-900">{user.firstName}</span>
                </div>
              )}
              {user?.lastName && (
                <div className="flex justify-between items-center py-2">
                  <span className="text-gray-600">Last Name:</span>
                  <span className="text-gray-900">{user.lastName}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

