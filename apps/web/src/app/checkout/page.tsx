'use client';

import { useMutation } from '@tanstack/react-query';
import { AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { useTelegram } from '@/hooks/useTelegram';
import { api } from '@/lib/api';
import { useCartStore } from '@/lib/cart-store';
import { formatPrice } from '@/lib/utils';

export default function CheckoutPage(): JSX.Element {
  const router = useRouter();
  const { initData, isTelegram } = useTelegram();
  const items = useCartStore((state) => state.items);
  const clearCart = useCartStore((state) => state.clearCart);
  const total = useCartStore((state) => state.getTotal());

  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [comment, setComment] = useState('');

  const createOrderMutation = useMutation({
    mutationFn: (data: {
      customerName: string;
      customerPhone: string;
      customerAddress?: string;
      comment?: string;
    }) =>
      api.createOrder(initData, {
        ...data,
        items: items.map((item) => ({
          productId: item.productId,
          qty: item.qty,
        })),
      }),
    onSuccess: (order) => {
      clearCart();
      router.push(`/checkout/success?id=${order.id}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim() || !customerPhone.trim()) {
      return;
    }
    createOrderMutation.mutate({
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      customerAddress: customerAddress.trim() || undefined,
      comment: comment.trim() || undefined,
    });
  };

  if (!isTelegram) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-8 text-center">
          <AlertCircle className="w-16 h-16 text-orange-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-4 text-gray-900">
            Откройте в Telegram
          </h1>
          <p className="text-gray-600 mb-6">
            Для оформления заказа необходимо открыть приложение через Telegram
            WebApp.
          </p>
          <div className="space-y-3 text-sm text-gray-500">
            <p>1. Откройте Telegram на вашем устройстве</p>
            <p>2. Найдите бота или ссылку на это приложение</p>
            <p>3. Нажмите, чтобы открыть</p>
          </div>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Корзина пуста</p>
          <Link href="/catalog">
            <Button>Перейти в каталог</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-2xl">
      <h1 className="text-3xl font-bold mb-6">Оформление заказа</h1>

      {/* Order summary */}
      <div className="bg-gray-50 rounded-lg p-4 mb-6">
        <h2 className="font-semibold mb-2">Ваш заказ:</h2>
        <div className="space-y-1 text-sm text-gray-600">
          {items.map((item) => (
            <div key={item.productId} className="flex justify-between">
              <span>
                {item.title} × {item.qty}
              </span>
              <span>{formatPrice(item.price * item.qty)}</span>
            </div>
          ))}
        </div>
        <div className="flex justify-between font-bold text-lg mt-3 pt-3 border-t">
          <span>Итого:</span>
          <span>{formatPrice(total)}</span>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">
            Имя <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            placeholder="Введите ваше имя"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Телефон <span className="text-red-500">*</span>
          </label>
          <input
            type="tel"
            required
            value={customerPhone}
            onChange={(e) => setCustomerPhone(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            placeholder="+7 (999) 123-45-67"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Адрес доставки
          </label>
          <input
            type="text"
            value={customerAddress}
            onChange={(e) => setCustomerAddress(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            placeholder="Улица, дом, квартира"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Комментарий</label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={3}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            placeholder="Дополнительная информация к заказу"
          />
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            <strong>Оплата через менеджера</strong> — после оформления заказа
            наш менеджер свяжется с вами для подтверждения и оплаты.
          </p>
        </div>

        {createOrderMutation.isError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-red-800">
              <p className="font-semibold">Ошибка оформления заказа</p>
              <p>
                {createOrderMutation.error instanceof Error
                  ? createOrderMutation.error.message
                  : 'Попробуйте позже'}
              </p>
            </div>
          </div>
        )}

        <Button
          type="submit"
          className="w-full"
          size="lg"
          disabled={createOrderMutation.isPending}
        >
          {createOrderMutation.isPending ? 'Оформление...' : 'Оформить заказ'}
        </Button>
      </form>
    </div>
  );
}

