/**
 * Hreflang Tags for International SEO
 * SEO-005: Add language tags for internationalization
 */

export interface HreflangConfig {
  lang: string;
  href: string;
  default?: boolean;
}

const SUPPORTED_LOCALES: HreflangConfig[] = [
  { lang: 'en', href: 'https://azeeboplus.com', default: true },
  { lang: 'en-NG', href: 'https://azeeboplus.com' },
  { lang: 'ha', href: 'https://azeeboplus.com/ha' },
  { lang: 'yo', href: 'https://azeeboplus.com/yo' },
  { lang: 'ig', href: 'https://azeeboplus.com/ig' },
  { lang: 'sw', href: 'https://azeeboplus.com/sw' },
  { lang: 'fr', href: 'https://azeeboplus.com/fr' },
];

export function HreflangTags({ basePath }: { basePath?: string }) {
  return (
    <>
      {SUPPORTED_LOCALES.map((locale) => (
        <link
          key={locale.lang}
          rel="alternate"
          hrefLang={locale.lang}
          href={basePath ? `${locale.href}${basePath}` : locale.href}
        />
      ))}
      {/* x-default points to the default language version */}
      <link
        rel="alternate"
        hrefLang="x-default"
        href={basePath ? `https://azeeboplus.com${basePath}` : 'https://azeeboplus.com'}
      />
    </>
  );
}
