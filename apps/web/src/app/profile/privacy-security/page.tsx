'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import { PageShell } from '@/components/layout/PageShell';

interface DeletionRequestState {
  status?: string;
  requestedAt?: string | null;
  scheduledAt?: string | null;
  completedAt?: string | null;
}

export default function PrivacySecurityPage(): React.JSX.Element {
  const { isAuthenticated, user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [settings, setSettings] = useState({
    isPrivate: false,
    showActivity: true,
    allowMessages: true,
    twoFactorEnabled: false,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [deletionStatus, setDeletionStatus] = useState<DeletionRequestState | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const savedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated || !user) {
      router.push('/auth/login');
      return;
    }
    loadSettings();
    void loadDeletionStatus();
  }, [authLoading, isAuthenticated, user, router]);

  const loadSettings = async () => {
    try {
      const response = await api.user.getPrivacySettings();
      if (response.success && response.data) setSettings(response.data as typeof settings);
    } catch {
      /* ignore */
    }
  };

  const loadDeletionStatus = async () => {
    try {
      const response = await api.user.getDeletionStatus();
      if (response.success && response.data) {
        setDeletionStatus(response.data as DeletionRequestState);
      }
    } catch {
      /* ignore */
    }
  };

  const handleExport = async () => {
    setIsExporting(true);
    setExportError(false);
    try {
      const response = await api.user.exportUserData();
      if (response.success && response.data) {
        const blob = new Blob([JSON.stringify(response.data, null, 2)], {
          type: 'application/json',
        });
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = `azeebo-data-export-${new Date().toISOString().slice(0, 10)}.json`;
        anchor.click();
        URL.revokeObjectURL(url);
      } else {
        setExportError(true);
      }
    } catch {
      setExportError(true);
    }
    setIsExporting(false);
  };

  const handleDeleteAccount = async () => {
    if (!confirmingDelete) {
      setConfirmingDelete(true);
      return;
    }
    setIsDeleting(true);
    try {
      await api.user.requestAccountDeletion();
      await loadDeletionStatus();
    } catch {
      /* ignore */
    }
    setIsDeleting(false);
    setConfirmingDelete(false);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await api.user.updatePrivacySettings(settings);
      setSaved(true);
      if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
      savedTimerRef.current = setTimeout(() => setSaved(false), 2000);
    } catch {
      /* ignore */
    }
    setIsSaving(false);
  };

  if (authLoading) return <></>;
  if (!isAuthenticated || !user) return <></>;

  const toggleItems = [
    {
      key: 'isPrivate',
      label: 'Private Account',
      desc: 'Only approved followers can see your content',
    },
    { key: 'showActivity', label: 'Show Activity', desc: 'Let others see your viewing activity' },
    { key: 'allowMessages', label: 'Direct Messages', desc: 'Allow anyone to send you messages' },
    {
      key: 'twoFactorEnabled',
      label: 'Two-Factor Authentication',
      desc: 'Add an extra layer of security',
    },
  ];

  return (
    <PageShell maxWidth="sm">
      <button
        type="button"
        onClick={() => router.back()}
        className="az-body mb-4 inline-flex items-center gap-2 text-az-ink-muted"
      >
        <ArrowLeft size={16} aria-hidden /> Back
      </button>
      <h1 className="az-headline text-az-heading mb-8 text-az-ink">Privacy &amp; Security</h1>

      <div className="az-glass mb-5 p-6">
        <div className="flex flex-col">
          {toggleItems.map((item) => {
            const key = item.key as keyof typeof settings;
            const isOn = settings[key];
            return (
              <div
                key={item.key}
                className="flex items-center justify-between gap-4 border-b border-az-glass-border py-3 last:border-b-0"
              >
                <div>
                  <p className="az-body-strong text-az-ink">{item.label}</p>
                  <p className="az-caption mt-0.5 text-az-ink-muted">{item.desc}</p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={isOn}
                  aria-label={item.label}
                  onClick={() => setSettings({ ...settings, [key]: !isOn })}
                  className={`relative h-7 w-12 shrink-0 cursor-pointer rounded-az-pill border-none transition-colors ${
                    isOn ? 'bg-az-flame' : 'bg-az-surface-edge'
                  }`}
                >
                  <span
                    className={`absolute top-[3px] size-[22px] rounded-full bg-az-ink transition-all ${
                      isOn ? 'left-[23px]' : 'left-[3px]'
                    }`}
                  />
                </button>
              </div>
            );
          })}
        </div>
      </div>

      <button type="button" onClick={handleSave} disabled={isSaving} className="az-btn-primary">
        {saved ? 'Check Saved!' : isSaving ? 'Saving...' : 'Save Settings'}
      </button>

      {/* Your data rights (AUD-72) */}
      <div className="az-glass mt-6 p-6">
        <h2 className="az-subtitle mb-3 text-az-ink">Your Data Rights</h2>
        <p className="az-body mb-4 text-az-ink-muted">
          Under the NDPA and GDPR you can download everything we hold about you at any time, and
          request erasure of your account. See our{' '}
          <a href="/cookies" className="text-az-flame">
            Cookie Policy
          </a>{' '}
          and{' '}
          <a href="/privacy" className="text-az-flame">
            Privacy Policy
          </a>
          .
        </p>
        <button
          type="button"
          onClick={handleExport}
          disabled={isExporting}
          className="az-btn-primary az-btn-primary--inline"
        >
          {isExporting
            ? 'Preparing export...'
            : exportError
              ? 'Export failed — retry'
              : 'Download My Data (JSON)'}
        </button>
        <p className="az-caption mt-4 text-az-ink-muted">
          Data deletion request:{' '}
          <span className="az-body-strong text-az-ink">
            {(() => {
              if (!deletionStatus?.status || deletionStatus.status === 'none') {
                return 'none on file';
              }
              if (deletionStatus.status === 'completed') return 'erasure completed';
              if (deletionStatus.scheduledAt) {
                return `scheduled for ${new Date(deletionStatus.scheduledAt).toLocaleDateString()}`;
              }
              return deletionStatus.status;
            })()}
          </span>
        </p>
      </div>

      {/* Danger zone */}
      <div className="mt-6 rounded-az-feature border border-az-error-500/30 bg-az-glass-fill p-6 backdrop-blur-az-glass">
        <h2 className="az-subtitle mb-3 text-az-error-500">Danger Zone</h2>
        <p className="az-body mb-4 text-az-ink-muted">
          Once you delete your account, there is no going back.
        </p>
        <button
          type="button"
          onClick={handleDeleteAccount}
          disabled={isDeleting}
          className={`cursor-pointer rounded-az-pill border border-az-error-500 px-6 py-2.5 az-body-strong ${
            confirmingDelete
              ? 'bg-az-error-600 text-az-ink'
              : 'bg-transparent text-az-error-500 hover:bg-az-error-500/10'
          } disabled:cursor-wait disabled:opacity-60`}
        >
          {isDeleting
            ? 'Submitting request...'
            : confirmingDelete
              ? 'Tap again to confirm erasure'
              : 'Delete Account'}
        </button>
      </div>
    </PageShell>
  );
}
