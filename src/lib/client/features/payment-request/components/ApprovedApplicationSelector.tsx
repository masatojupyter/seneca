'use client';

import { useState, useEffect } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Table, Badge, Button, Loading } from '@/components/ui';
import { getApprovedApplicationsAction, type ApprovedApplicationItem } from '../action/payment-actions';

type ApprovedApplicationSelectorProps = {
  selectedApplications: ApprovedApplicationItem[];
  onSelectionChange: (applications: ApprovedApplicationItem[]) => void;
};

export function ApprovedApplicationSelector({
  selectedApplications,
  onSelectionChange,
}: ApprovedApplicationSelectorProps): React.JSX.Element {
  const t = useTranslations();
  const locale = useLocale();
  const [applications, setApplications] = useState<ApprovedApplicationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadApplications();
  }, []);

  const loadApplications = async () => {
    setIsLoading(true);
    try {
      const result = await getApprovedApplicationsAction();
      if (result.success && result.applications) {
        setApplications(result.applications);
      }
    } catch (error) {
      console.error('Load applications error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString(locale === 'ja-jp' ? 'ja-JP' : 'en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  const formatMinutes = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const formatCurrency = (amount: number): string => {
    return `$${amount.toFixed(2)}`;
  };

  const isSelected = (id: string) => {
    return selectedApplications.some((app) => app.id === id);
  };

  const toggleSelection = (application: ApprovedApplicationItem) => {
    if (isSelected(application.id)) {
      onSelectionChange(selectedApplications.filter((app) => app.id !== application.id));
    } else {
      onSelectionChange([...selectedApplications, application]);
    }
  };

  const selectAll = () => {
    onSelectionChange(applications);
  };

  const clearSelection = () => {
    onSelectionChange([]);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loading size="md" />
      </div>
    );
  }

  if (applications.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        {t('paymentReceive.selector.noApplications')}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-gray-600">
          {selectedApplications.length > 0
            ? t('paymentReceive.selector.selectedCount', { count: selectedApplications.length })
            : t('paymentReceive.selector.selectApplications')}
        </p>
        <div className="flex gap-2">
          <Button type="button" variant="secondary" size="sm" onClick={selectAll}>
            {t('paymentReceive.selector.selectAll')}
          </Button>
          <Button type="button" variant="secondary" size="sm" onClick={clearSelection}>
            {t('paymentReceive.selector.deselectAll')}
          </Button>
        </div>
      </div>

      <div className="max-h-96 overflow-y-auto border rounded-lg">
        <Table>
          <Table.Header>
            <Table.Row>
              <Table.Head className="w-12">{t('paymentReceive.selector.select')}</Table.Head>
              <Table.Head>{t('paymentReceive.selector.date')}</Table.Head>
              <Table.Head>{t('paymentReceive.selector.workTime')}</Table.Head>
              <Table.Head>{t('paymentReceive.selector.amount')}</Table.Head>
              <Table.Head>{t('paymentReceive.selector.status')}</Table.Head>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {applications.map((app) => (
              <Table.Row
                key={app.id}
                className={`cursor-pointer ${isSelected(app.id) ? 'bg-blue-50' : ''}`}
                onClick={() => toggleSelection(app)}
              >
                <Table.Cell>
                  <input
                    type="checkbox"
                    checked={isSelected(app.id)}
                    onChange={() => toggleSelection(app)}
                    className="w-4 h-4"
                  />
                </Table.Cell>
                <Table.Cell>
                  {formatDate(app.startDate)} - {formatDate(app.endDate)}
                </Table.Cell>
                <Table.Cell>{formatMinutes(app.totalMinutes)}</Table.Cell>
                <Table.Cell>{formatCurrency(app.totalAmountUsd)}</Table.Cell>
                <Table.Cell>
                  <Badge variant="success">{t('applications.status.approved')}</Badge>
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table>
      </div>
    </div>
  );
}
