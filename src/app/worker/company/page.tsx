'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Card, Loading, Alert } from '@/components/ui';
import {
  CompanyInfo,
  getOrganizationAction,
  type OrganizationData,
} from '@/lib/client/features/worker-company';

export default function WorkerCompanyPage(): React.JSX.Element {
  const t = useTranslations();
  const [organization, setOrganization] = useState<OrganizationData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadOrganization = async (): Promise<void> => {
      try {
        const result = await getOrganizationAction();
        if (result.success && result.organization) {
          setOrganization(result.organization);
        } else {
          setError(result.error || t('companyInfo.getFailed'));
        }
      } catch (err) {
        console.error('Load organization error:', err);
        setError(t('companyInfo.getFailed'));
      } finally {
        setIsLoading(false);
      }
    };
    loadOrganization();
  }, [t]);

  return (
    <div className="max-w-screen-md mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t('companyInfo.title')}</h1>
        <p className="text-gray-600 mt-1">{t('companyInfo.subtitle')}</p>
      </div>

      {error && (
        <Alert variant="error" onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      <Card>
        <Card.Header>
          <h2 className="text-xl font-semibold">{t('companyInfo.orgInfo')}</h2>
        </Card.Header>
        <Card.Body>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loading size="md" />
            </div>
          ) : organization ? (
            <CompanyInfo organization={organization} />
          ) : (
            <p className="text-gray-600">{t('companyInfo.notFound')}</p>
          )}
        </Card.Body>
      </Card>
    </div>
  );
}
