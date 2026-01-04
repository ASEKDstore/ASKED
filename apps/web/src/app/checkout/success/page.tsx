'use client';

import { CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

import { Button } from '@/components/ui/button';

function CheckoutSuccessContent(): JSX.Element {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('id');

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-8 text-center">
        <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-4" />
        <h1 className="text-2xl font-bold mb-2 text-gray-900">
          Заказ оформлен!
        </h1>
        {orderId && (
          <p className="text-gray-600 mb-2">
            Номер заказа: <span className="font-mono font-semibold">{orderId}</span>
          </p>
        )}
        <p className="text-gray-600 mb-6">
          Наш менеджер свяжется с вами в ближайшее время для подтверждения и
          оплаты заказа.
        </p>
        <div className="space-y-3">
          <Link href="/catalog" className="block">
            <Button className="w-full">Продолжить покупки</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutSuccessPage(): JSX.Element {
  return (
    <Suspense
      fallback={
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-8 text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
            <p className="mt-4 text-gray-600">Загрузка...</p>
          </div>
        </div>
      }
    >
      <CheckoutSuccessContent />
    </Suspense>
  );
}

