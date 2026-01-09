'use client';

import { HEADER_HEIGHT_PX } from '@/components/Header';

export default function ReviewsPage(): JSX.Element {
  return (
    <div
      className="container mx-auto px-4 py-8"
      style={{ paddingTop: `calc(${HEADER_HEIGHT_PX}px + 2rem + env(safe-area-inset-top, 0px))` }}
    >
      <h1 className="text-3xl font-bold mb-6">Отзывы</h1>
      <p className="text-gray-600">Отзывы клиентов о наших товарах и услугах.</p>
    </div>
  );
}




