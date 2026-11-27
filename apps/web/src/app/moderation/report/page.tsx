'use client';
import { Suspense, lazy, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';
import { PageHero } from '@/components/layout/PageHero';
import { PageShell } from '@/components/layout/PageShell';
import {
  Ban,
  AlertTriangle,
  Lock,
  ShieldAlert,
  Copyright,
  Newspaper,
  FileText,
  Check,
} from 'lucide-react';
import analytics from '@/lib/analytics';

function getReasonIcon(name: string): React.JSX.Element {
  const props = { className: 'size-5 flex-shrink-0' };
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
    default:
      return <FileText {...props} />;
  }
}

const REASONS = [
  { id: 'spam', label: 'Spam or misleading', icon: 'Ban' },
  { id: 'harassment', label: 'Harassment or hate speech', icon: 'AlertTriangle' },
  { id: 'violence', label: 'Violence or graphic content', icon: 'Lock' },
  { id: 'inappropriate', label: 'Sexually explicit content', icon: 'ShieldAlert' },
  { id: 'copyright', label: 'Copyright infringement', icon: 'Copyright' },
  { id: 'misinformation', label: 'Misinformation', icon: 'Newspaper' },
  { id: 'other', label: 'Other', icon: 'FileText' },
];

function ReportPageContent(): React.JSX.Element {
  const searchParams = useSearchParams();
  const contentId = searchParams.get('contentId') || '';
  const [selectedReason, setSelectedReason] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    analytics.pageView('moderation-report');
  }, []);

  const handleSubmit = async () => {
    if (!selectedReason || !contentId) return;
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
      <PageHero
        title="Report Content"
        description="Help us keep Azeebo+ safe for everyone"
        eyebrow="Moderation"
      />

      <div className="-mt-6 pb-16">
        {!contentId ? (
          <div className="az-glass p-8 text-center">
            <p className="az-body mb-4 text-az-ink-muted">No content selected for reporting.</p>
            <p className="az-caption text-az-ink/40">
              Please navigate to the content you want to report and use the report button.
            </p>
          </div>
        ) : submitted ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="az-glass p-8 text-center"
          >
            <div className="mx-auto mb-4 grid size-16 place-items-center rounded-full bg-az-success-500/20">
              <Check className="size-8 text-az-success-400" aria-hidden="true" />
            </div>
            <h2 className="az-title mb-2 text-az-ink">Report Submitted</h2>
            <p className="az-body mb-6 text-az-ink-muted">
              Thank you for helping keep our community safe. We&apos;ll review your report shortly.
            </p>
            <p className="az-micro-label text-az-ink/40">
              Report ID: {Math.random().toString(36).substring(2, 10).toUpperCase()}
            </p>
          </motion.div>
        ) : (
          <div className="space-y-6">
            {/* Reason Selection */}
            <div className="az-glass p-5">
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
                      className={`flex w-full items-center gap-3 rounded-az-control border p-3 text-left transition-all ${
                        selected
                          ? 'border-az-scarlet/30 bg-az-scarlet/15'
                          : 'border-az-ink/6 bg-az-ink/3'
                      }`}
                    >
                      <div
                        className={`flex size-8 flex-shrink-0 items-center justify-center rounded-az-control ${
                          selected ? 'bg-az-scarlet/20 text-az-flame' : 'bg-az-ink/5 text-az-ink/70'
                        }`}
                      >
                        {getReasonIcon(reason.icon)}
                      </div>
                      <span className="az-body-strong text-az-ink">{reason.label}</span>
                      {selected && (
                        <Check className="ml-auto size-4 text-az-flame" aria-hidden="true" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Description */}
            <div className="az-glass p-5">
              <h2 className="az-title mb-3 text-az-ink">Additional details (optional)</h2>
              <label htmlFor="report-details" className="sr-only">
                Additional details
              </label>
              <textarea
                id="report-details"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Provide any additional context about your report..."
                className="az-input h-32 resize-none"
              />
            </div>

            {/* Error */}
            {error && (
              <div
                role="alert"
                className="az-body rounded-az-control border border-az-error-500/20 bg-az-error-500/10 p-4 text-az-error-400"
              >
                {error}
              </div>
            )}

            {/* Submit */}
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
          </div>
        )}
      </div>
    </PageShell>
  );
}

const LazyReportPage = lazy(() => Promise.resolve({ default: ReportPageContent }));

export default function ReportPage(): React.JSX.Element {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[var(--color-az-surface-root)]">
          <p className="az-lead text-az-ink-muted">Loading...</p>
        </div>
      }
    >
      <LazyReportPage />
    </Suspense>
  );
}
