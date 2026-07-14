'use client';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import BrandLogo from '../auth/BrandLogo';

interface AppFooterProps {
  siteName?: string;
}

const FOOTER_LINKS = {
  platform: {
    heading: 'Platform',
    links: [
      { label: 'Browse', href: '/browse' },
      { label: 'Library', href: '/library' },
      { label: 'Creators', href: '/creators' },
      { label: 'Rewards', href: '/rewards' },
      { label: 'Premium', href: '/premium' },
    ],
  },
  entertainment: {
    heading: 'Entertainment',
    links: [
      { label: 'Reality TV', href: '/browse?category=reality' },
      { label: 'Movies', href: '/browse?category=movies' },
      { label: 'Comedy', href: '/browse?category=comedy' },
      { label: 'Sports', href: '/browse?category=sports' },
      { label: 'Lifestyle', href: '/browse?category=lifestyle' },
    ],
  },
  support: {
    heading: 'Support',
    links: [
      { label: 'Help Center', href: '/support' },
      { label: 'FAQ', href: '/support#faq' },
      { label: 'Contact Us', href: '/support#contact' },
      { label: 'Report an Issue', href: '/support#report' },
    ],
  },
  legal: {
    heading: 'Legal',
    links: [
      { label: 'Terms of Service', href: '/terms' },
      { label: 'Privacy Policy', href: '/privacy' },
      { label: 'Cookie Policy', href: '/privacy#cookies' },
      { label: 'Community Guidelines', href: '/guidelines' },
    ],
  },
} as const;

const SOCIAL_LINKS = [
  {
    label: 'Instagram',
    href: 'https://instagram.com/azeeboplus',
    icon: (
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
      </svg>
    ),
  },
  {
    label: 'X (Twitter)',
    href: 'https://x.com/azeeboplus',
    icon: (
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    ),
  },
  {
    label: 'YouTube',
    href: 'https://youtube.com/@azeeboplus',
    icon: (
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
      </svg>
    ),
  },
  {
    label: 'TikTok',
    href: 'https://tiktok.com/@azeeboplus',
    icon: (
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
      </svg>
    ),
  },
] as const;

