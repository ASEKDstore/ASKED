'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function OrdersPage(): JSX.Element {
  const router = useRouter();

  useEffect(() => {
    // Redirect to canonical profile page (which includes orders section)
    router.replace('/profile');
  }, [router]);

  // Show loading state during redirect
  return (
    <div className="fixed inset-0 flex items-center justify-center">
      <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
    </div>
  );
}
