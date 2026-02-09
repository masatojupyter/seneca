import { getTranslations } from 'next-intl/server';
import { adminAuth } from '@/lib/server/infra/auth-admin';
import { adminLogoutAction } from '@/lib/client/features/auth';
import { ROUTES } from '@/lib/client/routes';
import {
  DashboardLayout,
  HomeIcon,
  UsersIcon,
  DocumentCheckIcon,
  CreditCardIcon,
  CogIcon,
  WalletIcon,
  SearchIcon,
} from '@/components/layout';
import type { NavGroup } from '@/components/layout';

export default async function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>): Promise<React.JSX.Element> {
  const session = await adminAuth();

  // Show layout without nav for unauthenticated pages (login/register)
  if (!session?.user || session.user.userType !== 'ADMIN') {
    return <>{children}</>;
  }

  const t = await getTranslations('admin.sidebar');

  const adminNavGroups: NavGroup[] = [
    {
      title: t('main'),
      items: [
        { label: t('dashboard'), href: ROUTES.ADMIN.DASHBOARD, icon: <HomeIcon /> },
      ],
    },
    {
      title: t('management'),
      items: [
        { label: t('workerManagement'), href: ROUTES.ADMIN.WORKERS, icon: <UsersIcon /> },
        { label: t('applicationManagement'), href: ROUTES.ADMIN.APPLICATIONS, icon: <DocumentCheckIcon /> },
        { label: t('paymentManagement'), href: ROUTES.ADMIN.PAYMENTS, icon: <CreditCardIcon /> },
        { label: t('hashSearch'), href: ROUTES.ADMIN.HASH_SEARCH, icon: <SearchIcon /> },
      ],
    },
    {
      title: t('settings'),
      items: [
        { label: t('organizationSettings'), href: ROUTES.ADMIN.SETTINGS, icon: <CogIcon /> },
        { label: t('cryptoSettings'), href: ROUTES.ADMIN.SETTINGS_CRYPTO, icon: <WalletIcon /> },
      ],
    },
  ];

  return (
    <DashboardLayout
      navGroups={adminNavGroups}
      user={{
        name: session.user.name ?? '',
        email: session.user.email ?? '',
        userType: 'ADMIN',
      }}
      accentColor="blue"
      onLogout={adminLogoutAction}
    >
      {children}
    </DashboardLayout>
  );
}
