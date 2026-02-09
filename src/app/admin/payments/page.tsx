import { getTranslations } from 'next-intl/server';
import {
  getPaymentRequestsAction,
  PaymentRequestTable,
  WalletBalanceSection,
  GemWalletBalanceSection,
} from '@/lib/client/features/payment-management';
import Link from 'next/link';
import { ROUTES } from '@/lib/client/routes';

export default async function PaymentsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}): Promise<React.JSX.Element> {
  const { status } = await searchParams;
  const t = await getTranslations();
  const result = await getPaymentRequestsAction(status);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{t('payments.title')}</h1>
        <p className="mt-1 text-gray-600">{t('payments.subtitle')}</p>
      </div>

      <GemWalletBalanceSection />

      <WalletBalanceSection />

      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">{t('payments.paymentRequests')}</h2>

        <div className="flex flex-wrap gap-2">
          <Link
            href={ROUTES.ADMIN.PAYMENTS}
            className={`px-4 py-2 rounded-lg transition-colors text-sm ${
              !status
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            {t('payments.tabs.all')}
          </Link>
          <Link
            href={`${ROUTES.ADMIN.PAYMENTS}?status=PENDING`}
            className={`px-4 py-2 rounded-lg transition-colors text-sm ${
              status === 'PENDING'
                ? 'bg-yellow-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            {t('payments.tabs.pending')}
          </Link>
          <Link
            href={`${ROUTES.ADMIN.PAYMENTS}?status=COMPLETED`}
            className={`px-4 py-2 rounded-lg transition-colors text-sm ${
              status === 'COMPLETED'
                ? 'bg-green-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            {t('payments.tabs.completed')}
          </Link>
          <Link
            href={`${ROUTES.ADMIN.PAYMENTS}?status=FAILED`}
            className={`px-4 py-2 rounded-lg transition-colors text-sm ${
              status === 'FAILED'
                ? 'bg-red-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            {t('payments.tabs.failed')}
          </Link>
        </div>

        {result.success && result.paymentRequests ? (
          <PaymentRequestTable paymentRequests={result.paymentRequests} />
        ) : (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {t('payments.getFailed')} {result.error}
          </div>
        )}
      </div>
    </div>
  );
}
