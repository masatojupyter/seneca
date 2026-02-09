'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import Card from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { updateOrganizationAction } from '@/lib/client/features/organization-settings/action/organization-settings-actions';
import type { OrganizationData } from '@/lib/client/features/organization-settings/action/organization-settings-actions';

type OrganizationSettingsFormProps = {
  organization: OrganizationData;
};

export function OrganizationSettingsForm({ organization }: OrganizationSettingsFormProps): React.JSX.Element {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const [name, setName] = useState(organization.name);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const hasChanges = name !== organization.name;

  const formatDate = (date: string): string => {
    return new Date(date).toLocaleDateString(locale === 'ja-jp' ? 'ja-JP' : 'en-US');
  };

  async function handleSubmit(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setIsSubmitting(true);

    try {
      const result = await updateOrganizationAction(name);
      if (result.success) {
        setSuccessMessage(t('organizationSettings.updateSuccess'));
        router.refresh();
      } else {
        setError(result.error ?? t('organizationSettings.updateFailed'));
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <Card.Header>
          <h2 className="text-lg font-semibold text-gray-900">{t('organizationSettings.basicInfo')}</h2>
        </Card.Header>
        <Card.Body>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-700">
                {error}
              </div>
            )}
            {successMessage && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-md text-sm text-green-700">
                {successMessage}
              </div>
            )}

            <Input
              label={t('organizationSettings.organizationName')}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('organizationSettings.organizationNamePlaceholder')}
              required
            />

            <Input
              label={t('organizationSettings.organizationId')}
              value={organization.id}
              disabled
              helperText={t('organizationSettings.organizationIdReadonly')}
            />

            <div className="flex justify-end">
              <Button
                type="submit"
                disabled={!hasChanges || isSubmitting}
                isLoading={isSubmitting}
              >
                {t('common.save')}
              </Button>
            </div>
          </form>
        </Card.Body>
      </Card>

      <Card>
        <Card.Header>
          <h2 className="text-lg font-semibold text-gray-900">{t('organizationSettings.orgInfo.title')}</h2>
        </Card.Header>
        <Card.Body>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <dt className="text-sm font-medium text-gray-500">{t('organizationSettings.orgInfo.adminCount')}</dt>
              <dd className="mt-1 text-lg font-semibold text-gray-900">
                {organization.adminCount}{t('common.people')}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">{t('organizationSettings.orgInfo.workerCount')}</dt>
              <dd className="mt-1 text-lg font-semibold text-gray-900">
                {organization.workerCount}{t('common.people')}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">{t('organizationSettings.orgInfo.createdAt')}</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {formatDate(organization.createdAt)}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">{t('organizationSettings.orgInfo.updatedAt')}</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {formatDate(organization.updatedAt)}
              </dd>
            </div>
          </dl>
        </Card.Body>
      </Card>
    </div>
  );
}
