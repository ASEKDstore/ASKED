'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect } from 'react';

export default function AdminPromosPage(): JSX.Element {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  useEffect(() => {
    const redirectUrl = token ? `/admin/marketing?token=${encodeURIComponent(token)}` : '/admin/marketing';
    router.replace(redirectUrl);
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
