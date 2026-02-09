'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button, Input, Label } from '@/components/ui';

type HashSearchFormProps = {
  onSearch: (dataHash: string) => void;
  isLoading: boolean;
};

export function HashSearchForm({
  onSearch,
  isLoading,
}: HashSearchFormProps): React.JSX.Element {
  const t = useTranslations();
  const [hashValue, setHashValue] = useState('');

  const handleSubmit = (e: React.FormEvent): void => {
    e.preventDefault();
    const trimmed = hashValue.trim();
    if (trimmed.length === 0) {
      return;
    }
    onSearch(trimmed);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="data-hash">{t('hashSearch.form.label')}</Label>
        <Input
          id="data-hash"
          type="text"
          value={hashValue}
          onChange={(e) => setHashValue(e.target.value)}
          placeholder={t('hashSearch.form.placeholder')}
          className="mt-1 font-mono"
          disabled={isLoading}
        />
        <p className="mt-1 text-sm text-gray-500">
          {t('hashSearch.form.hint')}
        </p>
      </div>
      <Button type="submit" disabled={isLoading || hashValue.trim().length === 0}>
        {isLoading ? t('hashSearch.form.searching') : t('hashSearch.searchButton')}
      </Button>
    </form>
  );
}
