import { Container, Card, CardHeader, CardBody } from '@/components/ui';
import { AcceptInvitationForm, acceptWorkerInvitationAction } from '@/lib/client/features/invitation';

type InviteWorkerPageProps = {
  params: Promise<{
    token: string;
  }>;
};

export default async function InviteWorkerPage({ params }: InviteWorkerPageProps): Promise<React.JSX.Element> {
  const { token } = await params;
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12">
      <Container maxWidth="sm">
        <Card>
          <CardHeader>
            <h1 className="text-2xl font-bold text-center text-gray-900">
              従業員招待
            </h1>
            <p className="mt-2 text-center text-sm text-gray-600">
              アカウントを作成して始めましょう
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
  );
}
