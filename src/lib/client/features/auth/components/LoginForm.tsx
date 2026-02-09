'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Button, Input, Alert } from '@/components/ui';
import type { LoginInput } from '../action/login-actions';

type LoginFormProps = {
  userType: 'admin' | 'worker';
  onSubmit: (data: LoginInput) => Promise<{ success: boolean; error?: string }>;
  redirectUrl: string;
};

export function LoginForm({ userType, onSubmit, redirectUrl }: LoginFormProps): React.JSX.Element {
  const router = useRouter();
  const t = useTranslations();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [organizationId, setOrganizationId] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const result = await onSubmit({
        email,
        password,
        organizationId: organizationId || undefined,
      });

      if (result.success) {
        router.push(redirectUrl);
        router.refresh();
      } else {
        setError(result.error || t('auth.login.loginFailed'));
      }
    } catch (err) {
      console.error('Login error:', err);
      setError(t('common.unexpectedError'));
    } finally {
      setIsLoading(false);
    }
  };

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
        placeholder={t('auth.login.emailPlaceholder')}
        required
        disabled={isLoading}
      />

      <Input
        label={t('common.password')}
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="••••••••"
        required
        disabled={isLoading}
      />

      <Input
        label={t('auth.login.organizationId')}
        type="text"
        value={organizationId}
        onChange={(e) => setOrganizationId(e.target.value)}
        placeholder={t('auth.login.organizationIdHint')}
        helperText={t('auth.login.organizationIdNote')}
        disabled={isLoading}
      />

      <Button type="submit" fullWidth isLoading={isLoading}>
        {userType === 'admin' ? t('auth.login.loginAsAdmin') : t('auth.login.loginAsWorker')}
      </Button>
    </form>
  );
}
