'use client';

import { useLocale, useTranslations } from 'next-intl';
import type { OrganizationData } from '../action/company-actions';

type CompanyInfoProps = {
  organization: OrganizationData;
};

export function CompanyInfo({ organization }: CompanyInfoProps): React.ReactNode {
  const t = useTranslations();
  const locale = useLocale();

  const formatDate = (dateStr: string): string => {
    return new Date(dateStr).toLocaleDateString(locale === 'ja-jp' ? 'ja-JP' : 'en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <dl className="divide-y divide-gray-200">
      <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4">
        <dt className="text-sm font-medium text-gray-500">{t('companyInfo.companyName')}</dt>
        <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
          {organization.name}
        </dd>
      </div>
      <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4">
        <dt className="text-sm font-medium text-gray-500">{t('companyInfo.foundedDate')}</dt>
        <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
          {formatDate(organization.createdAt)}
        </dd>
      </div>
      <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4">
        <dt className="text-sm font-medium text-gray-500">{t('companyInfo.employeeCount')}</dt>
        <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
          {organization.workerCount}{t('common.people')}
        </dd>
      </div>
    </dl>
  );
}
