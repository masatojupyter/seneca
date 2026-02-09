'use client';

import { useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { Card } from '@/components/ui';
import {
  HashSearchForm,
  HashSearchResult,
  searchHashForAdminAction,
} from '@/lib/client/features/hash-search';
import type { PaymentHashSearchResult } from '@/lib/server/use_case/payment-hash/search-payment-hash';

export default function AdminHashSearchPage(): React.JSX.Element {
  const t = useTranslations();
  const [results, setResults] = useState<PaymentHashSearchResult[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = useCallback(async (dataHash: string) => {
    setIsLoading(true);
    setError(null);
    setResults(null);
    try {
      const result = await searchHashForAdminAction({ dataHash });
      if (result.success && result.results) {
        setResults(result.results);
      } else {
        setError(result.error ?? t('hashSearch.searchFailed'));
      }
    } catch {
      setError(t('hashSearch.searchError'));
    } finally {
      setIsLoading(false);
    }
  }, [t]);

  return (
    <div className="max-w-screen-lg mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{t('hashSearch.title')}</h1>
        <p className="mt-1 text-gray-600">
          {t('hashSearch.subtitle')}
        </p>
      </div>

      <Card>
        <Card.Header>
          <h2 className="text-xl font-semibold">{t('common.search')}</h2>
        </Card.Header>
        <Card.Body>
          <HashSearchForm onSearch={handleSearch} isLoading={isLoading} />
        </Card.Body>
      </Card>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {results !== null && (
        <HashSearchResult results={results} showWorkerInfo={true} />
      )}
    </div>
  );
}
