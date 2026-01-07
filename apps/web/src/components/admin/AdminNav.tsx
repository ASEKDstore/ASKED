'use client';

import { LayoutDashboard, Package, ShoppingBag, FolderTree, Tag, Megaphone } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Suspense } from 'react';

import { Button } from '@/components/ui/button';
import { getTokenFromUrl } from '@/lib/admin-nav';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/orders', label: 'Заказы', icon: ShoppingBag },
  { href: '/admin/products', label: 'Товары', icon: Package },
  { href: '/admin/categories', label: 'Категории', icon: FolderTree },
  { href: '/admin/tags', label: 'Теги', icon: Tag },
  { href: '/admin/marketing', label: 'Маркетинг', icon: Megaphone },
];

function AdminNavContent(): JSX.Element {
  const pathname = usePathname();
  
  // TEMP DEV ADMIN ACCESS - remove after Telegram WebApp enabled
  // Preserve token in navigation links
  const token = getTokenFromUrl();
  const tokenQuery = token ? `?token=${encodeURIComponent(token)}` : '';

  return (
    <nav className="border-b bg-white">
      <div className="container mx-auto px-4">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-bold mr-8">Админ-панель</h1>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            const href = `${item.href}${tokenQuery}`;
            return (
              <Link key={item.href} href={href}>
                <Button
                  variant={isActive ? 'default' : 'ghost'}
                  className={cn(
                    'gap-2',
                    isActive && 'bg-primary text-primary-foreground'
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </Button>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}

export function AdminNav(): JSX.Element {
  return (
    <Suspense fallback={
      <nav className="border-b bg-white">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold mr-8">Админ-панель</h1>
          </div>
        </div>
      </nav>
    }>
      <AdminNavContent />
    </Suspense>
  );
}

