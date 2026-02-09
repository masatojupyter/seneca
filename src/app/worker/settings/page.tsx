'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Card } from '@/components/ui';
import { ROUTES } from '@/lib/client/routes';

type SettingsMenuItem = {
  title: string;
  description: string;
  href: string;
  icon: React.ReactNode;
};

function WalletIcon(): React.ReactNode {
  return (
    <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a2.25 2.25 0 00-2.25-2.25H15a3 3 0 11-6 0H5.25A2.25 2.25 0 003 12m18 0v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 9m18 0V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v3" />
    </svg>
  );
}

function UserIcon(): React.ReactNode {
  return (
    <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
    </svg>
  );
}

function BuildingIcon(): React.ReactNode {
  return (
    <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
    </svg>
  );
}

export default function WorkerSettingsPage(): React.JSX.Element {
  const t = useTranslations();

  const settingsMenu: SettingsMenuItem[] = useMemo(() => [
    {
      title: t('worker.settings.walletSection'),
      description: t('worker.settings.walletDescription'),
      href: ROUTES.WORKER.WALLET,
      icon: <WalletIcon />,
    },
    {
      title: t('worker.settings.profileSection'),
      description: t('worker.settings.profileDescription'),
      href: ROUTES.WORKER.PROFILE,
      icon: <UserIcon />,
    },
    {
      title: t('worker.settings.companySection'),
      description: t('worker.settings.companyDescription'),
      href: ROUTES.WORKER.COMPANY,
      icon: <BuildingIcon />,
    },
  ], [t]);

  return (
    <div className="max-w-screen-md mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t('worker.settings.title')}</h1>
        <p className="text-gray-600 mt-1">{t('worker.settings.subtitle')}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {settingsMenu.map((item) => (
          <Link key={item.href} href={item.href}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
              <Card.Body className="flex flex-col items-center text-center py-8">
                <div className="text-blue-600 mb-4">{item.icon}</div>
                <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
                <p className="text-gray-600 text-sm">{item.description}</p>
              </Card.Body>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
