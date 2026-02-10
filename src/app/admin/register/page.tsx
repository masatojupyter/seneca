import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { Container, Card, CardHeader, CardBody } from '@/components/ui';
import { TopHeader } from '@/components/layout';
import { RegistrationForm, registerAdminAction } from '@/lib/client/features/registration';
import { ROUTES } from '@/lib/client/routes';

export default async function RegisterPage(): Promise<React.JSX.Element> {
  const t = await getTranslations('registration');

  return (
    <div className="min-h-screen bg-gray-50">
      <TopHeader />
      <div className="flex items-center justify-center pt-24 pb-12 sm:pt-28">
        <Container maxWidth="sm" className="min-w-[380px]">
        <Card>
          <CardHeader>
            <h1 className="text-2xl font-bold text-center text-gray-900">
              {t('title')}
            </h1>
            <p className="mt-2 text-center text-sm text-gray-600">
              {t('subtitle')}
            </p>
          </CardHeader>
          <CardBody>
            <RegistrationForm onSubmit={registerAdminAction} />
            <div className="mt-6 text-center">
              <Link
                href={ROUTES.ADMIN_LOGIN}
                className="text-sm text-blue-600 hover:text-blue-500"
              >
                {t('alreadyHaveAccount')}
              </Link>
            </div>
          </CardBody>
        </Card>
        </Container>
      </div>
    </div>
  );
}
