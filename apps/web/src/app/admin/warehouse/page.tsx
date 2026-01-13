'use client';

// eslint-disable-next-line import/order
import { useRouter } from 'next/navigation';
// eslint-disable-next-line import/order
import { useEffect } from 'react';

import { addTokenToUrl, getTokenFromUrl } from '@/lib/admin-nav';

export default function WarehousePage(): JSX.Element {
  const router = useRouter();
  const token = getTokenFromUrl();

  useEffect(() => {
    // Redirect to stock page by default
    router.replace(addTokenToUrl('/admin/warehouse/stock', token));
  }, [router, token]);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
        <p className="mt-4 text-gray-600">Перенаправление...</p>
      </div>
    </div>
  );
}
