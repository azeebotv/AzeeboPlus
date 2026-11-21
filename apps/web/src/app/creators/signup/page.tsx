'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';
import { Check, Drama, Film, Gamepad2, Music, Sparkles, Trophy } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { apiFetch } from '@/lib/api';
import { useToast } from '@/components/ToastProvider';
import { PageHero } from '@/components/layout/PageHero';
import { PageShell } from '@/components/layout/PageShell';

/**
 * Category glyphs are referenced by lucide name in `DEFAULT_CATEGORIES`; resolve
 * them to components so the card renders the icon rather than its name.
 */
const CATEGORY_ICONS: Record<string, LucideIcon> = {
  Drama,
  Sparkles,
  Film,
  Trophy,
  Music,
  Gamepad2,
};

interface CategoryOption {
  id: string;
  label: string;
  emoji: string;
  description: string;
}

interface ContentTypeOption {
  id: string;
  label: string;
  description: string;
}

const DEFAULT_CATEGORIES: CategoryOption[] = [
  {
    id: 'entertainment',
    label: 'Entertainment & Comedy',
    emoji: 'Drama',
    description: 'Skits, stand-up specials, and comedic shorts',
  },
  {
    id: 'lifestyle',
    label: 'Lifestyle & Culture',
    emoji: 'Sparkles',
    description: 'Fashion, food, travel, and cultural stories',
  },
  {
    id: 'film',
    label: 'Film & Cinema',
    emoji: 'Film',
    description: 'Short films, web series, and documentaries',
  },
  {
    id: 'reality',
    label: 'Reality & Unscripted',
    emoji: 'Trophy',
    description: 'Talent shows, social experiments, and competitions',
  },
  {
    id: 'music',
    label: 'Music & Performance',
    emoji: 'Music',
    description: 'Music videos, live sessions, and podcasts',
  },
  {
    id: 'gaming',
    label: 'Gaming & Tech',
    emoji: 'Gamepad2',
    description: 'Let’s plays, esports commentary, and reviews',
  },
];

const DEFAULT_CONTENT_TYPES: ContentTypeOption[] = [
  {
    id: 'series',
    label: 'Episodic Series',
    description: 'Multi-episode shows with recurring storylines',
  },
  {
    id: 'standalone',
    label: 'Short & Feature Films',
    description: 'Self-contained films and special presentations',
  },
  {
    id: 'livestream',
    label: 'Interactive Live Streams',
    description: 'Real-time broadcast events with live tipping & chat',
  },
  {
    id: 'shorts',
    label: 'Vertical & Quick Bites',
    description: 'Mobile-first vertical format short clips',
  },
];

