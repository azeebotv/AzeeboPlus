'use client';
import { Suspense, lazy, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';
import AppHeader from '@/components/layout/AppHeader';
import AppFooter from '@/components/layout/AppFooter';
import analytics from '@/lib/analytics';

const REASONS = [
  { id: 'spam', label: 'Spam or misleading', icon: '🚫' },
  { id: 'harassment', label: 'Harassment or hate speech', icon: '⚠️' },
  { id: 'violence', label: 'Violence or graphic content', icon: '🔒' },
  { id: 'inappropriate', label: 'Sexually explicit content', icon: '🔞' },
  { id: 'copyright', label: 'Copyright infringement', icon: '©️' },
  { id: 'misinformation', label: 'Misinformation', icon: '📰' },
  { id: 'other', label: 'Other', icon: '📝' },
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
    <div className="min-h-screen" style={{ backgroundColor: '#1A0A0A' }}>
      <AppHeader />

      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <h1 className="text-3xl font-bold text-white mb-2">Report Content</h1>
          <p className="text-white/50">Help us keep Azeebo+ safe for everyone</p>
        </motion.div>

        {!contentId ? (
          <div className="az-glass p-8 text-center rounded-2xl">
            <p className="text-white/50 mb-4">No content selected for reporting.</p>
            <p className="text-sm text-white/40">
              Please navigate to the content you want to report and use the report button.
            </p>
          </div>
        ) : submitted ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="az-glass p-8 text-center rounded-2xl"
          >
            <div
              className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center"
              style={{ backgroundColor: 'rgba(34,197,94,0.2)' }}
            >
              <svg
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#22C55E"
                strokeWidth="2"
              >
                <path d="M20 6L9 17l-5-5" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Report Submitted</h2>
            <p className="text-white/50 mb-6">
              Thank you for helping keep our community safe. We&apos;ll review your report shortly.
            </p>
            <p className="text-xs text-white/40">
              Report ID: {Math.random().toString(36).substring(2, 10).toUpperCase()}
            </p>
          </motion.div>
        ) : (
          <div className="space-y-6">
            {/* Reason Selection */}
            <div className="az-glass p-5 rounded-xl">
              <h2 className="text-lg font-bold text-white mb-4">Select a reason</h2>
              <div className="space-y-2">
                {REASONS.map((reason) => (
                  <button
                    key={reason.id}
                    type="button"
                    onClick={() => setSelectedReason(reason.id)}
                    className="w-full text-left p-3 rounded-lg flex items-center gap-3 transition-all"
                    style={{
                      backgroundColor:
                        selectedReason === reason.id
                          ? 'rgba(232,66,10,0.15)'
                          : 'rgba(255,255,255,0.03)',
                      border:
                        selectedReason === reason.id
                          ? '1px solid rgba(232,66,10,0.3)'
                          : '1px solid rgba(255,255,255,0.06)',
                    }}
                  >
                    <span className="text-lg">{reason.icon}</span>
                    <span className="text-sm font-medium text-white">{reason.label}</span>
                    {selectedReason === reason.id && (
                      <svg
                        className="ml-auto"
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="#E8420A"
                        strokeWidth="2"
                      >
                        <path d="M20 6L9 17l-5-5" />
                      </svg>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Description */}
            <div className="az-glass p-5 rounded-xl">
              <h2 className="text-lg font-bold text-white mb-3">Additional details (optional)</h2>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Provide any additional context about your report..."
                className="w-full h-32 px-4 py-3 rounded-lg text-sm text-white placeholder-white/30 resize-none focus:outline-none"
                style={{
                  backgroundColor: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                }}
              />
            </div>

            {/* Error */}
            {error && (
              <div
                className="p-4 rounded-lg text-sm text-red-400"
                style={{
                  backgroundColor: 'rgba(239,68,68,0.1)',
                  border: '1px solid rgba(239,68,68,0.2)',
                }}
              >
                {error}
              </div>
            )}

            {/* Submit */}
            <motion.button
              type="button"
              onClick={handleSubmit}
              disabled={!selectedReason || isSubmitting}
              className="w-full py-3 rounded-full text-sm font-semibold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ background: 'linear-gradient(135deg, #E8420A, #CC1C1C)' }}
              whileHover={{ scale: selectedReason ? 1.02 : 1 }}
              whileTap={{ scale: selectedReason ? 0.98 : 1 }}
            >
              {isSubmitting ? 'Submitting...' : 'Submit Report'}
            </motion.button>
          </div>
        )}
      </div>

      <AppFooter />
    </div>
  );
}

const LazyReportPage = lazy(() => Promise.resolve({ default: ReportPageContent }));

export default function ReportPage(): React.JSX.Element {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#1A0A0A]">
          <p className="text-white/50 text-lg">Loading...</p>
        </div>
      }
    >
      <LazyReportPage />
    </Suspense>
  );
}
