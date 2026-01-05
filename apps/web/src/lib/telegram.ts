// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getTelegramWebApp(): any | null {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return typeof window !== 'undefined' ? (window as any).Telegram?.WebApp ?? null : null;
}

export function getInitData(): string {
  const wa = getTelegramWebApp();
  return wa?.initData ?? '';
}

export function isInTelegramWebApp(): boolean {
  return !!getTelegramWebApp();
}

export function initTelegram(): void {
  const wa = getTelegramWebApp();
  if (!wa) return;
  try {
    wa.ready();
    wa.expand();
  } catch {
    // Ignore errors
  }
}

