'use client';

import { Minus, Plus, Trash2, ShoppingBag } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { useCartStore } from '@/lib/cart-store';
import { formatPrice } from '@/lib/utils';

export default function CartPage(): JSX.Element {
  const router = useRouter();
  const items = useCartStore((state) => state.items);
  const updateQty = useCartStore((state) => state.updateQty);
  const removeItem = useCartStore((state) => state.removeItem);
  const clearCart = useCartStore((state) => state.clearCart);
  const total = useCartStore((state) => state.getTotal());

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="text-center">
          <ShoppingBag className="w-24 h-24 text-gray-300 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Корзина пуста</h2>
          <p className="text-gray-600 mb-6">Добавьте товары в корзину</p>
          <Link href="/catalog">
            <Button>Перейти в каталог</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-3xl font-bold mb-6">Корзина</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cart items */}
        <div className="lg:col-span-2 space-y-4">
          {items.map((item) => (
            <div
              key={item.productId}
              className="bg-white rounded-lg shadow-md p-4 flex gap-4"
            >
              {item.image && (
                <div className="relative w-24 h-24 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                  <Image
                    src={item.image}
                    alt={item.title}
                    fill
                    className="object-cover"
                  />
                </div>
              )}
              <div className="flex-1">
                <h3 className="font-semibold mb-2">{item.title}</h3>
                <div className="text-lg font-bold mb-2">
                  {formatPrice(item.price)}
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 border rounded-lg">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => updateQty(item.productId, item.qty - 1)}
                      className="h-8 w-8 p-0"
                    >
                      <Minus className="w-4 h-4" />
                    </Button>
                    <span className="w-12 text-center">{item.qty}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => updateQty(item.productId, item.qty + 1)}
                      className="h-8 w-8 p-0"
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeItem(item.productId)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    Удалить
                  </Button>
                </div>
              </div>
              <div className="text-lg font-bold">
                {formatPrice(item.price * item.qty)}
              </div>
            </div>
          ))}
        </div>

        {/* Order summary */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-md p-6 sticky top-4">
            <h2 className="text-xl font-bold mb-4">Итого</h2>
            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-gray-600">
                <span>Товаров: {items.length}</span>
                <span>{items.reduce((sum, item) => sum + item.qty, 0)} шт.</span>
              </div>
              <div className="flex justify-between text-xl font-bold pt-4 border-t">
                <span>Сумма:</span>
                <span>{formatPrice(total)}</span>
              </div>
            </div>
            <Button
              onClick={() => router.push('/checkout')}
              className="w-full"
              size="lg"
            >
              Оформить заказ
            </Button>
            <Button
              variant="outline"
              onClick={clearCart}
              className="w-full mt-2"
            >
              Очистить корзину
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

