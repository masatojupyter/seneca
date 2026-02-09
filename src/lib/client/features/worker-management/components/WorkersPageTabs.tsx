'use client';

import { useState, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { WorkerList } from '@/lib/client/features/worker-management/components/WorkerList';
import { InvitationList } from '@/lib/client/features/invitation/components/InvitationList';
import type { WorkerListItem } from '@/lib/client/features/worker-management/action/worker-actions';
import type { InvitationListItemDTO } from '@/lib/client/features/invitation/action/invitation-actions';

type WorkersPageTabsProps = {
  workers: WorkerListItem[];
  invitations: InvitationListItemDTO[];
};

type TabValue = 'WORKERS' | 'INVITATIONS';

export function WorkersPageTabs({ workers, invitations }: WorkersPageTabsProps) {
  const t = useTranslations();
  const [activeTab, setActiveTab] = useState<TabValue>('WORKERS');

  const tabs = useMemo(() => [
    { value: 'WORKERS' as const, label: t('workers.tabs.workers'), activeClass: 'bg-blue-600 text-white' },
    { value: 'INVITATIONS' as const, label: t('workers.tabs.invitations'), activeClass: 'bg-purple-600 text-white' },
  ], [t]);

  return (
    <div>
      <div className="mb-4 flex gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setActiveTab(tab.value)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === tab.value
                ? tab.activeClass
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'WORKERS' && <WorkerList workers={workers} />}
      {activeTab === 'INVITATIONS' && <InvitationList invitations={invitations} />}
    </div>
  );
}
