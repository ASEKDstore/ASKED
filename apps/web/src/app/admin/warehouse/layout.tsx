'use client';

import { Package, ShoppingCart, ArrowRightLeft } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { getTokenFromUrl } from '@/lib/admin-nav';
import { cn } from '@/lib/utils';

const tabs = [
  { href: '/admin/warehouse/stock', label: 'Остатки', icon: Package },
  { href: '/admin/warehouse/purchases', label: 'Поставки', icon: ShoppingCart },
  { href: '/admin/warehouse/movements', label: 'Движения', icon: ArrowRightLeft },
];

export default function WarehouseLayout({
  children,
}: {
  children: React.ReactNode;
}): JSX.Element {
  const pathname = usePathname();
  const token = getTokenFromUrl();
  const tokenQuery = token ? `?token=${encodeURIComponent(token)}` : '';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sub-navigation tabs */}
      <div className="border-b bg-white sticky top-[73px] z-30">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = pathname === tab.href;
              const href = `${tab.href}${tokenQuery}`;
              return (
                <Link key={tab.href} href={href}>
                  <Button
                    variant={isActive ? 'default' : 'ghost'}
                    className={cn(
                      'gap-2 whitespace-nowrap',
                      isActive && 'bg-primary text-primary-foreground'
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{tab.label}</span>
                  </Button>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
      <main>{children}</main>
    </div>
  );
}

