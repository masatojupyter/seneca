'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Alert, Button } from '@/components/ui';
import { ROUTES } from '@/lib/client/routes';
import type { VerifyEmailResult as VerifyEmailResultType } from '../action/verify-email-actions';

type VerifyEmailResultProps = {
  result: VerifyEmailResultType;
};

const REDIRECT_DELAY_SECONDS = 5;

export function VerifyEmailResult({ result }: VerifyEmailResultProps): React.JSX.Element {
  const t = useTranslations();
  const router = useRouter();
  const [countdown, setCountdown] = useState(REDIRECT_DELAY_SECONDS);

  useEffect(() => {
    if (!result.success) {
      return;
    }

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          router.push(ROUTES.ADMIN_LOGIN);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [result.success, router]);

  if (!result.success) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
            <svg
              className="h-8 w-8 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </div>
          <h2 className="mt-4 text-xl font-semibold text-gray-900">{t('verifyEmail.verificationFailed')}</h2>
        </div>

        <Alert variant="error">{result.error}</Alert>

        <div className="text-center">
          <Button
            variant="primary"
            onClick={() => router.push(ROUTES.ADMIN_REGISTER)}
          >
            {t('verifyEmail.goToRegistration')}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
          <svg
            className="h-8 w-8 text-green-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
        <h2 className="mt-4 text-xl font-semibold text-gray-900">
          {t('verifyEmail.verificationComplete')}
        </h2>
      </div>

      <Alert variant="success">
        <p className="font-medium">{result.data?.name}</p>
        <p className="mt-1">
          {t('verifyEmail.accountActivated')}
        </p>
      </Alert>

      <div className="text-center">
        <p className="text-gray-600 mb-4">
          {t('verifyEmail.redirectingIn', { seconds: countdown })}
        </p>
        <Button
          variant="primary"
          onClick={() => router.push(ROUTES.ADMIN_LOGIN)}
        >
          {t('verifyEmail.loginNow')}
        </Button>
      </div>
    </div>
  );
}
