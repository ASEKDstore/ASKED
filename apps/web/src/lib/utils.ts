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

/**
 * Format date to ru-RU locale string (DD.MM.YYYY)
 */
export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

/**
 * Format datetime to ru-RU locale string (DD.MM.YYYY HH:mm)
 */
export function formatDateTime(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Convert Date to ISO string for datetime-local input (YYYY-MM-DDTHH:mm)
 * Note: datetime-local uses local timezone, so we use local date methods
 */
export function dateToInputValue(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  // Use local timezone methods to match datetime-local input behavior
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

/**
 * Convert datetime-local input value to ISO string
 * Handles timezone conversion properly
 */
export function inputValueToDate(inputValue: string): string {
  if (!inputValue) return new Date().toISOString();
  // datetime-local input gives us local time, convert to ISO
  const localDate = new Date(inputValue);
  return localDate.toISOString();
}
