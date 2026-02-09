import { getLocale, getTranslations } from 'next-intl/server';
import {
  getPaymentRequestDetailAction,
  ExecutePaymentButton,
  GemWalletPaymentButton,
} from '@/lib/client/features/payment-management';
import { Card } from '@/components/ui/Card';
import Link from 'next/link';
import { ROUTES } from '@/lib/client/routes';

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  PROCESSING: 'bg-blue-100 text-blue-800',
  COMPLETED: 'bg-green-100 text-green-800',
  FAILED: 'bg-red-100 text-red-800',
};

const XRPL_NETWORK = process.env.XRPL_NETWORK ?? 'testnet';

function getExplorerTxUrl(hash: string): string {
  if (XRPL_NETWORK === 'mainnet') {
    return `https://livenet.xrpl.org/transactions/${hash}`;
  }
  return `https://testnet.xrpl.org/transactions/${hash}`;
}

export default async function PaymentDetailPage({ params }: { params: Promise<{ id: string }> }): Promise<React.JSX.Element> {
  const { id } = await params;
  const t = await getTranslations();
  const locale = await getLocale();

  const STATUS_LABELS: Record<string, string> = {
    PENDING: t('payments.status.pending'),
    PROCESSING: t('payments.status.processing'),
    COMPLETED: t('payments.status.completed'),
    FAILED: t('payments.status.failed'),
  };

  const TYPE_LABELS: Record<string, string> = {
    SINGLE: t('applications.types.single'),
    BATCH: t('applications.types.batch'),
    PERIOD: t('applications.types.period'),
  };

  const formatDate = (date: string): string => {
    return new Date(date).toLocaleDateString(locale === 'ja-jp' ? 'ja-JP' : 'en-US');
  };

  const formatDateTime = (date: string): string => {
    return new Date(date).toLocaleString(locale === 'ja-jp' ? 'ja-JP' : 'en-US');
  };

  const result = await getPaymentRequestDetailAction(id);

  if (!result.success || !result.paymentRequest) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
        {result.error || t('payments.detail.notFound')}
      </div>
    );
  }

  const payment = result.paymentRequest;

  return (
    <div className="space-y-6">
      <div>
        <Link
          href={ROUTES.ADMIN.PAYMENTS}
          className="text-blue-600 hover:text-blue-800 hover:underline text-sm inline-block mb-2"
        >
          {t('payments.detail.backToList')}
        </Link>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-gray-900">{t('payments.detail.title')}</h1>
          <span
            className={`px-3 py-1 text-sm rounded-full ${
              STATUS_COLORS[payment.status] || 'bg-gray-100 text-gray-800'
            }`}
          >
            {STATUS_LABELS[payment.status] || payment.status}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <div className="p-6">
              <h2 className="text-lg font-semibold mb-4">{t('payments.detail.paymentInfo')}</h2>
              <dl className="space-y-3">
                <div>
                  <dt className="text-sm font-medium text-gray-600">{t('common.worker')}</dt>
                  <dd className="text-lg font-semibold mt-1">{payment.workerName}</dd>
                  <dd className="text-sm text-gray-500">{payment.workerEmail}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-600">{t('payments.detail.destinationAddress')}</dt>
                  <dd className="text-sm mt-1 font-mono bg-gray-50 p-2 rounded">
                    {payment.workerCryptoAddress || t('common.notSet')}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-600">{t('payments.detail.amountUsd')}</dt>
                  <dd className="text-3xl font-bold mt-1 text-green-600">
                    ${payment.amountUsd.toFixed(2)}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-600">{t('payments.detail.cryptoRate')}</dt>
                  <dd className="text-sm mt-1">
                    1 {payment.cryptoType} = ${payment.cryptoRate.toFixed(6)}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-600">{t('payments.detail.transferAmount')}</dt>
                  <dd className="text-2xl font-bold mt-1 text-blue-600">
                    {payment.cryptoAmount.toFixed(6)} {payment.cryptoType}
                  </dd>
                </div>
                {payment.transactionHash && (
                  <div>
                    <dt className="text-sm font-medium text-gray-600">{t('payments.detail.transactionHash')}</dt>
                    <dd className="text-sm mt-1 font-mono bg-gray-50 p-2 rounded break-all">
                      {payment.transactionHash.startsWith('DUMMY_TX_') ? (
                        <span className="text-gray-500">{payment.transactionHash}</span>
                      ) : (
                        <a
                          href={getExplorerTxUrl(payment.transactionHash)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 hover:underline"
                        >
                          {payment.transactionHash}
                        </a>
                      )}
                    </dd>
                  </div>
                )}
                {payment.processedAt && (
                  <div>
                    <dt className="text-sm font-medium text-gray-600">{t('payments.detail.processedAt')}</dt>
                    <dd className="text-sm mt-1">
                      {formatDateTime(payment.processedAt)}
                    </dd>
                  </div>
                )}
                <div>
                  <dt className="text-sm font-medium text-gray-600">{t('payments.detail.requestedAt')}</dt>
                  <dd className="text-sm mt-1">
                    {formatDateTime(payment.createdAt)}
                  </dd>
                </div>
              </dl>
            </div>
          </Card>

          <Card>
            <div className="p-6">
              <h2 className="text-lg font-semibold mb-4">{t('payments.detail.relatedApplications')}</h2>
              <div className="space-y-2">
                {payment.applications.map((app) => (
                  <div
                    key={app.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div>
                      <div className="text-sm font-medium">
                        {TYPE_LABELS[app.type] || app.type}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {formatDate(app.startDate)} 〜 {formatDate(app.endDate)}
                      </div>
                      <div className="text-xs text-gray-500">
                        {Math.floor(app.totalMinutes / 60)}{t('common.hours')}{app.totalMinutes % 60}{t('common.minutes')}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold">
                        ${app.totalAmountUsd.toFixed(2)}
                      </div>
                      <Link
                        href={ROUTES.ADMIN.APPLICATIONS_DETAIL(app.id)}
                        className="text-xs text-blue-600 hover:text-blue-800 hover:underline"
                      >
                        {t('common.details')}
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>

        <div>
          <Card>
            <div className="p-6">
              <h2 className="text-lg font-semibold mb-4">{t('payments.detail.paymentActions')}</h2>
              {payment.organizationWallet?.requiresManualSigning ? (
                <GemWalletPaymentButton
                  paymentRequestId={payment.id}
                  status={payment.status}
                  destinationAddress={payment.workerCryptoAddress || ''}
                  cryptoType={payment.cryptoType}
                  cryptoAmount={payment.cryptoAmount}
                  dataHash={payment.dataHash}
                  tokenIssuer={payment.tokenIssuer?.address}
                  tokenCurrencyCode={payment.tokenIssuer?.currencyCode}
                  organizationWalletAddress={payment.organizationWallet.address}
                />
              ) : (
                <ExecutePaymentButton
                  paymentRequestId={payment.id}
                  status={payment.status}
                />
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
