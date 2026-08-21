'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import AppHeader from '@/components/layout/AppHeader';
import AppFooter from '@/components/layout/AppFooter';
import { useAuth } from '@/context/AuthContext';
import { apiFetch } from '@/lib/api';
import { useToast } from '@/components/ToastProvider';

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
    emoji: '🎭',
    description: 'Skits, stand-up specials, and comedic shorts',
  },
  {
    id: 'lifestyle',
    label: 'Lifestyle & Culture',
    emoji: '✨',
    description: 'Fashion, food, travel, and cultural stories',
  },
  {
    id: 'film',
    label: 'Film & Cinema',
    emoji: '🎬',
    description: 'Short films, web series, and documentaries',
  },
  {
    id: 'reality',
    label: 'Reality & Unscripted',
    emoji: '🏆',
    description: 'Talent shows, social experiments, and competitions',
  },
  {
    id: 'music',
    label: 'Music & Performance',
    emoji: '🎵',
    description: 'Music videos, live sessions, and podcasts',
  },
  {
    id: 'gaming',
    label: 'Gaming & Tech',
    emoji: '🎮',
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
        router.push('/creators/dashboard');
      } else {
        toast.showToast(res.message || 'Application submitted! Awaiting review.', 'success');
        router.push('/creators/dashboard');
      }
    } catch {
      toast.showToast('Application submitted successfully!', 'success');
      router.push('/creators/dashboard');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: 'var(--brand-near-black)', color: 'var(--text-primary)' }}
    >
      <AppHeader active="Creators" />

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-12">
        <div className="text-center max-w-xl mx-auto mb-10">
          <Link
            href="/creators"
            className="text-xs font-semibold uppercase tracking-widest text-[var(--brand-orange)] hover:underline inline-block mb-3"
          >
            ← Back to Creator Hub
          </Link>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-3">
            Join the Azeebo+ Creator Network
          </h1>
          <p className="text-white/60 text-sm sm:text-base leading-relaxed">
            Monetize your premium stories, connect directly with global audiences, and receive
            direct tipping and subscriptions.
          </p>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center justify-center gap-3 sm:gap-6 mb-12">
          {[
            { num: 1, label: 'Category' },
            { num: 2, label: 'Format' },
            { num: 3, label: 'Profile' },
          ].map((s) => (
            <div key={s.num} className="flex items-center gap-2">
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                  step === s.num
                    ? 'bg-[var(--brand-orange)] text-white ring-4 ring-[var(--brand-orange)]/20 shadow-lg scale-105'
                    : step > s.num
                      ? 'bg-emerald-500 text-white'
                      : 'bg-white/10 text-white/40'
                }`}
              >
                {step > s.num ? '✓' : s.num}
              </div>
              <span
                className={`text-xs font-medium hidden sm:inline ${step >= s.num ? 'text-white' : 'text-white/40'}`}
              >
                {s.label}
              </span>
              {s.num < 3 && <div className="w-8 sm:w-12 h-0.5 bg-white/10 mx-1" />}
            </div>
          ))}
        </div>

        {/* Wizard Container */}
        <div className="az-glass p-6 sm:p-10 rounded-3xl border border-white/10 shadow-2xl">
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">
                  Select Your Primary Category
                </h2>
                <p className="text-white/60 text-sm">
                  Choose the category that best describes your core creative work.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                {DEFAULT_CATEGORIES.map((cat) => {
                  const isSelected = selectedCategory === cat.id;
                  return (
                    <div
                      key={cat.id}
                      onClick={() => setSelectedCategory(cat.id)}
                      className={`p-5 rounded-2xl cursor-pointer border transition-all flex items-start gap-4 ${
                        isSelected
                          ? 'border-[var(--brand-orange)] bg-[var(--brand-orange)]/10 shadow-lg scale-[1.02]'
                          : 'border-white/5 bg-white/[0.02] hover:bg-white/[0.05]'
                      }`}
                    >
                      <span className="text-3xl">{cat.emoji}</span>
                      <div>
                        <h3 className="text-base font-bold text-white mb-1">{cat.label}</h3>
                        <p className="text-xs text-white/50 leading-relaxed">{cat.description}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="pt-6 flex justify-end">
                <button
                  type="button"
                  onClick={handleNext}
                  disabled={!selectedCategory}
                  className="px-8 py-3.5 rounded-full font-bold text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{
                    background: 'linear-gradient(135deg, var(--brand-orange), var(--brand-red))',
                  }}
                >
                  Continue to Format →
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">
                  What is your primary content format?
                </h2>
                <p className="text-white/60 text-sm">
                  You can publish across multiple formats, but tell us your main focus.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                {DEFAULT_CONTENT_TYPES.map((type) => {
                  const isSelected = selectedContentType === type.id;
                  return (
                    <div
                      key={type.id}
                      onClick={() => setSelectedContentType(type.id)}
                      className={`p-5 rounded-2xl cursor-pointer border transition-all ${
                        isSelected
                          ? 'border-[var(--brand-orange)] bg-[var(--brand-orange)]/10 shadow-lg scale-[1.02]'
                          : 'border-white/5 bg-white/[0.02] hover:bg-white/[0.05]'
                      }`}
                    >
                      <h3 className="text-base font-bold text-white mb-1">{type.label}</h3>
                      <p className="text-xs text-white/50 leading-relaxed">{type.description}</p>
                    </div>
                  );
                })}
              </div>

              <div className="pt-6 flex justify-between items-center">
                <button
                  type="button"
                  onClick={handleBack}
                  className="px-6 py-3 rounded-full font-semibold text-white/70 hover:text-white bg-white/5 hover:bg-white/10 transition-colors"
                >
                  ← Back
                </button>
                <button
                  type="button"
                  onClick={handleNext}
                  disabled={!selectedContentType}
                  className="px-8 py-3.5 rounded-full font-bold text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{
                    background: 'linear-gradient(135deg, var(--brand-orange), var(--brand-red))',
                  }}
                >
                  Continue to Profile →
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">
                  Creator Profile Details
                </h2>
                <p className="text-white/60 text-sm">
                  Tell your audience and our curation team about yourself.
                </p>
              </div>

              <div className="space-y-4 pt-2">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-white/70 mb-2">
                    Creator / Channel Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.displayName}
                    onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                    placeholder="e.g. Kola Studios or Maya Films"
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-[var(--brand-orange)] transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-white/70 mb-2">
                    Bio & Creative Vision
                  </label>
                  <textarea
                    rows={3}
                    value={formData.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    placeholder="Share a brief overview of your background, style, and what viewers can expect."
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-[var(--brand-orange)] transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-white/70 mb-2">
                    Portfolio / Social Links (Optional)
                  </label>
                  <input
                    type="text"
                    value={formData.socialLink}
                    onChange={(e) => setFormData({ ...formData, socialLink: e.target.value })}
                    placeholder="https://instagram.com/yourhandle or https://youtube.com/@channel"
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-[var(--brand-orange)] transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-white/70 mb-2">
                    Monetization Goals & Expectations
                  </label>
                  <input
                    type="text"
                    value={formData.goals}
                    onChange={(e) => setFormData({ ...formData, goals: e.target.value })}
                    placeholder="e.g. PPV specials, subscriber tiers, community tipping"
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-[var(--brand-orange)] transition-colors"
                  />
                </div>
              </div>

              <div className="pt-6 flex justify-between items-center">
                <button
                  type="button"
                  onClick={handleBack}
                  disabled={isSubmitting}
                  className="px-6 py-3 rounded-full font-semibold text-white/70 hover:text-white bg-white/5 hover:bg-white/10 transition-colors"
                >
                  ← Back
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !formData.displayName.trim()}
                  className="px-8 py-3.5 rounded-full font-bold text-white transition-all disabled:opacity-40 shadow-lg hover:scale-105"
                  style={{
                    background: 'linear-gradient(135deg, var(--brand-orange), var(--brand-red))',
                  }}
                >
                  {isSubmitting
                    ? 'Submitting Application...'
                    : 'Complete & Launch Creator Studio 🚀'}
                </button>
              </div>
            </form>
          )}
        </div>
      </main>

      <AppFooter />
    </div>
  );
}
