'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui';

type LogoutButtonProps = {
  onLogout: () => Promise<never>;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
};

export function LogoutButton({ onLogout, variant = 'ghost' }: LogoutButtonProps): React.JSX.Element {
  const [isLoading, setIsLoading] = useState(false);
  const t = useTranslations('auth.logout');

  const handleLogout = async (): Promise<void> => {
    setIsLoading(true);

    try {
      // Server Action throws redirect so this Promise never resolves
      await onLogout();
    } catch (error) {
      // NEXT_REDIRECT error is handled by Next.js, ignore it
      // Show other errors
      if (error && typeof error === 'object' && 'digest' in error) {
        const digest = (error as { digest?: string }).digest;
        if (digest?.startsWith('NEXT_REDIRECT')) {
          // Redirect error is normal behavior, do nothing
          return;
        }
      }
      console.error('Logout error:', error);
      alert(t('failed'));
      setIsLoading(false);
    }
  };

  return (
    <Button variant={variant} onClick={handleLogout} isLoading={isLoading}>
      {t('button')}
    </Button>
  );
}
