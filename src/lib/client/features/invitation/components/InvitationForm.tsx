'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button, Input, Alert } from '@/components/ui';
import type { SendInvitationInput } from '../action/invitation-actions';

type InvitationFormProps = {
  onSubmit: (data: SendInvitationInput) => Promise<{ success: boolean; token?: string; error?: string }>;
};

export function InvitationForm({ onSubmit }: InvitationFormProps): React.JSX.Element {
  const t = useTranslations();
  const [email, setEmail] = useState('');
  const [hourlyRateUsd, setHourlyRateUsd] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [invitationToken, setInvitationToken] = useState('');

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const result = await onSubmit({
        email,
        hourlyRateUsd: Number(hourlyRateUsd),
      });

      if (result.success) {
        setSuccess(true);
        setInvitationToken(result.token || '');
        // Reset form
        setEmail('');
        setHourlyRateUsd('');
      } else {
        setError(result.error || t('invitation.sendFailed'));
      }
    } catch (err) {
      console.error('Invitation error:', err);
      setError(t('common.unexpectedError'));
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <Alert variant="success" onClose={() => setSuccess(false)}>
        <div>
          {t('invitation.invitationSent')}
          <br />
          {t('invitation.invitationToken', { token: invitationToken })}
          <br />
          <small className="text-xs">{t('invitation.devNote')}</small>
        </div>
      </Alert>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <Alert variant="error" onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      <Input
        label={t('common.email')}
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="worker@example.com"
        required
        disabled={isLoading}
      />

      <Input
        label={t('invitation.hourlyRate')}
        type="number"
        step="0.01"
        min="0.01"
        value={hourlyRateUsd}
        onChange={(e) => setHourlyRateUsd(e.target.value)}
        placeholder="25.00"
        required
        disabled={isLoading}
      />

      <Button type="submit" fullWidth isLoading={isLoading}>
        {t('invitation.sendInvitation')}
      </Button>
    </form>
  );
}
