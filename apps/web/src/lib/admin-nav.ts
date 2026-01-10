// TEMP DEV ADMIN ACCESS - remove after Telegram WebApp enabled
// Utility to preserve dev token in navigation

export function addTokenToUrl(url: string, token: string | null): string {
  if (!token) return url;
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}token=${encodeURIComponent(token)}`;
}

export function getTokenFromUrl(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const url = new URL(window.location.href);
    return url.searchParams.get('token');
  } catch {
    return null;
  }
}







