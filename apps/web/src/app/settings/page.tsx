'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import PageShell from '@/components/layout/PageShell';
import PageHero from '@/components/layout/PageHero';
import { Skeleton, ErrorState, Spinner } from '@azeebo/ui/web';
import ThemeToggle from '@/components/ThemeToggle';
import { LanguageSelector } from '@/components/LanguageSelector';
import {
  Settings,
  Play,
  Bell,
  Database,
  Tv,
  Globe,
  Download,
  User,
  Shield,
  Smartphone,
  CreditCard,
  ChevronRight,
  CheckCircle2,
} from 'lucide-react';

interface UserSettings {
  language: string;
  autoplay: boolean;
  notifications: boolean;
  darkMode: boolean;
  dataSaver: boolean;
  downloadQuality: string;
}

const DEFAULT_SETTINGS: UserSettings = {
  language: 'en',
  autoplay: true,
  notifications: true,
  darkMode: true,
  dataSaver: false,
  downloadQuality: 'hd',
};

export default function SettingsPage(): React.JSX.Element {
  const { isAuthenticated, user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();

  const preferencesQuery = useQuery({
    queryKey: ['user', 'preferences'],
    queryFn: async () => {
      const result = await api.user.getPreferences();
      if (result.success && result.data) {
        const data = result.data as Partial<UserSettings>;
        return { ...DEFAULT_SETTINGS, ...data };
      }
      return DEFAULT_SETTINGS;
    },
    staleTime: 300000,
    enabled: isAuthenticated && !authLoading,
  });

  const [localSettings, setLocalSettings] = useState<UserSettings | null>(null);
  const settings = localSettings ?? preferencesQuery.data ?? DEFAULT_SETTINGS;

  const saveMutation = useMutation({
    mutationFn: async (newSettings: UserSettings) => {
      return api.user.updatePreferences(newSettings as unknown as Record<string, unknown>);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user', 'preferences'] });
    },
  });

  if (authLoading) return <></>;
  if (!isAuthenticated || !user) {
    router.push('/auth/login');
    return <></>;
  }

  const toggleItems = [
    {
      key: 'autoplay',
      label: 'Autoplay Next Episode',
      desc: 'Automatically transition to the next installment without interruption',
      icon: Play,
    },
    {
      key: 'notifications',
      label: 'Push & Live Notifications',
      desc: 'Receive alerts for live voting events, new releases, and bounty drops',
      icon: Bell,
    },
    {
      key: 'dataSaver',
      label: 'Data Saver Streaming',
      desc: 'Optimize stream bitrate for low-bandwidth or metered mobile networks',
      icon: Database,
    },
  ];

  const accountLinks = [
    {
      href: '/profile/edit',
      label: 'Edit Profile & Avatar',
      desc: 'Update display name, bio, and portrait',
      icon: User,
    },
    {
      href: '/profile/privacy-security',
      label: 'Privacy & Security',
      desc: 'Password, two-factor auth, and data privacy',
      icon: Shield,
    },
    {
      href: '/settings/devices',
      label: 'Registered Devices',
      desc: 'Manage active TVs, tablets, and phones',
      icon: Smartphone,
    },
    {
      href: '/wallet/subscription-plans',
      label: 'Universe Passes & Plans',
      desc: 'Manage VIP subscriptions and passes',
      icon: CreditCard,
    },
  ];

  return (
    <PageShell activeNav="Profile">
      <PageHero
        badge="Account Configuration"
        title="Settings & Preferences"
        subtitle="Fine-tune your streaming playback, notifications, and device permissions."
        accentColor="var(--color-az-flame)"
      />

      <div className="max-w-2xl mx-auto px-4 sm:px-6 pb-20 space-y-6">
        {/* Playback & Streaming Preferences */}
        <div className="az-glass p-6 sm:p-8 border border-az-glass-border">
          <h2 className="text-sm font-bold text-az-ink uppercase tracking-wider mb-5 flex items-center gap-2">
            <Settings size={16} className="text-az-flame" />
            <span>Playback & Behavior</span>
          </h2>
          <div className="space-y-4">
            {preferencesQuery.isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center justify-between py-2">
                    <div className="space-y-1">
                      <Skeleton width="140px" height="16px" />
                      <Skeleton width="220px" height="12px" />
                    </div>
                    <Skeleton width="48px" height="28px" borderRadius="14px" />
                  </div>
                ))}
              </div>
            ) : preferencesQuery.error ? (
              <ErrorState
                title="Failed to load settings"
                description="Please try again later."
                buttonText="Retry"
                onButtonPress={() => preferencesQuery.refetch()}
              />
            ) : (
              toggleItems.map((item) => {
                const Icon = item.icon;
                const isChecked = !!settings[item.key as keyof typeof settings];
                return (
                  <div
                    key={item.key}
                    className="flex items-center justify-between py-3 border-b border-az-ink/5 last:border-0"
                  >
                    <div className="flex items-start gap-3.5 pr-4">
                      <div className="w-9 h-9 rounded-xl bg-az-glass-fill text-az-ink/70 flex items-center justify-center flex-shrink-0 mt-0.5 border border-az-glass-border">
                        <Icon size={16} />
                      </div>
                      <div>
                        <p className="font-semibold text-az-ink text-sm">{item.label}</p>
                        <p className="text-xs text-az-ink/50 mt-0.5 leading-relaxed">{item.desc}</p>
                      </div>
                    </div>
                    <button
                      role="switch"
                      aria-checked={isChecked}
                      aria-label={`${item.label}: ${isChecked ? 'On' : 'Off'}`}
                      onClick={() => {
                        const updated = {
                          ...settings,
                          [item.key]: !settings[item.key as keyof typeof settings],
                        };
                        setLocalSettings(updated);
                      }}
                      className={`w-12 h-7 rounded-full transition-colors relative flex-shrink-0 focus:outline-none ${
                        isChecked ? 'bg-az-flame' : 'bg-az-ink/15'
                      }`}
                    >
                      <span
                        className={`absolute top-1 w-5 h-5 rounded-full bg-az-ink transition-all shadow-md ${
                          isChecked ? 'left-6' : 'left-1'
                        }`}
                      />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Download Quality */}
        <div className="az-glass p-6 sm:p-8 border border-az-glass-border">
          <h2 className="text-sm font-bold text-az-ink uppercase tracking-wider mb-2 flex items-center gap-2">
            <Download size={16} className="text-az-flame" />
            <span>Download & Offline Quality</span>
          </h2>
          <p className="text-xs text-az-ink/50 mb-5">
            Select resolution for videos saved to your device for offline viewing
          </p>
          <div className="grid grid-cols-3 gap-3">
            {[
              { id: 'sd', label: 'Standard (SD)', sub: 'Fastest • 480p' },
              { id: 'hd', label: 'High Def (HD)', sub: 'Balanced • 720p' },
              { id: 'fullhd', label: 'Full HD', sub: 'Best • 1080p' },
            ].map((q) => {
              const isSelected = settings.downloadQuality === q.id;
              return (
                <button
                  key={q.id}
                  type="button"
                  onClick={() => setLocalSettings({ ...settings, downloadQuality: q.id })}
                  className={`text-center transition-all ${
                    isSelected ? 'az-btn-primary shadow-lg shadow-az-flame/20 text-az-ink' : ''
                  }`}
                >
                  <p className="font-bold text-xs uppercase tracking-wider">{q.label}</p>
                  <p
                    className={`text-[10px] mt-0.5 ${isSelected ? 'text-az-ink/80' : 'text-az-ink/40'}`}
                  >
                    {q.sub}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Appearance & Theme */}
        <div className="az-glass p-6 sm:p-8 border border-az-glass-border">
          <h2 className="text-sm font-bold text-az-ink uppercase tracking-wider mb-1 flex items-center gap-2">
            <Tv size={16} className="text-az-flame" />
            <span>Appearance & Theme</span>
          </h2>
          <p className="text-xs text-az-ink/50 mb-4">
            Toggle between Luxury Dark Cinema Mode and Ambient Adaptive Light
          </p>
          <ThemeToggle />
        </div>

        {/* Language Selection */}
        <div className="az-glass p-6 sm:p-8 border border-az-glass-border">
          <h2 className="text-sm font-bold text-az-ink uppercase tracking-wider mb-1 flex items-center gap-2">
            <Globe size={16} className="text-az-flame" />
            <span>Display Language</span>
          </h2>
          <p className="text-xs text-az-ink/50 mb-4">
            Azeebo supports English, Pidgin, Yoruba, Hausa, and Igbo
          </p>
          <LanguageSelector />
        </div>

        {/* Account Quick Navigation */}
        <div className="az-glass p-6 sm:p-8 border border-az-glass-border">
          <h2 className="text-sm font-bold text-az-ink uppercase tracking-wider mb-4 flex items-center gap-2">
            <User size={16} className="text-az-flame" />
            <span>Account Management</span>
          </h2>
          <div className="divide-y divide-az-ink/5">
            {accountLinks.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className="flex items-center justify-between py-3.5 hover:bg-az-ink/[0.02] -mx-2 px-2 rounded-xl transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-az-glass-fill text-az-ink/60 flex items-center justify-center border border-az-glass-border group-hover:text-az-flame group-hover:border-az-flame/30 transition-colors">
                      <Icon size={16} />
                    </div>
                    <div>
                      <p className="font-semibold text-az-ink text-sm group-hover:text-az-flame transition-colors">
                        {link.label}
                      </p>
                      <p className="text-xs text-az-ink/40">{link.desc}</p>
                    </div>
                  </div>
                  <ChevronRight
                    size={16}
                    className="text-az-ink/30 group-hover:translate-x-0.5 group-hover:text-az-ink transition-all"
                  />
                </Link>
              );
            })}
          </div>
        </div>

        {saveMutation.isSuccess && (
          <div className="px-4 py-3 rounded-2xl bg-az-success-500/15 border border-az-success-500/30 text-az-success-400 text-center text-xs font-bold flex items-center justify-center gap-2">
            <CheckCircle2 size={16} />
            <span>Preferences saved successfully!</span>
          </div>
        )}

        <button
          onClick={() => saveMutation.mutate(settings)}
          disabled={saveMutation.isPending}
          className="transition-all az-btn-primary shadow-xl shadow-az-flame/25 flex items-center justify-center gap-2"
        >
          {saveMutation.isPending ? (
            <span className="flex items-center justify-center gap-2">
              <Spinner size="sm" color="#fff" />
              <span>Saving Preferences...</span>
            </span>
          ) : (
            'Save Changes'
          )}
        </button>
      </div>
    </PageShell>
  );
}
