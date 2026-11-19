'use client';

import { useState } from 'react';
import { getLocale, setLocale, getAvailableLocales, type Locale } from '@/i18n';
import { Globe, ChevronDown } from 'lucide-react';

export function LanguageSelector() {
  const [isOpen, setIsOpen] = useState(false);
  const currentLocale = getLocale();
  const locales = getAvailableLocales();
  const currentLanguage = locales.find((l) => l.code === currentLocale);

  const handleSelect = (locale: Locale) => {
    setLocale(locale);
    setIsOpen(false);
    // Reload page to apply translations
    window.location.reload();
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2.5 min-w-[180px] rounded-az-card border border-az-glass-border bg-az-surface-panel/80 text-az-ink text-sm cursor-pointer"
      >
        <Globe size={16} />
        <span className="flex-1 text-left">{currentLanguage?.nativeName || 'English'}</span>
        <ChevronDown
          size={16}
          className={`transition-transform duration-200 ease-in-out ${
            isOpen ? 'rotate-180' : 'rotate-0'
          }`}
        />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-[999]" onClick={() => setIsOpen(false)} />
          <div className="absolute top-full left-0 right-0 mt-1 z-[1000] overflow-hidden rounded-az-card border border-az-glass-border bg-az-surface-panel/80 backdrop-blur-az-glass">
            {locales.map((locale) => (
              <button
                key={locale.code}
                onClick={() => handleSelect(locale.code)}
                className={`flex items-center gap-3 w-full px-4 py-3 border-none text-sm text-left cursor-pointer ${
                  currentLocale === locale.code
                    ? 'bg-az-flame text-az-surface-root'
                    : 'bg-transparent text-az-ink'
                }`}
              >
                <span className="font-medium">{locale.nativeName}</span>
                <span
                  className={`text-xs ${
                    currentLocale === locale.code ? 'text-az-ink/70' : 'text-az-ink-muted'
                  }`}
                >
                  {locale.name}
                </span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
