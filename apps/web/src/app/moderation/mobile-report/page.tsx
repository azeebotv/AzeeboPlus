'use client';
import { Suspense, lazy, useEffect, useState } from 'react';

import { motion } from 'framer-motion';
import { useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';
import { PageShell } from '@/components/layout/PageShell';
import { ScrollReveal } from '@/components/motion/ScrollReveal';
import { GlowCard } from '@/components/motion/GlowCard';
import {
  Ban,
  AlertTriangle,
  Lock,
  ShieldAlert,
  Copyright,
  Newspaper,
  Frown,
  Heart,
  Scale,
  FileText,
  Check,
} from 'lucide-react';
import analytics from '@/lib/analytics';

function getReasonIcon(name: string): React.JSX.Element {
  const props = { className: 'w-5 h-5 flex-shrink-0' };
  switch (name) {
    case 'Ban':
      return <Ban {...props} />;
    case 'AlertTriangle':
      return <AlertTriangle {...props} />;
    case 'Lock':
      return <Lock {...props} />;
    case 'ShieldAlert':
      return <ShieldAlert {...props} />;
    case 'Copyright':
      return <Copyright {...props} />;
    case 'Newspaper':
      return <Newspaper {...props} />;
    case 'Frown':
      return <Frown {...props} />;
    case 'Heart':
      return <Heart {...props} />;
    case 'Scale':
      return <Scale {...props} />;
    default:
      return <FileText {...props} />;
  }
}

const REASONS = [
  {
    id: 'spam',
    label: 'Spam or misleading',
    icon: 'Ban',
    description: 'Repetitive, unwanted, or deceptive content',
  },
  {
    id: 'harassment',
    label: 'Harassment or hate speech',
    icon: 'AlertTriangle',
    description: 'Targeting individuals with harmful language',
  },
  {
    id: 'violence',
    label: 'Violence or graphic content',
    icon: 'Lock',
    description: 'Promoting or depicting violence',
  },
  {
    id: 'inappropriate',
    label: 'Sexually explicit content',
    icon: 'ShieldAlert',
    description: 'Adult content not suitable for all ages',
  },
  {
    id: 'copyright',
    label: 'Copyright infringement',
    icon: 'Copyright',
    description: 'Using content without proper authorization',
  },
  {
    id: 'misinformation',
    label: 'Misinformation',
    icon: 'Newspaper',
    description: 'False or misleading information',
  },
  {
    id: 'bullying',
    label: 'Bullying',
    icon: 'Frown',
    description: 'Repeated targeting to cause harm',
  },
  {
    id: 'self-harm',
    label: 'Self-harm',
    icon: 'Heart',
    description: 'Content promoting self-harm or suicide',
  },
  {
    id: 'illegal',
    label: 'Illegal activities',
    icon: 'Scale',
    description: 'Content depicting illegal activities',
  },
  { id: 'other', label: 'Other', icon: 'FileText', description: 'Reason not listed above' },
];

function MobileReportPageContent(): React.JSX.Element {
  const searchParams = useSearchParams();
  const contentId = searchParams.get('contentId') || '';
  const contentType = searchParams.get('type') || 'content';
  void contentType; // used in submit handler
  const [selectedReason, setSelectedReason] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    analytics.pageView('moderation-mobile-report');
  }, []);

  const handleSubmit = async () => {
    if (!selectedReason) return;
    setIsSubmitting(true);
    setError(null);

    try {
      const res = await api.moderation.reportContent(contentId, selectedReason, description);
      if (res.success) {
        setSubmitted(true);
      } else {
        setError(res.message || 'Failed to submit report');
      }
    } catch {
      setError('Failed to submit report. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PageShell maxWidth="sm">
      <div className="mx-auto max-w-lg">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 text-center"
        >
          <div className="mx-auto mb-4 grid size-16 place-items-center rounded-full bg-az-error-500/15">
            <ShieldAlert className="size-8 text-az-error-500" aria-hidden="true" />
          </div>
          <h1 className="az-headline mb-2 text-2xl text-az-ink sm:text-3xl">Report Content</h1>
          <p className="az-body text-az-ink-muted">Help keep our community safe</p>
        </motion.div>

        {!contentId ? (
          <ScrollReveal>
            <GlowCard className="p-8 text-center">
              <p className="az-body mb-4 text-az-ink-muted">No content selected for reporting.</p>
              <p className="az-caption text-az-ink/40">
                Navigate to the content you want to report and use the report button.
              </p>
            </GlowCard>
          </ScrollReveal>
        ) : submitted ? (
          <ScrollReveal>
            <GlowCard className="p-8 text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="mx-auto mb-6 grid size-20 place-items-center rounded-full bg-az-success-500/15"
              >
                <Check className="size-10 text-az-success-400" aria-hidden="true" />
              </motion.div>
              <h2 className="az-title mb-2 text-az-ink">Report Submitted</h2>
              <p className="az-body mb-4 text-az-ink-muted">
                Thank you for helping keep our community safe. We&apos;ll review your report within
                24 hours.
              </p>
              <p className="az-micro-label text-az-ink/40">
                Reference: {Math.random().toString(36).substring(2, 10).toUpperCase()}
              </p>
            </GlowCard>
          </ScrollReveal>
        ) : (
          <div className="space-y-6">
            <ScrollReveal>
              <GlowCard className="p-5">
                <h2 className="az-title mb-4 text-az-ink">Select a reason</h2>
                <div className="space-y-2" role="radiogroup" aria-label="Report reason">
                  {REASONS.map((reason) => {
                    const selected = selectedReason === reason.id;
                    return (
                      <button
                        key={reason.id}
                        type="button"
                        role="radio"
                        aria-checked={selected}
                        onClick={() => setSelectedReason(reason.id)}
                        className={`flex w-full items-start gap-3 rounded-az-control border p-3 text-left transition-all ${
                          selected
                            ? 'border-az-scarlet/30 bg-az-scarlet/15'
                            : 'border-az-ink/6 bg-az-ink/3'
                        }`}
                      >
                        <div
                          className={`mt-0.5 flex size-8 flex-shrink-0 items-center justify-center rounded-az-control ${
                            selected
                              ? 'bg-az-scarlet/20 text-az-flame'
                              : 'bg-az-ink/5 text-az-ink/70'
                          }`}
                        >
                          {getReasonIcon(reason.icon)}
                        </div>
                        <div className="flex-1">
                          <p className="az-body-strong text-az-ink">{reason.label}</p>
                          <p className="az-caption mt-0.5 text-az-ink/40">{reason.description}</p>
                        </div>
                        {selected && (
                          <Check
                            className="mt-1 size-4 flex-shrink-0 text-az-flame"
                            aria-hidden="true"
                          />
                        )}
                      </button>
                    );
                  })}
                </div>
              </GlowCard>
            </ScrollReveal>

            <ScrollReveal delay={0.1}>
              <GlowCard className="p-5">
                <h2 className="az-title mb-3 text-az-ink">Additional details</h2>
                <p className="az-caption mb-3 text-az-ink/40">
                  Optional - help us understand the issue better
                </p>
                <label htmlFor="mobile-report-details" className="sr-only">
                  Additional details
                </label>
                <textarea
                  id="mobile-report-details"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Provide any additional context..."
                  className="az-input h-28 resize-none"
                />
              </GlowCard>
            </ScrollReveal>

            {error && (
              <div
                role="alert"
                className="az-body rounded-az-control border border-az-error-500/20 bg-az-error-500/10 p-4 text-az-error-400"
              >
                {error}
              </div>
            )}

            <ScrollReveal delay={0.2}>
              <motion.button
                type="button"
                onClick={handleSubmit}
                disabled={!selectedReason || isSubmitting}
                className="az-btn-primary disabled:cursor-not-allowed disabled:opacity-50"
                whileHover={{ scale: selectedReason ? 1.02 : 1 }}
                whileTap={{ scale: selectedReason ? 0.98 : 1 }}
              >
                {isSubmitting ? 'Submitting...' : 'Submit Report'}
              </motion.button>
            </ScrollReveal>

            <ScrollReveal delay={0.25}>
              <p className="az-caption text-center text-az-ink/30">
                Reports are reviewed within 24 hours. Your identity is kept confidential.
              </p>
            </ScrollReveal>
          </div>
        )}
      </div>
    </PageShell>
  );
}

const LazyMobileReportPage = lazy(() => Promise.resolve({ default: MobileReportPageContent }));

export default function MobileReportPage(): React.JSX.Element {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[var(--color-az-surface-root)]">
          <p className="az-lead text-az-ink-muted">Loading...</p>
        </div>
      }
    >
      <LazyMobileReportPage />
    </Suspense>
  );
}
