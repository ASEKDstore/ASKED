'use client';

import { AdminNav } from '@/components/admin/AdminNav';
import { AdminGate } from '@/features/admin/AdminGate';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}): JSX.Element {
  return (
    <AdminGate>
      <div className="min-h-screen bg-gray-50">
        <AdminNav />
        <main>{children}</main>
      </div>
    </AdminGate>
  );
}



