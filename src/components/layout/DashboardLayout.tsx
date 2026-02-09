'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import type { NavGroup, LayoutUser, AccentColor } from '@/components/layout/types';
import { DashboardHeader } from '@/components/layout/DashboardHeader';
import { DashboardSidebar } from '@/components/layout/DashboardSidebar';

type DashboardLayoutProps = {
  children: React.ReactNode;
  navGroups: NavGroup[];
  user: LayoutUser;
  accentColor: AccentColor;
  onLogout: () => Promise<never>;
};

export function DashboardLayout({
  children,
  navGroups,
  user,
  accentColor,
  onLogout,
}: DashboardLayoutProps): React.JSX.Element {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();

  // Close sidebar on route change
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardSidebar
        navGroups={navGroups}
        accentColor={accentColor}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <DashboardHeader
        user={user}
        onMenuToggle={() => setSidebarOpen((prev) => !prev)}
        onLogout={onLogout}
      />
      <main className="lg:pl-64 pt-16">
        <div className="p-4 sm:p-6">{children}</div>
      </main>
    </div>
  );
}
