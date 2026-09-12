'use client';
import { Suspense, lazy, useEffect, useState } from 'react';

import { motion } from 'framer-motion';
import { useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';
import AppHeader from '@/components/layout/AppHeader';
import AppFooter from '@/components/layout/AppFooter';
import { ScrollReveal } from '@/components/motion/ScrollReveal';
import { GlowCard } from '@/components/motion/GlowCard';
import { Ban, AlertTriangle, Lock, ShieldAlert, Copyright, Newspaper, Frown, Heart, Scale, FileText, Check } from 'lucide-react';
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
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <AppHeader logoVariant="light" />

      <div className="max-w-lg mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div
            className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center"
            style={{ backgroundColor: 'rgba(239,68,68,0.15)' }}
          >
            <ShieldAlert className="w-8 h-8 text-rose-500" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">Report Content</h1>
          <p className="text-white/50 text-sm">Help keep our community safe</p>
        </motion.div>

        {!contentId ? (
          <ScrollReveal>
            <GlowCard className="p-8 text-center">
              <p className="text-white/50 mb-4">No content selected for reporting.</p>
              <p className="text-sm text-white/40">
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
                className="w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center"
                style={{ backgroundColor: 'rgba(34,197,94,0.15)' }}
              >
                <Check className="w-10 h-10 text-emerald-400" />
              </motion.div>
              <h2 className="text-xl font-bold text-white mb-2">Report Submitted</h2>
              <p className="text-white/50 mb-4">
                Thank you for helping keep our community safe. We&apos;ll review your report within
                24 hours.
              </p>
              <p className="text-xs text-white/40">
                Reference: {Math.random().toString(36).substring(2, 10).toUpperCase()}
              </p>
            </GlowCard>
          </ScrollReveal>
        ) : (
          <div className="space-y-6">
            <ScrollReveal>
              <GlowCard className="p-5">
                <h2 className="text-lg font-bold text-white mb-4">Select a reason</h2>
                <div className="space-y-2">
                  {REASONS.map((reason) => (
                    <button
                      key={reason.id}
                      type="button"
                      onClick={() => setSelectedReason(reason.id)}
                      className="w-full text-left p-3 rounded-lg flex items-start gap-3 transition-all"
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
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                        style={{
                          backgroundColor:
                            selectedReason === reason.id
                              ? 'rgba(232,66,10,0.2)'
                              : 'rgba(255,255,255,0.05)',
                          color: selectedReason === reason.id ? '#E8420A' : 'rgba(255,255,255,0.7)',
                        }}
                      >
                        {getReasonIcon(reason.icon)}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-white">{reason.label}</p>
                        <p className="text-xs text-white/40 mt-0.5">{reason.description}</p>
                      </div>
                      {selectedReason === reason.id && (
                        <Check className="mt-1 w-4 h-4 text-orange-500 flex-shrink-0" />
                      )}
                    </button>
                  ))}
                </div>
              </GlowCard>
            </ScrollReveal>

            <ScrollReveal delay={0.1}>
              <GlowCard className="p-5">
                <h2 className="text-lg font-bold text-white mb-3">Additional details</h2>
                <p className="text-xs text-white/40 mb-3">
                  Optional - help us understand the issue better
                </p>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Provide any additional context..."
                  className="w-full h-28 px-4 py-3 rounded-lg text-sm text-white placeholder-white/30 resize-none focus:outline-none"
                  style={{
                    backgroundColor: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                  }}
                />
              </GlowCard>
            </ScrollReveal>

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

            <ScrollReveal delay={0.2}>
              <motion.button
                type="button"
                onClick={handleSubmit}
                disabled={!selectedReason || isSubmitting}
                className="w-full py-4 rounded-full text-base font-semibold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ background: 'linear-gradient(135deg, #E8420A, #CC1C1C)' }}
                whileHover={{ scale: selectedReason ? 1.02 : 1 }}
                whileTap={{ scale: selectedReason ? 0.98 : 1 }}
              >
                {isSubmitting ? 'Submitting...' : 'Submit Report'}
              </motion.button>
            </ScrollReveal>

            <ScrollReveal delay={0.25}>
              <p className="text-xs text-white/30 text-center">
                Reports are reviewed within 24 hours. Your identity is kept confidential.
              </p>
            </ScrollReveal>
          </div>
        )}
      </div>

      <AppFooter logoVariant="light" />
    </div>
  );
}

const LazyMobileReportPage = lazy(() => Promise.resolve({ default: MobileReportPageContent }));

export default function MobileReportPage(): React.JSX.Element {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[var(--brand-near-black)]">
          <p className="text-white/50 text-lg">Loading...</p>
        </div>
      }
    >
      <LazyMobileReportPage />
    </Suspense>
  );
}
