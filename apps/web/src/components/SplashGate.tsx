'use client';

import React, { useEffect, useState, useCallback } from 'react';

import { LabLoadingScreen } from '@/components/lab/LabLoadingScreen';

const SPLASH_DURATION_MS = 5000;

function getTelegramUser() {
  try {
    const tg = window.Telegram?.WebApp;
    const user = tg?.initDataUnsafe?.user;
    return {
      name: user?.first_name || undefined,
      avatarUrl: user?.photo_url || undefined,
    };
  } catch {
    return {
      name: undefined,
      avatarUrl: undefined,
    };
  }
}

interface SplashGateProps {
  children: React.ReactNode;
}

export function SplashGate({ children }: SplashGateProps): JSX.Element {
  const [isVisible, setIsVisible] = useState(true);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [userData, setUserData] = useState<{ name?: string; avatarUrl?: string }>({
    name: undefined,
    avatarUrl: undefined,
  });

  const hideSplash = useCallback(() => {
    setIsFadingOut(true);
    // Wait for fade-out animation to complete
    setTimeout(() => {
      setIsVisible(false);
    }, 400);
  }, []);

  useEffect(() => {
    // Get Telegram user data
    setUserData(getTelegramUser());

    // Hide splash after duration
    const timer = setTimeout(hideSplash, SPLASH_DURATION_MS);

    return () => clearTimeout(timer);
  }, [hideSplash]);

  return (
    <>
      {children}

      {isVisible && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            opacity: isFadingOut ? 0 : 1,
            transition: 'opacity 0.4s ease-out',
            pointerEvents: isFadingOut ? 'none' : 'auto',
          }}
          aria-hidden={isFadingOut}
        >
          <LabLoadingScreen userName={userData.name} avatarUrl={userData.avatarUrl} />
        </div>
      )}
    </>
  );
}

