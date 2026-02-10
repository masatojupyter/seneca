import { getTranslations } from 'next-intl/server';
import { Container, Card, CardHeader, CardBody } from '@/components/ui';
import { AcceptInvitationForm, acceptWorkerInvitationAction } from '@/lib/client/features/invitation';
import { TopHeader } from '@/components/layout/TopHeader';

type InviteWorkerPageProps = {
  params: Promise<{
    token: string;
  }>;
};

export default async function InviteWorkerPage({ params }: InviteWorkerPageProps): Promise<React.JSX.Element> {
  const { token } = await params;
  const t = await getTranslations();

  return (
    <>
      <TopHeader />
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 pt-24">
        <Container maxWidth="sm">
          <Card>
            <CardHeader>
              <h1 className="text-2xl font-bold text-center text-gray-900">
                {t('invitation.title')}
              </h1>
              <p className="mt-2 text-center text-sm text-gray-600">
                {t('invitation.subtitle')}
              </p>
            </CardHeader>
            <CardBody>
              <AcceptInvitationForm
                token={token}
                onSubmit={acceptWorkerInvitationAction}
              />
            </CardBody>
          </Card>
        </Container>
      </div>
    </>
  );
}
