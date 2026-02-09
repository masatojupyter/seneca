'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Card, Loading, Alert } from '@/components/ui';
import {
  ProfileEditForm,
  getProfileAction,
  updateProfileAction,
  type WorkerProfileData,
} from '@/lib/client/features/worker-profile';

export default function WorkerProfilePage(): React.JSX.Element {
  const t = useTranslations();
  const [profile, setProfile] = useState<WorkerProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const loadProfile = async (): Promise<void> => {
    setIsLoading(true);
    try {
      const result = await getProfileAction();
      if (result.success && result.profile) {
        setProfile(result.profile);
      } else {
        setError(result.error || t('worker.profile.getFailed'));
      }
    } catch (err) {
      console.error('Load profile error:', err);
      setError(t('worker.profile.getFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="max-w-screen-md mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t('worker.profile.title')}</h1>
        <p className="text-gray-600 mt-1">{t('worker.profile.subtitle')}</p>
      </div>

      {error && (
        <Alert variant="error" onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      <Card>
        <Card.Header>
          <h2 className="text-xl font-semibold">{t('worker.profile.basicInfo')}</h2>
        </Card.Header>
        <Card.Body>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loading size="md" />
            </div>
          ) : profile ? (
            <ProfileEditForm
              profile={profile}
              onSubmit={updateProfileAction}
              onSuccess={loadProfile}
            />
          ) : (
            <p className="text-gray-600">{t('worker.profile.profileNotFound')}</p>
          )}
        </Card.Body>
      </Card>
    </div>
  );
}
