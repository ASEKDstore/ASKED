'use client';

import { useQuery } from '@tanstack/react-query';
import { usePathname } from 'next/navigation';

import { MaintenanceScreen } from '@/components/MaintenanceScreen';
import { api } from '@/lib/api';
import { isInTelegramWebApp } from '@/lib/telegram';
import { getTokenFromUrl } from '@/lib/admin-nav';

interface GlobalMaintenanceGateProps {
  children: React.ReactNode;
}

// Allowlist paths that should not be blocked by maintenance
const MAINTENANCE_ALLOWLIST = [
  '/lab',
  '/profile',
  '/orders',
];

function isPathAllowed(pathname: string): boolean {
  return MAINTENANCE_ALLOWLIST.some((allowed) => pathname.startsWith(allowed));
}

export function GlobalMaintenanceGate({ children }: GlobalMaintenanceGateProps): JSX.Element {
  const pathname = usePathname();
  const isTelegram = isInTelegramWebApp();
  const token = getTokenFromUrl();
  const hasDevToken = !!token && process.env.NEXT_PUBLIC_ADMIN_DEV_TOKEN === token;

  // Check if user is admin (only if in Telegram or has dev token)
  const { data: adminData } = useQuery({
    queryKey: ['admin', 'me', 'maintenance-check', token],
    queryFn: () => api.getAdminMe(null),
    enabled: (isTelegram || hasDevToken) && !pathname.startsWith('/admin'),
    retry: false,
    staleTime: 5 * 60 * 1000,
  });

  // Get maintenance status
  const { data: maintenanceStatus, isLoading } = useQuery({
    queryKey: ['settings', 'maintenance'],
    queryFn: () => api.getMaintenanceStatus(),
    refetchOnWindowFocus: false,
    staleTime: 30 * 1000, // 30 seconds
  });

  // Don't block if path is in admin area
  if (pathname.startsWith('/admin')) {
    return <>{children}</>;
  }

  // Don't block if user is admin
  if (adminData) {
    return <>{children}</>;
  }

  // Don't block if path is in allowlist
  if (isPathAllowed(pathname)) {
    return <>{children}</>;
  }

  // Show maintenance screen if enabled (and not loading)
  if (!isLoading && maintenanceStatus?.globalMaintenanceEnabled) {
    return <MaintenanceScreen />;
  }

  // Default: show children
  return <>{children}</>;
}

