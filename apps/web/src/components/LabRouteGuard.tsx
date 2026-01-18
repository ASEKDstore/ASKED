'use client';

import { useQuery } from '@tanstack/react-query';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';

import { useTelegram } from '@/hooks/useTelegram';
import { getTokenFromUrl } from '@/lib/admin-nav';
import { api } from '@/lib/api';
import { useLabLockStore } from '@/lib/lab-lock-store';

// Allowed routes when LAB lock mode is active
const LAB_LOCK_ALLOWLIST = ['/lab', '/profile', '/orders'];

export function LabRouteGuard(): JSX.Element | null {
  const pathname = usePathname();
  const router = useRouter();
  const { isTelegram } = useTelegram();
  const token = getTokenFromUrl();
  const hasDevToken = !!token && process.env.NEXT_PUBLIC_ADMIN_DEV_TOKEN === token;

  const { labMaintenance, labLockMode, setLabMaintenance, enableLabLockMode, disableLabLockMode } = useLabLockStore();

  // Check if user is admin
  const { data: adminData } = useQuery({
    queryKey: ['admin', 'me', 'lab-guard', token],
    queryFn: () => api.getAdminMe(null),
    enabled: (isTelegram || hasDevToken) && !pathname.startsWith('/admin'),
    retry: false,
    staleTime: 5 * 60 * 1000,
  });

  const isAdmin = !!adminData;

  // Fetch LAB maintenance status
  const { data: labStatus } = useQuery({
    queryKey: ['lab-status'],
    queryFn: () => api.getLabStatus(),
    refetchOnWindowFocus: true,
    staleTime: 60 * 1000, // 60 seconds
    refetchInterval: 60 * 1000, // Refetch every 60 seconds
  });

  // Update labMaintenance in store when status changes
  useEffect(() => {
    if (labStatus?.maintenance !== undefined) {
      setLabMaintenance(labStatus.maintenance);
    }
  }, [labStatus?.maintenance, setLabMaintenance]);

  // Handle entering LAB: enable lock mode if maintenance is ON and user is not admin
  useEffect(() => {
    if (pathname === '/lab' && labMaintenance && !isAdmin) {
      enableLabLockMode();
    }
  }, [pathname, labMaintenance, isAdmin, enableLabLockMode]);

  // Handle maintenance turning OFF: disable lock mode
  useEffect(() => {
    if (!labMaintenance) {
      disableLabLockMode();
    }
  }, [labMaintenance, disableLabLockMode]);

  // Route guard: redirect blocked routes when lock mode is active
  useEffect(() => {
    // Skip if user is admin
    if (isAdmin) {
      return;
    }

    // Skip if lock mode is not active
    if (!labLockMode) {
      return;
    }

    // Skip admin routes
    if (pathname?.startsWith('/admin')) {
      return;
    }

    // Check if current path is in allowlist
    const isAllowed = LAB_LOCK_ALLOWLIST.some((allowed) => pathname?.startsWith(allowed));

    // If not allowed, redirect to /lab
    if (!isAllowed && pathname) {
      router.replace('/lab');
    }
  }, [pathname, labLockMode, isAdmin, router]);

  // Don't render anything, this is a guard component
  return null;
}

