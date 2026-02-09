import { Container, Card, CardHeader, CardBody } from '@/components/ui';
import { VerifyEmailResult, verifyAdminEmailAction } from '@/lib/client/features/registration';

type VerifyEmailPageProps = {
  searchParams: Promise<{ token?: string }>;
};

export default async function VerifyEmailPage({
  searchParams,
}: VerifyEmailPageProps): Promise<React.JSX.Element> {
  const params = await searchParams;
  const token = params.token;

  // トークンがない場合
  if (!token) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12">
        <Container maxWidth="sm">
          <Card>
            <CardHeader>
              <h1 className="text-2xl font-bold text-center text-gray-900">
                メールアドレスの確認
              </h1>
            </CardHeader>
            <CardBody>
              <VerifyEmailResult
                result={{
                  success: false,
                  error: '確認リンクが無効です。メールに記載されたリンクを再度クリックしてください。',
                }}
              />
            </CardBody>
          </Card>
        </Container>
      </div>
    );
  }

  // トークンを検証
  const result = await verifyAdminEmailAction({ token });

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12">
      <Container maxWidth="sm">
        <Card>
          <CardHeader>
            <h1 className="text-2xl font-bold text-center text-gray-900">
              メールアドレスの確認
            </h1>
          </CardHeader>
          <CardBody>
            <VerifyEmailResult result={result} />
          </CardBody>
        </Card>
      </Container>
    </div>
  );
}