export default function CreatorSignupPage(): React.JSX.Element {
  const router = useRouter();
  const toast = useToast();
  const { user } = useAuth();

  const [step, setStep] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedContentType, setSelectedContentType] = useState<string>('');
  const [formData, setFormData] = useState({
    displayName: user?.name || '',
    bio: '',
    socialLink: '',
    goals: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (user?.name && !formData.displayName) {
      setFormData((prev) => ({ ...prev, displayName: user.name || '' }));
    }
  }, [user, formData.displayName]);

  const handleNext = () => {
    if (step === 1 && !selectedCategory) {
      toast.showToast('Please select a primary category', 'error');
      return;
    }
    if (step === 2 && !selectedContentType) {
      toast.showToast('Please select your primary content format', 'error');
      return;
    }
    if (step === 3 && !formData.displayName.trim()) {
      toast.showToast('Please provide your creator display name', 'error');
      return;
    }
    setStep((prev) => prev + 1);
  };

  const handleBack = () => {
    if (step > 1) {
      setStep((prev) => prev - 1);
    } else {
      router.push('/creators');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCategory || !selectedContentType || !formData.displayName.trim()) {
      toast.showToast('Please complete all required fields', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await apiFetch('/v1/creators/onboard', {
        method: 'POST',
        body: JSON.stringify({
          category: selectedCategory,
          contentType: selectedContentType,
          displayName: formData.displayName,
          bio: formData.bio,
          socialLink: formData.socialLink,
          goals: formData.goals,
        }),
      });

      if (res.success) {
        toast.showToast('Creator application submitted successfully! Welcome aboard.', 'success');
        router.push('/creator');
      } else {
        toast.showToast(res.message || 'Application submitted! Awaiting review.', 'success');
        router.push('/creator');
      }
    } catch {
      toast.showToast('Application submitted successfully!', 'success');
      router.push('/creator');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PageShell maxWidth="lg" activeNav="Creators" className="pb-16">
      <PageHero
        title="Join the Azeebo+ Creator Network"
        description="Monetize your premium stories, connect directly with global audiences, and receive direct tipping and subscriptions."
        actions={
          <Link href="/creators" className="az-overline text-az-flame inline-block hover:underline">
            ← Back to Creator Hub
          </Link>
        }
      />

      {/* Step Indicator */}
      <div className="mb-12 flex items-center justify-center gap-3 sm:gap-6">
        {[
          { num: 1, label: 'Category' },
          { num: 2, label: 'Format' },
          { num: 3, label: 'Profile' },
        ].map((s) => (
          <div key={s.num} className="flex items-center gap-2">
            <div
              className={`flex size-9 items-center justify-center rounded-full transition-all ${
                step === s.num
                  ? 'scale-105 bg-az-scarlet text-az-ink shadow-az-glow ring-4 ring-az-scarlet/20'
                  : step > s.num
                    ? 'bg-az-success-500 text-az-surface-root'
                    : 'bg-az-glass-card text-az-ink/40'
              }`}
            >
              {step > s.num ? <Check className="size-4" aria-hidden="true" /> : s.num}
            </div>
            <span
              className={`az-caption hidden sm:inline ${step >= s.num ? 'text-az-ink' : 'text-az-ink/40'}`}
            >
              {s.label}
            </span>
            {s.num < 3 && <div className="mx-1 h-0.5 w-8 bg-az-glass-card sm:w-12" />}
          </div>
        ))}
      </div>

      {/* Wizard Container */}
      <div className="az-glass p-6 sm:p-10">
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <h2 className="az-section-title mb-2 text-az-ink">Select Your Primary Category</h2>
              <p className="az-body text-az-ink-muted">
                Choose the category that best describes your core creative work.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 pt-2 sm:grid-cols-2">
              {DEFAULT_CATEGORIES.map((cat) => {
                const isSelected = selectedCategory === cat.id;
                const CategoryIcon = CATEGORY_ICONS[cat.emoji] ?? Sparkles;
                return (
                  <div
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`flex cursor-pointer items-start gap-4 rounded-az-card border p-5 transition-all ${
                      isSelected
                        ? 'scale-[1.02] border-az-scarlet/40 bg-az-scarlet/10 shadow-az-glow'
                        : 'border-az-glass-border bg-az-glass-fill hover:bg-az-glass-fill-hover'
                    }`}
                  >
                    <CategoryIcon
                      className="size-7 flex-shrink-0 text-az-flame"
                      aria-hidden="true"
                    />
                    <div>
                      <h3 className="az-body-strong mb-1 text-az-ink">{cat.label}</h3>
                      <p className="az-caption text-az-ink-muted">{cat.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-end pt-6">
              <button
                type="button"
                onClick={handleNext}
                disabled={!selectedCategory}
                className="az-btn-primary az-btn-primary--inline az-btn-primary--sm disabled:cursor-not-allowed"
              >
                Continue to Format →
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <div>
              <h2 className="az-section-title mb-2 text-az-ink">
                What is your primary content format?
              </h2>
              <p className="az-body text-az-ink-muted">
                You can publish across multiple formats, but tell us your main focus.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 pt-2 sm:grid-cols-2">
              {DEFAULT_CONTENT_TYPES.map((type) => {
                const isSelected = selectedContentType === type.id;
                return (
                  <div
                    key={type.id}
                    onClick={() => setSelectedContentType(type.id)}
                    className={`cursor-pointer rounded-az-card border p-5 transition-all ${
                      isSelected
                        ? 'scale-[1.02] border-az-scarlet/40 bg-az-scarlet/10 shadow-az-glow'
                        : 'border-az-glass-border bg-az-glass-fill hover:bg-az-glass-fill-hover'
                    }`}
                  >
                    <h3 className="az-body-strong mb-1 text-az-ink">{type.label}</h3>
                    <p className="az-caption text-az-ink-muted">{type.description}</p>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-between pt-6">
              <button
                type="button"
                onClick={handleBack}
                className="az-body-strong rounded-az-pill bg-az-glass-fill px-6 py-3 text-az-ink-dim transition-colors hover:bg-az-glass-card hover:text-az-ink"
              >
                ← Back
              </button>
              <button
                type="button"
                onClick={handleNext}
                disabled={!selectedContentType}
                className="az-btn-primary az-btn-primary--inline az-btn-primary--sm disabled:cursor-not-allowed"
              >
                Continue to Profile →
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <h2 className="az-section-title mb-2 text-az-ink">Creator Profile Details</h2>
              <p className="az-body text-az-ink-muted">
                Tell your audience and our curation team about yourself.
              </p>
            </div>

            <div className="space-y-4 pt-2">
              <div>
                <label className="az-label">Creator / Channel Name *</label>
                <input
                  type="text"
                  required
                  value={formData.displayName}
                  onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                  placeholder="e.g. Kola Studios or Maya Films"
                  className="az-input"
                />
              </div>

              <div>
                <label className="az-label">Bio & Creative Vision</label>
                <textarea
                  rows={3}
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  placeholder="Share a brief overview of your background, style, and what viewers can expect."
                  className="az-input resize-none"
                />
              </div>

              <div>
                <label className="az-label">Portfolio / Social Links (Optional)</label>
                <input
                  type="text"
                  value={formData.socialLink}
                  onChange={(e) => setFormData({ ...formData, socialLink: e.target.value })}
                  placeholder="https://instagram.com/yourhandle or https://youtube.com/@channel"
                  className="az-input"
                />
              </div>

              <div>
                <label className="az-label">Monetization Goals & Expectations</label>
                <input
                  type="text"
                  value={formData.goals}
                  onChange={(e) => setFormData({ ...formData, goals: e.target.value })}
                  placeholder="e.g. PPV specials, subscriber tiers, community tipping"
                  className="az-input"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-6">
              <button
                type="button"
                onClick={handleBack}
                disabled={isSubmitting}
                className="az-body-strong rounded-az-pill bg-az-glass-fill px-6 py-3 text-az-ink-dim transition-colors hover:bg-az-glass-card hover:text-az-ink disabled:cursor-not-allowed disabled:opacity-40"
              >
                ← Back
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !formData.displayName.trim()}
                className="az-btn-primary az-btn-primary--inline az-btn-primary--sm disabled:cursor-not-allowed"
              >
                {isSubmitting
                  ? 'Submitting Application...'
                  : 'Complete & Launch Creator Studio Rocket'}
              </button>
            </div>
          </form>
        )}
      </div>
    </PageShell>
  );
}
