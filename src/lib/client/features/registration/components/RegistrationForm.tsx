'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Button, Input, Alert } from '@/components/ui';
import type { RegisterInput } from '../action/register-actions';
import { ROUTES } from '@/lib/client/routes';

type RegistrationFormProps = {
  onSubmit: (data: RegisterInput) => Promise<{ success: boolean; verificationToken?: string; error?: string }>;
};

export function RegistrationForm({ onSubmit }: RegistrationFormProps): React.JSX.Element {
  const router = useRouter();
  const t = useTranslations();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    passwordConfirm: '',
    name: '',
    organizationName: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const result = await onSubmit(formData);

      if (result.success) {
        setSuccess(true);
        // Redirect to login after email confirmation
        setTimeout(() => {
          router.push(ROUTES.ADMIN_LOGIN);
        }, 3000);
      } else {
        setError(result.error || t('registration.registrationFailed'));
      }
    } catch (err) {
      console.error('Registration error:', err);
      setError(t('common.unexpectedError'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (field: keyof typeof formData) => (e: React.ChangeEvent<HTMLInputElement>): void => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }));
  };

  if (success) {
    return (
      <Alert variant="success">
        {t('registration.registrationComplete')}
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
        label={t('registration.organizationName')}
        type="text"
        value={formData.organizationName}
        onChange={handleChange('organizationName')}
        placeholder={t('registration.organizationNamePlaceholder')}
        required
        disabled={isLoading}
      />

      <Input
        label={t('registration.yourName')}
        type="text"
        value={formData.name}
        onChange={handleChange('name')}
        placeholder={t('registration.yourNamePlaceholder')}
        required
        disabled={isLoading}
      />

      <Input
        label={t('common.email')}
        type="email"
        value={formData.email}
        onChange={handleChange('email')}
        placeholder="example@example.com"
        required
        disabled={isLoading}
      />

      <Input
        label={t('common.password')}
        type="password"
        value={formData.password}
        onChange={handleChange('password')}
        placeholder="••••••••"
        helperText={t('registration.passwordHint')}
        required
        disabled={isLoading}
      />

      <Input
        label={t('registration.passwordConfirm')}
        type="password"
        value={formData.passwordConfirm}
        onChange={handleChange('passwordConfirm')}
        placeholder="••••••••"
        required
        disabled={isLoading}
      />

      <Button type="submit" fullWidth isLoading={isLoading}>
        {t('registration.registerButton')}
      </Button>
    </form>
  );
}
