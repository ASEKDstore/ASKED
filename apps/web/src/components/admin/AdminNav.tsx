'use client';

import { LayoutDashboard, Package, ShoppingBag, FolderTree, Tag, Megaphone, BarChart3, FlaskConical, Menu, X, Store, Repeat, Warehouse, Plane } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Suspense, useState } from 'react';

import { Button } from '@/components/ui/button';
import { getTokenFromUrl } from '@/lib/admin-nav';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/orders', label: 'Заказы', icon: ShoppingBag },
  { href: '/admin/products', label: 'Товары', icon: Package },
  { href: '/admin/warehouse', label: 'Склад', icon: Warehouse },
  { href: '/admin/categories', label: 'Категории', icon: FolderTree },
  { href: '/admin/tags', label: 'Теги', icon: Tag },
  { href: '/admin/subscriptions', label: 'Подписки', icon: Repeat },
  { href: '/admin/marketing', label: 'Маркетинг', icon: Megaphone },
  { href: '/admin/analytics', label: 'Аналитика', icon: BarChart3 },
  { href: '/admin/lab', label: 'LAB', icon: FlaskConical },
  { href: '/admin/polet', label: 'ПОЛЕТЫ', icon: Plane },
];

function AdminNavContent(): JSX.Element {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // TEMP DEV ADMIN ACCESS - remove after Telegram WebApp enabled
  // Preserve token in navigation links
  const token = getTokenFromUrl();
  const tokenQuery = token ? `?token=${encodeURIComponent(token)}` : '';

  // Get app version from environment variable (set in next.config.js from package.json)
  const appVersion = process.env.NEXT_PUBLIC_APP_VERSION || 'dev';

  const handleExitAdmin = () => {
    // Navigate to shop main page (catalog or home)
    router.push('/catalog');
  };

  return (
    <nav className="border-b bg-white sticky top-0 z-40">
      <div className="container mx-auto px-4">
        {/* Mobile: Header with hamburger */}
        <div className="md:hidden flex items-center justify-between py-3">
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold">Админ-панель</h1>
            <span className="text-xs text-gray-500 font-mono">v{appVersion}</span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleExitAdmin}
              title="В магазин"
            >
              <Store className="w-5 h-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile: Dropdown menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t py-2 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              const href = `${item.href}${tokenQuery}`;
              return (
                <Link key={item.href} href={href} onClick={() => setMobileMenuOpen(false)}>
                  <div
                    className={cn(
                      'flex items-center gap-3 px-4 py-2 rounded-md transition-colors',
                      isActive
                        ? 'bg-primary text-primary-foreground'
                        : 'hover:bg-gray-100'
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="text-sm font-medium">{item.label}</span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {/* Desktop: Horizontal nav with scroll */}
        <div className="hidden md:flex items-center gap-2 py-3">
          <div className="flex items-center gap-2 mr-8 whitespace-nowrap">
            <h1 className="text-xl font-bold">Админ-панель</h1>
            <span className="text-xs text-gray-500 font-mono">v{appVersion}</span>
          </div>
          <div className="flex-1 overflow-x-auto scrollbar-hide">
            <div className="flex items-center gap-2 min-w-max">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                const href = `${item.href}${tokenQuery}`;
                return (
                  <Link key={item.href} href={href}>
                    <Button
                      variant={isActive ? 'default' : 'ghost'}
                      className={cn(
                        'gap-2 whitespace-nowrap',
                        isActive && 'bg-primary text-primary-foreground'
                      )}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="hidden lg:inline">{item.label}</span>
                      <span className="lg:hidden">{item.label.split(' ')[0]}</span>
                    </Button>
                  </Link>
                );
              })}
            </div>
          </div>
          <Button
            variant="outline"
            onClick={handleExitAdmin}
            className="gap-2 whitespace-nowrap ml-auto"
          >
            <Store className="w-4 h-4" />
            <span className="hidden xl:inline">В магазин</span>
            <span className="xl:hidden">Выход</span>
          </Button>
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

