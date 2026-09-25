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
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '10px 16px',
          borderRadius: 12,
          border: '1px solid var(--glass-border)',
          backgroundColor: 'var(--glass-bg)',
          color: 'var(--text-primary)',
          cursor: 'pointer',
          fontSize: 14,
          minWidth: 180,
        }}
      >
        <Globe size={16} />
        <span style={{ flex: 1, textAlign: 'left' }}>
          {currentLanguage?.nativeName || 'English'}
        </span>
        <ChevronDown
          size={16}
          style={{
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s ease',
          }}
        />
      </button>

      {isOpen && (
        <>
          <div
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 999,
            }}
            onClick={() => setIsOpen(false)}
          />
          <div
            style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              marginTop: 4,
              borderRadius: 12,
              border: '1px solid var(--glass-border)',
              backgroundColor: 'var(--glass-bg)',
              backdropFilter: 'blur(20px)',
              zIndex: 1000,
              overflow: 'hidden',
            }}
          >
            {locales.map((locale) => (
              <button
                key={locale.code}
                onClick={() => handleSelect(locale.code)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  width: '100%',
                  padding: '12px 16px',
                  border: 'none',
                  backgroundColor:
                    currentLocale === locale.code ? 'var(--brand-orange)' : 'transparent',
                  color: currentLocale === locale.code ? 'white' : 'var(--text-primary)',
                  cursor: 'pointer',
                  fontSize: 14,
                  textAlign: 'left',
                }}
              >
                <span style={{ fontWeight: 500 }}>{locale.nativeName}</span>
                <span
                  style={{
                    color:
                      currentLocale === locale.code ? 'rgba(255,255,255,0.7)' : 'var(--text-muted)',
                    fontSize: 12,
                  }}
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
