import { useEffect, useState } from 'react';

interface TelegramWebApp {
  initData: string;
  initDataUnsafe: {
    user?: {
      id: number;
      first_name: string;
      last_name?: string;
      username?: string;
      photo_url?: string;
    };
    auth_date: number;
    hash: string;
  };
  ready: () => void;
  expand: () => void;
  close: () => void;
  version: string;
  platform: string;
}

export function useTelegram(): {
  webApp: TelegramWebApp | null;
  initData: string | null;
  isTelegram: boolean;
} {
  const [webApp, setWebApp] = useState<TelegramWebApp | null>(null);
  const [initData, setInitData] = useState<string | null>(null);
  const [isTelegram, setIsTelegram] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const tg = window.Telegram?.WebApp;

    if (tg) {
      setIsTelegram(true);
      tg.ready();
      tg.expand();
      setWebApp(tg);
      setInitData(tg.initData);
    } else {
      setIsTelegram(false);
    }
  }, []);

  return {
    webApp,
    initData,
    isTelegram,
  };
}









