'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Button, Input, Alert } from '@/components/ui';
import type { AcceptInvitationInput } from '../action/invitation-actions';
import { ROUTES } from '@/lib/client/routes';

type AcceptInvitationFormProps = {
  token: string;
  onSubmit: (data: AcceptInvitationInput) => Promise<{ success: boolean; error?: string }>;
};

export function AcceptInvitationForm({ token, onSubmit }: AcceptInvitationFormProps): React.JSX.Element {
  const router = useRouter();
  const t = useTranslations();
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const result = await onSubmit({
        token,
        name,
        password,
        passwordConfirm,
      });

      if (result.success) {
        setSuccess(true);
        setTimeout(() => {
          router.push(ROUTES.WORKER_LOGIN);
        }, 3000);
      } else {
        setError(result.error || t('invitation.acceptFailed'));
      }
    } catch (err) {
      console.error('Accept invitation error:', err);
      setError(t('common.unexpectedError'));
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <Alert variant="success">
        {t('invitation.accountCreated')}
        <br />
        {t('registration.redirectingToLogin')}
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
        label={t('registration.yourName')}
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder={t('registration.yourNamePlaceholder')}
        required
        disabled={isLoading}
      />

      <Input
        label={t('common.password')}
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="••••••••"
        helperText={t('registration.passwordHint')}
        required
        disabled={isLoading}
      />

      <Input
        label={t('registration.passwordConfirm')}
        type="password"
        value={passwordConfirm}
        onChange={(e) => setPasswordConfirm(e.target.value)}
        placeholder="••••••••"
        required
        disabled={isLoading}
      />

      <Button type="submit" fullWidth isLoading={isLoading}>
        {t('invitation.createAccount')}
      </Button>
    </form>
  );
}
