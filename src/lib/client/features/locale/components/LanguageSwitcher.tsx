'use client';

import { useState, useRef, useEffect, useCallback, useTransition } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { setLocaleAction, type Locale } from '../action/locale-actions';

type Language = {
  code: Locale;
  label: string;
  flag: string;
};

const LANGUAGES: Language[] = [
  { code: 'en-us', label: 'English', flag: '🇺🇸' },
  { code: 'ja-jp', label: '日本語', flag: '🇯🇵' },
];

function GlobeIcon(): React.JSX.Element {
  return (
    <svg
      className="w-5 h-5"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 003 12c0-1.605.42-3.113 1.157-4.418"
      />
    </svg>
  );
}

function ChevronDownIcon({ isOpen }: { isOpen: boolean }): React.JSX.Element {
  return (
    <svg
      className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M19 9l-7 7-7-7"
      />
    </svg>
  );
}

type LanguageSwitcherProps = {
  currentLocale: Locale;
};

export function LanguageSwitcher({
  currentLocale,
}: LanguageSwitcherProps): React.JSX.Element {
  const t = useTranslations('language');
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentLanguage = LANGUAGES.find((lang) => lang.code === currentLocale) ?? LANGUAGES[1];

  const handleClickOutside = useCallback((event: MouseEvent) => {
    if (
      dropdownRef.current &&
      !dropdownRef.current.contains(event.target as Node)
    ) {
      setIsOpen(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, handleClickOutside]);

  const handleLanguageSelect = async (locale: Locale) => {
    if (locale === currentLocale) {
      setIsOpen(false);
      return;
    }

    await setLocaleAction(locale);
    setIsOpen(false);
    startTransition(() => {
      router.refresh();
    });
  };

  return (
    <div ref={dropdownRef} className="relative">
      {/* Mobile: Globe icon button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="sm:hidden p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
        aria-label={t('switchTo')}
        disabled={isPending}
      >
        <GlobeIcon />
      </button>

      {/* Desktop: Text button with dropdown */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
        disabled={isPending}
      >
        <span>{currentLanguage.flag}</span>
        <span>{currentLanguage.label}</span>
        <ChevronDownIcon isOpen={isOpen} />
      </button>

      {/* Dropdown menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-40 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-50">
          {LANGUAGES.map((language) => (
            <button
              key={language.code}
              type="button"
              onClick={() => handleLanguageSelect(language.code)}
              className={`w-full flex items-center gap-2 px-4 py-2 text-sm transition-colors ${
                language.code === currentLocale
                  ? 'bg-purple-50 text-purple-700'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
              disabled={isPending}
            >
              <span>{language.flag}</span>
              <span>{language.label}</span>
              {language.code === currentLocale && (
                <svg
                  className="w-4 h-4 ml-auto text-purple-600"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
