'use client';

import { useEffect, useState } from 'react';

export interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
}

export function useTelegramUser(): {
  user: TelegramUser | null;
  isLoading: boolean;
} {
  const [user, setUser] = useState<TelegramUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (typeof window === 'undefined') {
      setIsLoading(false);
      return;
    }

    try {
      const tg = window.Telegram?.WebApp;
      const unsafeUser = tg?.initDataUnsafe?.user;

      if (unsafeUser && unsafeUser.id && unsafeUser.first_name) {
        setUser({
          id: unsafeUser.id,
          first_name: unsafeUser.first_name,
          last_name: unsafeUser.last_name,
          username: unsafeUser.username,
          photo_url: unsafeUser.photo_url,
        });
      }
    } catch (error) {
      console.error('Error reading Telegram user:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { user, isLoading };
}

