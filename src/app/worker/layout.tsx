import { getTranslations } from 'next-intl/server';
import { workerAuth } from '@/lib/server/infra/auth-worker';
import { workerLogoutAction } from '@/lib/client/features/auth';
import { ROUTES } from '@/lib/client/routes';
import {
  DashboardLayout,
  HomeIcon,
  DocumentIcon,
  ClockIcon,
  CreditCardIcon,
  WalletIcon,
  UserIcon,
  BuildingIcon,
  SearchIcon,
} from '@/components/layout';
import type { NavGroup } from '@/components/layout';

export default async function WorkerLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>): Promise<React.JSX.Element> {
  const session = await workerAuth();

  // Show layout without nav for unauthenticated pages (login page)
  if (!session?.user || session.user.userType !== 'WORKER') {
    return <>{children}</>;
  }

  const t = await getTranslations('worker.sidebar');

  const workerNavGroups: NavGroup[] = [
    {
      title: t('main'),
      items: [
        { label: t('dashboard'), href: ROUTES.WORKER.DASHBOARD, icon: <HomeIcon /> },
        { label: t('applicationList'), href: ROUTES.WORKER.DASHBOARD_APPLICATIONS, icon: <DocumentIcon /> },
      ],
    },
    {
      title: t('attendancePayment'),
      items: [
        { label: t('timesheet'), href: '/worker/timesheet', icon: <ClockIcon /> },
        { label: t('paymentReceive'), href: '/worker/payment', icon: <CreditCardIcon /> },
        { label: t('hashSearch'), href: ROUTES.WORKER.HASH_SEARCH, icon: <SearchIcon /> },
      ],
    },
    {
      title: t('settings'),
      items: [
        { label: t('wallet'), href: ROUTES.WORKER.WALLET, icon: <WalletIcon /> },
        { label: t('profile'), href: ROUTES.WORKER.PROFILE, icon: <UserIcon /> },
        { label: t('companyInfo'), href: ROUTES.WORKER.COMPANY, icon: <BuildingIcon /> },
      ],
    },
  ];

  return (
    <DashboardLayout
      navGroups={workerNavGroups}
      user={{
        name: session.user.name ?? '',
        email: session.user.email ?? '',
        userType: 'WORKER',
      }}
      accentColor="green"
      onLogout={workerLogoutAction}
    >
      {children}
    </DashboardLayout>
  );
}
