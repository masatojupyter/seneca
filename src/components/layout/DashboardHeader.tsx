'use client';

import { useMemo } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import type { LayoutUser } from '@/components/layout/types';
import { Badge } from '@/components/ui';
import { LogoutButton } from '@/lib/client/features/auth';
import { MenuIcon } from '@/components/layout/nav-icons';
import { LanguageSwitcher, type Locale } from '@/lib/client/features/locale';

type DashboardHeaderProps = {
  user: LayoutUser;
  onMenuToggle: () => void;
  onLogout: () => Promise<never>;
};

const USER_TYPE_BADGE_VARIANT: Record<LayoutUser['userType'], 'info' | 'success'> = {
  ADMIN: 'info',
  WORKER: 'success',
};

export function DashboardHeader({
  user,
  onMenuToggle,
  onLogout,
}: DashboardHeaderProps): React.JSX.Element {
  const t = useTranslations('common');
  const locale = useLocale() as Locale;

  const userTypeLabels = useMemo(
    () => ({
      ADMIN: t('admin'),
      WORKER: t('worker'),
    }),
    [t]
  );

  return (
    <header className="fixed top-0 right-0 left-0 lg:left-64 h-16 bg-white border-b border-gray-200 z-30 flex items-center px-4 gap-4">
      <button
        onClick={onMenuToggle}
        className="lg:hidden p-2 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100"
        aria-label="Open menu"
      >
        <MenuIcon />
      </button>

      <div className="flex-1" />

      <LanguageSwitcher currentLocale={locale} />
      <span className="text-sm text-gray-600 hidden sm:inline truncate max-w-[200px]">
        {user.name || user.email}
      </span>
      <Badge variant={USER_TYPE_BADGE_VARIANT[user.userType]}>
        {userTypeLabels[user.userType]}
      </Badge>
      <LogoutButton onLogout={onLogout} />
    </header>
  );
}