export default function AppFooter({ siteName = 'Azeebo+' }: AppFooterProps): React.JSX.Element {
  const [email, setEmail] = useState('');
  const [newsletterStatus, setNewsletterStatus] = useState<
    'idle' | 'loading' | 'success' | 'error'
  >('idle');
  const [emailError, setEmailError] = useState('');
  const [showBackToTop, setShowBackToTop] = useState(false);
  const emailInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleScroll = () => setShowBackToTop(window.scrollY > 400);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const validateEmail = (value: string): boolean => {
    if (!value.trim()) {
      setEmailError('Email is required');
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      setEmailError('Please enter a valid email address');
      return false;
    }
    setEmailError('');
    return true;
  };

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateEmail(email)) return;

    setNewsletterStatus('loading');
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setNewsletterStatus('success');
      setEmail('');
      setTimeout(() => setNewsletterStatus('idle'), 5000);
    } catch {
      setNewsletterStatus('error');
      setTimeout(() => setNewsletterStatus('idle'), 5000);
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="relative" style={{ backgroundColor: '#0a0303' }} role="contentinfo">
      {/* Ambient glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at top, rgba(232,66,10,0.06), transparent 60%)',
        }}
        aria-hidden="true"
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-10 lg:gap-8">
          {/* Brand & Newsletter */}
          <div className="sm:col-span-2 lg:col-span-4">
            <Link
              href="/"
              className="inline-block focus:outline-none focus-visible:ring-2 focus-visible:ring-[#E8420A] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0303] rounded-lg"
              aria-label="Azeebo+ Home"
            >
              <BrandLogo variant="orange" />
            </Link>
            <p className="text-white/40 text-sm mt-4 max-w-xs leading-relaxed">
              The home of Nigerian entertainment. Stream, vote, earn, and celebrate culture — all in
              one platform.
            </p>

            {/* Newsletter Signup */}
            <div className="mt-6">
              <h3 className="text-xs font-bold uppercase tracking-widest text-white/30 mb-3">
                Stay in the loop
              </h3>
              {newsletterStatus === 'success' ? (
                <div
                  className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm"
                  style={{
                    background: 'rgba(34,197,94,0.1)',
                    color: '#4ade80',
                    border: '1px solid rgba(34,197,94,0.2)',
                  }}
                  role="status"
                >
                  <svg
                    className="w-5 h-5 flex-shrink-0"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  You&apos;re subscribed! Check your inbox.
                </div>
              ) : (
                <form onSubmit={handleNewsletterSubmit} noValidate>
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <label htmlFor="newsletter-email" className="sr-only">
                        Email address for newsletter
                      </label>
                      <input
                        ref={emailInputRef}
                        id="newsletter-email"
                        type="email"
                        placeholder="your@email.com"
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          if (emailError) validateEmail(e.target.value);
                        }}
                        className={`w-full px-4 py-2.5 rounded-xl text-sm text-white placeholder-white/25 bg-white/5 border transition-all outline-none ${
                          emailError
                            ? 'border-red-500/50 focus:border-red-500'
                            : 'border-white/8 focus:border-[#E8420A]/50 focus:bg-white/10'
                        }`}
                        aria-invalid={!!emailError}
                        aria-describedby={emailError ? 'newsletter-error' : undefined}
                        disabled={newsletterStatus === 'loading'}
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={newsletterStatus === 'loading'}
                      className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0 hover:shadow-lg"
                      style={{
                        background: 'linear-gradient(135deg, #E8420A, #CC1C1C)',
                        boxShadow: '0 4px 14px rgba(232,66,10,0.2)',
                      }}
                    >
                      {newsletterStatus === 'loading' ? (
                        <svg
                          className="w-5 h-5 animate-spin"
                          fill="none"
                          viewBox="0 0 24 24"
                          aria-hidden="true"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          />
                        </svg>
                      ) : (
                        'Subscribe'
                      )}
                    </button>
                  </div>
                  {emailError && (
                    <p id="newsletter-error" className="text-red-400 text-xs mt-1.5" role="alert">
                      {emailError}
                    </p>
                  )}
                  {newsletterStatus === 'error' && (
                    <p className="text-red-400 text-xs mt-1.5" role="alert">
                      Something went wrong. Please try again.
                    </p>
                  )}
                </form>
              )}
            </div>

            {/* Social Links */}
            <div className="mt-6">
              <p className="sr-only">Follow us on social media</p>
              <div className="flex items-center gap-2">
                {SOCIAL_LINKS.map((social) => (
                  <a
                    key={social.label}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2.5 rounded-xl text-white/35 hover:text-white transition-all duration-200 hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#E8420A]"
                    aria-label={`Follow us on ${social.label} (opens in new tab)`}
                  >
                    {social.icon}
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* Link Columns */}
          {Object.values(FOOTER_LINKS).map((column) => (
            <div key={column.heading} className="lg:col-span-2">
              <h3 className="text-xs font-bold uppercase tracking-widest text-white/30 mb-4">
                {column.heading}
              </h3>
              <ul className="space-y-3" role="list">
                {column.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-white/50 hover:text-[#E8420A] transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#E8420A] focus-visible:rounded"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* App Download */}
          <div className="lg:col-span-2">
            <h3 className="text-xs font-bold uppercase tracking-widest text-white/30 mb-4">
              Get the App
            </h3>
            <div className="flex flex-row gap-3">
              <a
                href="https://apps.apple.com/app/azeebo-plus/id000000000"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 px-5 py-3 min-w-[180px] rounded-xl text-white/50 hover:text-white hover:bg-white/5 transition-all duration-200 border border-white/8 whitespace-nowrap"
                aria-label="Download on the App Store"
              >
                <svg
                  className="w-7 h-7 flex-shrink-0"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
                </svg>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-white/30">
                    Download on the
                  </p>
                  <p className="text-sm font-semibold text-white -mt-0.5">App Store</p>
                </div>
              </a>
              <a
                href="https://play.google.com/store/apps/details?id=com.azeebo.plus"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 px-5 py-3 min-w-[180px] rounded-xl text-white/50 hover:text-white hover:bg-white/5 transition-all duration-200 border border-white/8 whitespace-nowrap"
                aria-label="Get it on Google Play"
              >
                <svg
                  className="w-7 h-7 flex-shrink-0"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path d="M3.609 1.814L13.792 12 3.61 22.186a.996.996 0 01-.61-.92V2.734a1 1 0 01.609-.92zm10.89 10.893l2.302 2.302-10.937 6.333 8.635-8.635zm3.199-3.198l2.807 1.626a1 1 0 010 1.73l-2.808 1.626L15.206 12l2.492-2.491zM5.864 2.658L16.8 8.99l-2.3 2.302-8.636-8.634z" />
                </svg>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-white/30">Get it on</p>
                  <p className="text-sm font-semibold text-white -mt-0.5">Google Play</p>
                </div>
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div
          className="mt-12 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4"
          style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
        >
          <div className="flex items-center gap-2 text-sm text-white/30">
            <span>
              &copy; {new Date().getFullYear()} {siteName}
            </span>
            <span className="text-white/15">|</span>
            <span>Copyright Virtual Media Network Limited</span>
          </div>
          <div className="flex items-center gap-5">
            <Link
              href="/terms"
              className="text-xs text-white/25 hover:text-white/50 transition-colors"
            >
              Terms
            </Link>
            <Link
              href="/privacy"
              className="text-xs text-white/25 hover:text-white/50 transition-colors"
            >
              Privacy
            </Link>
            <Link
              href="/support"
              className="text-xs text-white/25 hover:text-white/50 transition-colors"
            >
              Support
            </Link>
            <Link
              href="/guidelines"
              className="text-xs text-white/25 hover:text-white/50 transition-colors"
            >
              Guidelines
            </Link>
          </div>
        </div>
      </div>

      {/* Back to Top Button */}
      <button
        onClick={scrollToTop}
        className={`
          fixed bottom-6 right-6 z-50 p-3 rounded-full shadow-2xl
          transition-all duration-300 ease-out
          focus:outline-none focus-visible:ring-2 focus-visible:ring-[#E8420A] focus-visible:ring-offset-2
          ${
            showBackToTop
              ? 'opacity-100 translate-y-0 pointer-events-auto'
              : 'opacity-0 translate-y-4 pointer-events-none'
          }
        `}
        style={{
          background: 'linear-gradient(135deg, #E8420A, #CC1C1C)',
          boxShadow: '0 8px 24px rgba(232,66,10,0.3)',
        }}
        aria-label="Back to top"
      >
        <svg
          className="w-5 h-5 text-white"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2.5}
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
        </svg>
      </button>
    </footer>
  );
}
