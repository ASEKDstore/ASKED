import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

export function formatPrice(price: number, currency = 'RUB'): string {
  const rubles = Math.floor(price / 100);
  const kopecks = price % 100;
  
  if (currency === 'RUB') {
    if (kopecks === 0) {
      return `${rubles.toLocaleString('ru-RU')} ₽`;
    }
    return `${rubles.toLocaleString('ru-RU')},${kopecks.toString().padStart(2, '0')} ₽`;
  }
  
  return `${(price / 100).toLocaleString('ru-RU')} ${currency}`;
}
