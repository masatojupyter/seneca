'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button, Input, Alert } from '@/components/ui';
import type {
  UpdateProfileInput,
  UpdateProfileResult,
  WorkerProfileData,
} from '../action/profile-actions';

type ProfileEditFormProps = {
  profile: WorkerProfileData;
  onSubmit: (data: UpdateProfileInput) => Promise<UpdateProfileResult>;
  onSuccess?: () => void;
};

export function ProfileEditForm({
  profile,
  onSubmit,
  onSuccess,
}: ProfileEditFormProps): React.ReactNode {
  const t = useTranslations();
  const [name, setName] = useState(profile.name);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsSubmitting(true);

    try {
      const result = await onSubmit({ name });

      if (result.success) {
        setSuccess(t('worker.profile.updateSuccess'));
        setTimeout(() => setSuccess(''), 3000);
        onSuccess?.();
      } else {
        setError(result.error || t('worker.profile.updateFailed'));
      }
    } catch (err) {
      console.error('Submit error:', err);
      setError(t('common.unexpectedError'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <Alert variant="error" onClose={() => setError('')}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert variant="success" onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      <Input
        label={t('common.name')}
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
      />

      <Input
        label={t('common.email')}
        type="email"
        value={profile.email}
        disabled
        className="bg-gray-100"
        helperText={t('worker.profile.emailReadonly')}
      />

      <Input
        label={t('workers.detail.hourlyRate')}
        type="text"
        value={`$${profile.hourlyRateUsd.toFixed(2)}`}
        disabled
        className="bg-gray-100"
        helperText={t('worker.profile.hourlyRateReadonly')}
      />

      <Button type="submit" isLoading={isSubmitting}>
        {t('common.save')}
      </Button>
    </form>
  );
}
