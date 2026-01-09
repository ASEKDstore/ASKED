import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

export function formatPrice(price: number, currency = 'RUB'): string {
  // Price is already in rubles (Int from backend), format with grouping
  if (currency === 'RUB') {
    return `${price.toLocaleString('ru-RU', { useGrouping: true })} ₽`;
  }
  
  return `${price.toLocaleString('ru-RU', { useGrouping: true })} ${currency}`;
}
