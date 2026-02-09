'use client';

import { useTranslations } from 'next-intl';
import { Card } from '@/components/ui';
import type { PaymentHashSearchResult } from '@/lib/server/use_case/payment-hash/search-payment-hash';

type HashSearchResultProps = {
  results: PaymentHashSearchResult[];
  showWorkerInfo: boolean;
};

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleString('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

function formatXrpAmount(amount: number): string {
  return amount.toLocaleString('ja-JP', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 6,
  });
}

function formatUsdAmount(amount: number): string {
  return amount.toLocaleString('ja-JP', {
    style: 'currency',
    currency: 'USD',
  });
}

function DataRow({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}): React.JSX.Element {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start gap-1 py-2 border-b border-gray-100 last:border-b-0">
      <dt className="text-sm font-medium text-gray-500 sm:w-40 shrink-0">
        {label}
      </dt>
      <dd
        className={`text-sm text-gray-900 break-all ${mono ? 'font-mono' : ''}`}
      >
        {value}
      </dd>
    </div>
  );
}

function ResultCard({
  result,
  showWorkerInfo,
  t,
}: {
  result: PaymentHashSearchResult;
  showWorkerInfo: boolean;
  t: ReturnType<typeof useTranslations>;
}): React.JSX.Element {
  const { canonicalData } = result;

  return (
    <Card>
      <Card.Header>
        <h3 className="text-lg font-semibold">{t('hashSearch.result.title')}</h3>
        <p className="text-sm text-gray-500 mt-1">
          {t('hashSearch.result.recordedAt', { date: formatDate(result.createdAt) })}
        </p>
      </Card.Header>
      <Card.Body>
        <dl className="divide-y-0">
          <DataRow label={t('hashSearch.result.dataHash')} value={result.dataHash} mono />
          {result.transactionHash && (
            <DataRow
              label={t('hashSearch.result.transactionHash')}
              value={result.transactionHash}
              mono
            />
          )}
          <DataRow
            label={t('hashSearch.result.paymentRequestId')}
            value={result.paymentRequestId}
            mono
          />
          {result.organizationName && (
            <DataRow label={t('hashSearch.result.payerName')} value={result.organizationName} />
          )}
          {showWorkerInfo && result.workerName && (
            <DataRow
              label={t('hashSearch.result.worker')}
              value={`${result.workerName} (${result.workerEmail ?? ''})`}
            />
          )}
          <DataRow
            label={t('hashSearch.result.usdAmount')}
            value={formatUsdAmount(canonicalData.amountUsd)}
          />
          <DataRow
            label={t('hashSearch.result.xrpAmount')}
            value={`${formatXrpAmount(canonicalData.cryptoAmount)} XRP`}
          />
          <DataRow
            label={t('hashSearch.result.xrpRate')}
            value={`1 XRP = ${formatUsdAmount(canonicalData.cryptoRate)}`}
          />
          <DataRow
            label={t('hashSearch.result.destinationAddress')}
            value={canonicalData.destinationAddress}
            mono
          />
          <DataRow
            label={t('hashSearch.result.timestamp')}
            value={formatDate(canonicalData.timestamp)}
          />
          {canonicalData.applicationIds.length > 0 && (
            <>
              <DataRow
                label={t('hashSearch.result.applicationId')}
                value={canonicalData.applicationIds.join(', ')}
                mono
              />
              {result.workerName && (
                <DataRow label={t('hashSearch.result.applicantName')} value={result.workerName} />
              )}
            </>
          )}
          {result.verificationResult !== null && (
            <DataRow
              label={t('hashSearch.result.verificationResult')}
              value={result.verificationResult ? t('hashSearch.result.verified') : t('hashSearch.result.verificationFailed')}
            />
          )}
        </dl>
      </Card.Body>
    </Card>
  );
}

export function HashSearchResult({
  results,
  showWorkerInfo,
}: HashSearchResultProps): React.JSX.Element {
  const t = useTranslations();

  if (results.length === 0) {
    return (
      <div className="p-6 text-center text-gray-500 bg-gray-50 rounded-lg">
        {t('hashSearch.result.noResults')}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600">
        {t('hashSearch.result.resultsCount', { count: results.length })}
      </p>
      {results.map((result) => (
        <ResultCard
          key={result.id}
          result={result}
          showWorkerInfo={showWorkerInfo}
          t={t}
        />
      ))}
    </div>
  );
}
