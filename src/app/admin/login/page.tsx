import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { Container, Card, CardHeader, CardBody } from '@/components/ui';
import { TopHeader } from '@/components/layout';
import { LoginForm, adminLoginAction } from '@/lib/client/features/auth';
import { ROUTES } from '@/lib/client/routes';

export default async function AdminLoginPage(): Promise<React.JSX.Element> {
  const t = await getTranslations();

  return (
    <div className="min-h-screen bg-gray-50">
      <TopHeader />
      <div className="flex items-center justify-center pt-24 pb-12 sm:pt-28">
        <Container maxWidth="sm">
        <Card>
          <CardHeader>
            <h1 className="text-2xl font-bold text-center text-gray-900">
              {t('admin.login.title')}
            </h1>
            <p className="mt-2 text-center text-sm text-gray-600">
              {t('admin.login.subtitle')}
            </p>
          </CardHeader>
          <CardBody>
            <LoginForm
              userType="admin"
              onSubmit={adminLoginAction}
              redirectUrl={ROUTES.ADMIN.DASHBOARD}
            />
            <div className="mt-6 text-center">
              <Link
                href={ROUTES.ADMIN_REGISTER}
                className="text-sm text-blue-600 hover:text-blue-500"
              >
                {t('admin.login.registerLink')}
              </Link>
            </div>
          </CardBody>
        </Card>
        </Container>
      </div>
    </div>
  );
}
