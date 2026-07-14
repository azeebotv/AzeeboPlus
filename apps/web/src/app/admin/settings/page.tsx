'use client';
import { useState, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import AdminLayout from '@/components/layout/AdminLayout';
import { Skeleton } from '@azeebo/ui/web';
import { ConfirmDialog } from '@/components/ConfirmDialog';

type Tab =
  | 'general'
  | 'plans'
  | 'access'
  | 'performance'
  | 'notifications'
  | 'integrations'
  | 'compliance'
  | 'localization'
  | 'security';

interface SystemSetting {
  id?: string;
  _id?: string;
  key: string;
  value: unknown;
  name?: string;
  price?: number;
  currency?: string;
  duration?: number;
  features?: string[];
  tier?: string;
  isActive?: boolean;
}

interface AdminUser {
  id?: string;
  _id?: string;
  email?: string;
  username?: string;
  role?: string;
  createdAt?: string;
}

interface NotificationTemplate {
  id?: string;
  _id?: string;
  name: string;
  subject?: string;
  content?: string;
  body?: string;
  type: 'email' | 'push' | 'sms' | 'in-app';
  createdAt?: string;
  isActive?: boolean;
}

const TABS: { key: Tab; label: string; icon: string }[] = [
  { key: 'general', label: 'General', icon: '⚙️' },
  { key: 'plans', label: 'Plans', icon: '💳' },
  { key: 'access', label: 'Access', icon: '🔐' },
  { key: 'performance', label: 'Performance', icon: '⚡' },
  { key: 'notifications', label: 'Notifications', icon: '🔔' },
  { key: 'integrations', label: 'Integrations', icon: '🔗' },
  { key: 'compliance', label: 'Compliance', icon: '🛡️' },
  { key: 'localization', label: 'Localization', icon: '🌍' },
  { key: 'security', label: 'Security', icon: '🔒' },
];

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '12px 16px',
  borderRadius: 12,
  border: '1px solid #2A1A1A',
  backgroundColor: '#0D0505',
  color: '#F5F0EB',
  fontSize: 15,
  outline: 'none',
  boxSizing: 'border-box',
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 13,
  fontWeight: 600,
  marginBottom: 6,
  color: '#9A8A7A',
};

const cardStyle: React.CSSProperties = {
  padding: 24,
  borderRadius: 20,
  marginBottom: 20,
};

const toggleBtnStyle = (on: boolean): React.CSSProperties => ({
  width: 48,
  height: 28,
  borderRadius: 14,
  border: 'none',
  cursor: 'pointer',
  position: 'relative',
  backgroundColor: on ? '#E8420A' : '#2A1A1A',
  transition: 'background-color 0.2s',
  flexShrink: 0,
});

const toggleKnobStyle = (on: boolean): React.CSSProperties => ({
  position: 'absolute',
  top: 3,
  left: on ? 23 : 3,
  width: 22,
  height: 22,
  borderRadius: '50%',
  backgroundColor: '#fff',
  transition: 'left 0.2s',
});

const btnPrimary: React.CSSProperties = {
  padding: '12px 28px',
  borderRadius: 999,
  border: 'none',
  background: 'linear-gradient(135deg, #E8420A 0%, #CC1C1C 100%)',
  color: '#fff',
  fontWeight: 700,
  fontSize: 14,
  cursor: 'pointer',
};

const btnSecondary: React.CSSProperties = {
  padding: '12px 28px',
  borderRadius: 999,
  border: '1px solid #2A1A1A',
  background: 'transparent',
  color: '#F5F0EB',
  fontWeight: 600,
  fontSize: 14,
  cursor: 'pointer',
};

function Toggle({
  checked,
  onChange,
  label,
  desc,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  desc?: string;
}) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '10px 0',
        borderBottom: '1px solid #2A1A1A',
      }}
    >
      <div>
        <p style={{ fontWeight: 600, fontSize: 15 }}>{label}</p>
        {desc && <p style={{ color: '#9A8A7A', fontSize: 13 }}>{desc}</p>}
      </div>
      <button onClick={() => onChange(!checked)} style={toggleBtnStyle(checked)}>
        <span style={toggleKnobStyle(checked)} />
      </button>
    </div>
  );
}

function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <div>
      <label style={labelStyle}>{label}</label>
      {children}
      {hint && <p style={{ color: '#6B5A4A', fontSize: 12, marginTop: 4 }}>{hint}</p>}
    </div>
  );
}

function Modal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  if (!open) return null;
  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0,0,0,0.7)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 100,
        padding: 16,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="az-glass"
        style={{
          width: '100%',
          maxWidth: 560,
          maxHeight: '90vh',
          overflowY: 'auto',
          padding: 32,
          borderRadius: 20,
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 24,
          }}
        >
          <h2 style={{ fontSize: 20, fontWeight: 700 }}>{title}</h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#9A8A7A',
              fontSize: 24,
              cursor: 'pointer',
            }}
          >
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export default function AdminSettingsPage(): React.JSX.Element {
  const { isAuthenticated, user, isLoading: authLoading } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<Tab>('general');
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    message: string;
    destructive?: boolean;
    onConfirm: () => void;
  }>({ open: false, title: '', message: '', onConfirm: () => {} });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isEnabled = !authLoading && !!isAuthenticated && !!user && user.role === 'admin';

  // General
  const [general, setGeneral] = useState({
    siteTitle: 'Azeebo+',
    siteDescription: '',
    metaDescription: '',
    twitterUrl: '',
    instagramUrl: '',
    youtubeUrl: '',
    tiktokUrl: '',
    contactEmail: '',
    contactPhone: '',
    contactAddress: '',
    primaryColor: '#E8420A',
    secondaryColor: '#CC1C1C',
    accentColor: '#F5F0EB',
    logoUrl: '',
    faviconUrl: '',
    maintenanceMode: false,
    registrationEnabled: true,
    subscriptionEnabled: true,
    superVoteEnabled: true,
    referralEnabled: true,
  });

  // Plans
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState<SystemSetting | null>(null);
  const [planForm, setPlanForm] = useState({
    name: '',
    price: '',
    currency: 'NGN',
    duration: '',
    features: '',
    tier: 'basic',
    isActive: true,
  });

  // Access
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [adminForm, setAdminForm] = useState({ email: '', role: 'admin' });

  // Performance
  const [perfForm, setPerfForm] = useState({
    cacheTtl: 3600,
    cdnUrl: '',
    imageCompressionQuality: 80,
    maxUploadSize: 500,
  });

  // Notifications
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<NotificationTemplate | null>(null);
  const [templateForm, setTemplateForm] = useState({
    name: '',
    subject: '',
    content: '',
    type: 'email' as 'email' | 'push' | 'sms' | 'in-app',
  });
  const [notifTriggers, setNotifTriggers] = useState({
    onUserRegister: true,
    onContentUpload: true,
    onSubscription: true,
    onPayment: true,
    onReferral: true,
  });

  // Integrations
  const [integrations, setIntegrations] = useState({
    paystack: { apiKey: '', secretKey: '', enabled: false },
    flutterwave: { apiKey: '', secretKey: '', enabled: false },
    sendgrid: { apiKey: '', fromEmail: '', enabled: false },
    twilio: { accountSid: '', authToken: '', fromNumber: '', enabled: false },
    aws: { accessKey: '', secretKey: '', region: '', enabled: false },
  });
  const [testingProvider, setTestingProvider] = useState<string | null>(null);

  // Compliance
  const [compliance, setCompliance] = useState({
    gdprEnabled: true,
    ccpaEnabled: false,
    termsUrl: '',
    termsText: '',
    privacyUrl: '',
    privacyText: '',
    retentionUsers: 365,
    retentionContent: 730,
    retentionAnalytics: 90,
    retentionLogs: 30,
  });

  // Localization
  const [localization, setLocalization] = useState({
    defaultLanguage: 'en',
    supportedLanguages: ['en'],
    timezone: 'Africa/Lagos',
    currency: 'NGN',
  });

  // Security
  const [security, setSecurity] = useState({
    twoFactorRequired: false,
    passwordMinLength: 8,
    passwordRequireUppercase: true,
    passwordRequireNumbers: true,
    passwordRequireSpecial: true,
    sessionTimeout: 60,
    ipWhitelist: '',
    ipBlacklist: '',
  });

  const { isLoading: isLoadingSettings } = useQuery({
    queryKey: ['admin', 'settings'],
    queryFn: async () => {
      const res = await api.admin.getAllSettings();
      if (res.success && res.data) {
        const arr = res.data as unknown as Array<{ key: string; value: unknown }>;
        if (Array.isArray(arr)) {
          const map: Record<string, unknown> = {};
          arr.forEach((s) => {
            map[s.key] = s.value;
          });
          return map;
        }
      }
      return {};
    },
    enabled: isEnabled,
  });

  const { data: plans = [] } = useQuery({
    queryKey: ['admin', 'plans'],
    queryFn: async () => {
      const res = await api.admin.getSubscriptionPlans();
      if (res.success && res.data) {
        const d = res.data as SystemSetting[] | { items?: SystemSetting[] };
        return Array.isArray(d) ? d : d.items || [];
      }
      return [];
    },
    enabled: isEnabled,
  });

  const { data: roles = {} } = useQuery({
    queryKey: ['admin', 'roles'],
    queryFn: async () => {
      const res = await api.admin.getRoles();
      if (res.success && res.data) {
        const d = res.data as unknown as Record<string, string[]>;
        if (d && typeof d === 'object') return d;
      }
      return {};
    },
    enabled: isEnabled,
  });

  const { data: admins = [] } = useQuery({
    queryKey: ['admin', 'admins'],
    queryFn: async () => {
      const res = await api.admin.getAdmins();
      if (res.success && res.data) {
        const d = res.data as AdminUser[] | { items?: AdminUser[] };
        return Array.isArray(d) ? d : d.items || [];
      }
      return [];
    },
    enabled: isEnabled,
  });

  const { data: templates = [] } = useQuery({
    queryKey: ['admin', 'templates'],
    queryFn: async () => {
      const res = await api.admin.getNotificationTemplates();
      if (res.success && res.data) {
        const d = res.data as NotificationTemplate[] | { items?: NotificationTemplate[] };
        return Array.isArray(d) ? d : d.items || [];
      }
      return [];
    },
    enabled: isEnabled,
  });

  const isLoading = authLoading || isLoadingSettings;

  const saveTab = async (tab: Tab) => {
    setSaving(true);
    setSaveError(null);
    try {
      if (tab === 'general') {
        const entries = Object.entries(general).map(([key, value]) => ({ key, value }));
        await api.admin.bulkUpdateSettings(entries);
      } else if (tab === 'plans') {
        /* plans save individually */
      } else if (tab === 'access') {
        await api.admin.bulkUpdateSettings(
          Object.entries(roles).map(([key, value]) => ({
            key: `role_${key}`,
            value,
          }))
        );
      } else if (tab === 'performance') {
        await api.admin.updatePerformance(perfForm);
      } else if (tab === 'notifications') {
        await api.admin.bulkUpdateSettings([{ key: 'notifTriggers', value: notifTriggers }]);
      } else if (tab === 'integrations') {
        await api.admin.bulkUpdateSettings([{ key: 'integrations', value: integrations }]);
      } else if (tab === 'compliance') {
        await api.admin.updateCompliance(compliance);
      } else if (tab === 'localization') {
        await api.admin.updateLocalization(localization);
      } else if (tab === 'security') {
        await api.admin.updateSecurity(security);
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to save');
    }
    setSaving(false);
  };

  const handleExport = async () => {
    try {
      const res = await api.admin.exportSettings();
      if (res.success && res.data) {
        const blob = new Blob([JSON.stringify(res.data, null, 2)], {
          type: 'application/json',
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `azeebo-settings-${new Date().toISOString().slice(0, 10)}.json`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch {
      /* ignore */
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      await api.admin.importSettings(data, 'merge');
      queryClient.invalidateQueries({ queryKey: ['admin', 'settings'] });
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Import failed');
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Plan CRUD
  const resetPlanForm = () => {
    setPlanForm({
      name: '',
      price: '',
      currency: 'NGN',
      duration: '',
      features: '',
      tier: 'basic',
      isActive: true,
    });
    setEditingPlan(null);
  };

  const openPlanModal = (plan?: SystemSetting) => {
    if (plan) {
      setEditingPlan(plan);
      setPlanForm({
        name: plan.name || '',
        price: String(plan.price || ''),
        currency: plan.currency || 'NGN',
        duration: String(plan.duration || ''),
        features: Array.isArray(plan.features) ? plan.features.join(', ') : '',
        tier: plan.tier || 'basic',
        isActive: plan.isActive !== false,
      });
    } else {
      resetPlanForm();
    }
    setShowPlanModal(true);
  };

  const savePlan = async () => {
    try {
      const payload = {
        ...planForm,
        price: Number(planForm.price),
        duration: Number(planForm.duration),
        features: planForm.features
          .split(',')
          .map((f) => f.trim())
          .filter(Boolean),
      };
      if (editingPlan) {
        await api.admin.updateSubscriptionPlan(editingPlan.id || editingPlan._id!, payload);
      } else {
        await api.admin.createSubscriptionPlan(payload);
      }
      setShowPlanModal(false);
      resetPlanForm();
      queryClient.invalidateQueries({ queryKey: ['admin', 'plans'] });
    } catch {
      /* ignore */
    }
  };

  const deletePlan = (id: string) => {
    setConfirmDialog({
      open: true,
      title: 'Delete Plan',
      message: 'Are you sure you want to delete this plan?',
      destructive: true,
      onConfirm: async () => {
        setConfirmDialog((prev) => ({ ...prev, open: false }));
        try {
          await api.admin.deleteSubscriptionPlan(id);
          queryClient.invalidateQueries({ queryKey: ['admin', 'plans'] });
        } catch {
          /* ignore */
        }
      },
    });
  };

  // Admin CRUD
  const addAdmin = async () => {
    try {
      await api.admin.createAdmin(adminForm);
      setShowAdminModal(false);
      setAdminForm({ email: '', role: 'admin' });
      queryClient.invalidateQueries({ queryKey: ['admin', 'admins'] });
    } catch {
      /* ignore */
    }
  };

  const removeAdmin = (id: string) => {
    setConfirmDialog({
      open: true,
      title: 'Remove Admin',
      message: 'Are you sure you want to remove this admin?',
      destructive: true,
      onConfirm: async () => {
        setConfirmDialog((prev) => ({ ...prev, open: false }));
        try {
          await api.admin.removeAdmin(id);
          queryClient.invalidateQueries({ queryKey: ['admin', 'admins'] });
        } catch {
          /* ignore */
        }
      },
    });
  };

  // Template CRUD
  const resetTemplateForm = () => {
    setTemplateForm({ name: '', subject: '', content: '', type: 'email' });
    setEditingTemplate(null);
  };

  const openTemplateModal = (t?: NotificationTemplate) => {
    if (t) {
      setEditingTemplate(t);
      setTemplateForm({
        name: t.name || '',
        subject: t.subject || '',
        content: t.content || t.body || '',
        type: t.type || 'email',
      });
    } else {
      resetTemplateForm();
    }
    setShowTemplateModal(true);
  };

  const saveTemplate = async () => {
    try {
      if (editingTemplate) {
        await api.admin.updateNotificationTemplate(
          editingTemplate.id || editingTemplate._id!,
          templateForm
        );
      } else {
        await api.admin.createNotificationTemplate(templateForm);
      }
      setShowTemplateModal(false);
      resetTemplateForm();
      queryClient.invalidateQueries({ queryKey: ['admin', 'templates'] });
    } catch {
      /* ignore */
    }
  };

  const testConnection = async (provider: string) => {
    setTestingProvider(provider);
    try {
      const res = await api.admin.testIntegration(provider);
      alert(
        res.success ? `Connection successful: ${res.data?.message || 'OK'}` : 'Connection failed'
      );
    } catch {
      alert('Connection test failed');
    }
    setTestingProvider(null);
  };

  if (authLoading || isLoading) {
    return (
      <AdminLayout>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20, padding: 20 }}>
          <Skeleton width="200px" height="32px" />
          <div style={{ display: 'flex', gap: 4 }}>
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} width="100px" height="40px" borderRadius="12px" />
            ))}
          </div>
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="az-glass" style={{ padding: 24, borderRadius: 20 }}>
              <Skeleton width="150px" height="20px" className="mb-4" />
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                  gap: 16,
                }}
              >
                {Array.from({ length: 4 }).map((_, j) => (
                  <div key={j}>
                    <Skeleton width="80px" height="14px" className="mb-2" />
                    <Skeleton width="100%" height="44px" borderRadius="12px" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </AdminLayout>
    );
  }

  const languages = [
    { code: 'en', name: 'English' },
    { code: 'ha', name: 'Hausa' },
    { code: 'yo', name: 'Yoruba' },
    { code: 'ig', name: 'Igbo' },
    { code: 'pcm', name: 'Nigerian Pidgin' },
    { code: 'sw', name: 'Swahili' },
    { code: 'fr', name: 'French' },
    { code: 'ar', name: 'Arabic' },
  ];

  const timezones = [
    'Africa/Lagos',
    'Africa/Accra',
    'Africa/Nairobi',
    'Africa/Johannesburg',
    'Europe/London',
    'Europe/Paris',
    'America/New_York',
    'America/Chicago',
    'America/Los_Angeles',
    'Asia/Dubai',
    'Asia/Tokyo',
  ];

  const currencies = ['NGN', 'USD', 'GBP', 'EUR', 'GHS', 'KES', 'ZAR'];

  return (
    <AdminLayout>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 24,
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 700 }}>Platform Settings</h1>
          <p style={{ color: '#9A8A7A', marginTop: 4 }}>Configure all platform settings</p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleImport}
            style={{ display: 'none' }}
          />
          <button onClick={() => fileInputRef.current?.click()} style={btnSecondary}>
            Import JSON
          </button>
          <button onClick={handleExport} style={btnSecondary}>
            Export JSON
          </button>
          {saved && (
            <span style={{ color: '#0D3B2E', fontWeight: 600, fontSize: 14 }}>✓ Saved</span>
          )}
          <button
            onClick={() => saveTab(activeTab)}
            disabled={saving}
            style={{
              ...btnPrimary,
              opacity: saving ? 0.6 : 1,
            }}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      {saveError && (
        <div
          className="az-glass"
          style={{
            padding: '12px 20px',
            borderRadius: 12,
            marginBottom: 20,
            color: '#E8420A',
            fontSize: 14,
          }}
        >
          {saveError}
        </div>
      )}

      {/* Tab Navigation */}
      <div
        className="az-glass"
        style={{
          padding: '6px 8px',
          borderRadius: 16,
          marginBottom: 24,
          display: 'flex',
          gap: 4,
          overflowX: 'auto',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              padding: '10px 18px',
              borderRadius: 12,
              border: 'none',
              background:
                activeTab === tab.key
                  ? 'linear-gradient(135deg, #E8420A 0%, #CC1C1C 100%)'
                  : 'transparent',
              color: activeTab === tab.key ? '#fff' : '#9A8A7A',
              fontWeight: 600,
              fontSize: 13,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all 0.2s',
            }}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* ===== GENERAL TAB ===== */}
      {activeTab === 'general' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="az-glass" style={cardStyle}>
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20 }}>Site Identity</h2>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: 16,
              }}
            >
              <Field label="Site Title">
                <input
                  value={general.siteTitle}
                  onChange={(e) => setGeneral({ ...general, siteTitle: e.target.value })}
                  style={inputStyle}
                />
              </Field>
              <Field label="Site Description" hint="Short description for the platform">
                <input
                  value={general.siteDescription}
                  onChange={(e) => setGeneral({ ...general, siteDescription: e.target.value })}
                  style={inputStyle}
                />
              </Field>
              <Field label="Meta Description" hint="For SEO purposes">
                <input
                  value={general.metaDescription}
                  onChange={(e) => setGeneral({ ...general, metaDescription: e.target.value })}
                  style={inputStyle}
                />
              </Field>
              <Field label="Logo URL">
                <input
                  value={general.logoUrl}
                  onChange={(e) => setGeneral({ ...general, logoUrl: e.target.value })}
                  style={inputStyle}
                  placeholder="https://..."
                />
              </Field>
              <Field label="Favicon URL">
                <input
                  value={general.faviconUrl}
                  onChange={(e) => setGeneral({ ...general, faviconUrl: e.target.value })}
                  style={inputStyle}
                  placeholder="https://..."
                />
              </Field>
            </div>
          </div>

          <div className="az-glass" style={cardStyle}>
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20 }}>Social Media</h2>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: 16,
              }}
            >
              <Field label="Twitter / X URL">
                <input
                  value={general.twitterUrl}
                  onChange={(e) => setGeneral({ ...general, twitterUrl: e.target.value })}
                  style={inputStyle}
                  placeholder="https://twitter.com/..."
                />
              </Field>
              <Field label="Instagram URL">
                <input
                  value={general.instagramUrl}
                  onChange={(e) => setGeneral({ ...general, instagramUrl: e.target.value })}
                  style={inputStyle}
                  placeholder="https://instagram.com/..."
                />
              </Field>
              <Field label="YouTube URL">
                <input
                  value={general.youtubeUrl}
                  onChange={(e) => setGeneral({ ...general, youtubeUrl: e.target.value })}
                  style={inputStyle}
                  placeholder="https://youtube.com/..."
                />
              </Field>
              <Field label="TikTok URL">
                <input
                  value={general.tiktokUrl}
                  onChange={(e) => setGeneral({ ...general, tiktokUrl: e.target.value })}
                  style={inputStyle}
                  placeholder="https://tiktok.com/..."
                />
              </Field>
            </div>
          </div>

          <div className="az-glass" style={cardStyle}>
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20 }}>Contact Info</h2>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: 16,
              }}
            >
              <Field label="Contact Email">
                <input
                  value={general.contactEmail}
                  onChange={(e) => setGeneral({ ...general, contactEmail: e.target.value })}
                  style={inputStyle}
                  type="email"
                  placeholder="hello@azeebo.com"
                />
              </Field>
              <Field label="Contact Phone">
                <input
                  value={general.contactPhone}
                  onChange={(e) => setGeneral({ ...general, contactPhone: e.target.value })}
                  style={inputStyle}
                  placeholder="+234..."
                />
              </Field>
              <Field label="Contact Address">
                <input
                  value={general.contactAddress}
                  onChange={(e) => setGeneral({ ...general, contactAddress: e.target.value })}
                  style={inputStyle}
                />
              </Field>
            </div>
          </div>

          <div className="az-glass" style={cardStyle}>
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20 }}>Brand Colors</h2>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: 20,
              }}
            >
              {(
                [
                  { key: 'primaryColor', label: 'Primary' },
                  { key: 'secondaryColor', label: 'Secondary' },
                  { key: 'accentColor', label: 'Accent' },
                ] as const
              ).map(({ key, label }) => (
                <div key={key}>
                  <label style={labelStyle}>{label} Color</label>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    <input
                      type="color"
                      value={general[key]}
                      onChange={(e) => setGeneral({ ...general, [key]: e.target.value })}
                      style={{
                        width: 48,
                        height: 40,
                        border: '1px solid #2A1A1A',
                        borderRadius: 8,
                        backgroundColor: '#0D0505',
                        cursor: 'pointer',
                        padding: 2,
                      }}
                    />
                    <input
                      value={general[key]}
                      onChange={(e) => setGeneral({ ...general, [key]: e.target.value })}
                      style={{ ...inputStyle, flex: 1 }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="az-glass" style={cardStyle}>
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>Feature Toggles</h2>
            <Toggle
              checked={general.maintenanceMode}
              onChange={(v) => setGeneral({ ...general, maintenanceMode: v })}
              label="Maintenance Mode"
              desc="Put the platform in maintenance mode"
            />
            <Toggle
              checked={general.registrationEnabled}
              onChange={(v) => setGeneral({ ...general, registrationEnabled: v })}
              label="Registration"
              desc="Allow new user registrations"
            />
            <Toggle
              checked={general.subscriptionEnabled}
              onChange={(v) => setGeneral({ ...general, subscriptionEnabled: v })}
              label="Subscriptions"
              desc="Enable subscription purchases"
            />
            <Toggle
              checked={general.superVoteEnabled}
              onChange={(v) => setGeneral({ ...general, superVoteEnabled: v })}
              label="Super Votes"
              desc="Enable super vote feature"
            />
            <Toggle
              checked={general.referralEnabled}
              onChange={(v) => setGeneral({ ...general, referralEnabled: v })}
              label="Referrals"
              desc="Enable referral program"
            />
          </div>
        </div>
      )}

      {/* ===== SUBSCRIPTION PLANS TAB ===== */}
      {activeTab === 'plans' && (
        <div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 20,
            }}
          >
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 700 }}>Subscription Plans</h2>
              <p style={{ color: '#9A8A7A', fontSize: 13, marginTop: 4 }}>
                {plans.length} plan{plans.length !== 1 ? 's' : ''} configured
              </p>
            </div>
            <button onClick={() => openPlanModal()} style={btnPrimary}>
              + Add Plan
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {plans.map((plan) => (
              <div
                key={plan.id || plan._id}
                className="az-glass"
                style={{ padding: 20, borderRadius: 16 }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'start',
                    flexWrap: 'wrap',
                    gap: 12,
                  }}
                >
                  <div style={{ flex: 1, minWidth: 200 }}>
                    <div
                      style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}
                    >
                      <h3 style={{ fontWeight: 700, fontSize: 16 }}>{plan.name}</h3>
                      <span
                        style={{
                          padding: '2px 10px',
                          borderRadius: 999,
                          fontSize: 11,
                          fontWeight: 600,
                          textTransform: 'capitalize',
                          backgroundColor:
                            plan.tier === 'premium'
                              ? 'rgba(232,66,10,0.2)'
                              : plan.tier === 'pro'
                                ? 'rgba(13,59,46,0.2)'
                                : 'rgba(154,138,122,0.2)',
                          color:
                            plan.tier === 'premium'
                              ? '#E8420A'
                              : plan.tier === 'pro'
                                ? '#0D3B2E'
                                : '#9A8A7A',
                        }}
                      >
                        {plan.tier || 'basic'}
                      </span>
                    </div>
                    <p style={{ color: '#9A8A7A', fontSize: 14, marginBottom: 8 }}>
                      {plan.currency || 'NGN'} {(plan.price || 0).toLocaleString()} /{' '}
                      {plan.duration || 0} days
                    </p>
                    {Array.isArray(plan.features) && plan.features.length > 0 && (
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        {plan.features.map((f: string, i: number) => (
                          <span
                            key={i}
                            style={{
                              padding: '2px 8px',
                              borderRadius: 6,
                              fontSize: 11,
                              backgroundColor: 'rgba(245,240,235,0.08)',
                              color: '#F5F0EB',
                            }}
                          >
                            {f}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                    <span
                      style={{
                        width: 10,
                        height: 10,
                        borderRadius: '50%',
                        backgroundColor: plan.isActive !== false ? '#0D3B2E' : '#CC1C1C',
                      }}
                    />
                    <button
                      onClick={() => openPlanModal(plan)}
                      style={{
                        padding: '6px 14px',
                        borderRadius: 999,
                        border: '1px solid #2A1A1A',
                        background: 'transparent',
                        color: '#F5F0EB',
                        fontSize: 12,
                        cursor: 'pointer',
                      }}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => deletePlan(plan.id || plan._id!)}
                      style={{
                        padding: '6px 14px',
                        borderRadius: 999,
                        border: '1px solid #CC1C1C',
                        background: 'transparent',
                        color: '#CC1C1C',
                        fontSize: 12,
                        cursor: 'pointer',
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {plans.length === 0 && (
              <div
                className="az-glass"
                style={{ padding: 40, borderRadius: 16, textAlign: 'center' }}
              >
                <p style={{ color: '#9A8A7A' }}>No subscription plans configured</p>
              </div>
            )}
          </div>

          <Modal
            open={showPlanModal}
            onClose={() => {
              setShowPlanModal(false);
              resetPlanForm();
            }}
            title={editingPlan ? 'Edit Plan' : 'Add Plan'}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <Field label="Plan Name">
                <input
                  value={planForm.name}
                  onChange={(e) => setPlanForm({ ...planForm, name: e.target.value })}
                  style={inputStyle}
                  placeholder="e.g. Premium Monthly"
                />
              </Field>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <Field label="Price">
                  <input
                    type="number"
                    value={planForm.price}
                    onChange={(e) => setPlanForm({ ...planForm, price: e.target.value })}
                    style={inputStyle}
                    placeholder="0"
                  />
                </Field>
                <Field label="Currency">
                  <select
                    value={planForm.currency}
                    onChange={(e) => setPlanForm({ ...planForm, currency: e.target.value })}
                    style={inputStyle}
                  >
                    {currencies.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <Field label="Duration (days)">
                  <input
                    type="number"
                    value={planForm.duration}
                    onChange={(e) => setPlanForm({ ...planForm, duration: e.target.value })}
                    style={inputStyle}
                    placeholder="30"
                  />
                </Field>
                <Field label="Tier">
                  <select
                    value={planForm.tier}
                    onChange={(e) => setPlanForm({ ...planForm, tier: e.target.value })}
                    style={inputStyle}
                  >
                    <option value="basic">Basic</option>
                    <option value="pro">Pro</option>
                    <option value="premium">Premium</option>
                  </select>
                </Field>
              </div>
              <Field label="Features" hint="Comma-separated list">
                <textarea
                  value={planForm.features}
                  onChange={(e) => setPlanForm({ ...planForm, features: e.target.value })}
                  style={{ ...inputStyle, minHeight: 80, resize: 'vertical' }}
                  placeholder="HD Streaming, No Ads, Download, ..."
                />
              </Field>
              <Toggle
                checked={planForm.isActive}
                onChange={(v) => setPlanForm({ ...planForm, isActive: v })}
                label="Active"
              />
              <button
                onClick={savePlan}
                disabled={!planForm.name || !planForm.price}
                style={{
                  ...btnPrimary,
                  width: '100%',
                  opacity: !planForm.name || !planForm.price ? 0.5 : 1,
                }}
              >
                {editingPlan ? 'Update Plan' : 'Create Plan'}
              </button>
            </div>
          </Modal>
        </div>
      )}

      {/* ===== USER ACCESS TAB ===== */}
      {activeTab === 'access' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="az-glass" style={cardStyle}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 20,
              }}
            >
              <h2 style={{ fontSize: 18, fontWeight: 700 }}>Roles & Permissions</h2>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {Object.entries(roles).map(([role, perms]) => (
                <div
                  key={role}
                  style={{
                    padding: 16,
                    borderRadius: 12,
                    border: '1px solid #2A1A1A',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                    <span
                      style={{
                        padding: '3px 12px',
                        borderRadius: 999,
                        fontSize: 13,
                        fontWeight: 700,
                        textTransform: 'capitalize',
                        backgroundColor:
                          role === 'admin' ? 'rgba(232,66,10,0.2)' : 'rgba(154,138,122,0.15)',
                        color: role === 'admin' ? '#E8420A' : '#F5F0EB',
                      }}
                    >
                      {role}
                    </span>
                    <span style={{ color: '#9A8A7A', fontSize: 13 }}>
                      {perms.length} permission{perms.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {perms.map((p: string, i: number) => (
                      <span
                        key={i}
                        style={{
                          padding: '2px 8px',
                          borderRadius: 6,
                          fontSize: 11,
                          backgroundColor: 'rgba(245,240,235,0.06)',
                          color: '#9A8A7A',
                        }}
                      >
                        {p}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="az-glass" style={cardStyle}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 20,
              }}
            >
              <h2 style={{ fontSize: 18, fontWeight: 700 }}>Admin Users</h2>
              <button onClick={() => setShowAdminModal(true)} style={btnPrimary}>
                + Add Admin
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {admins.map((a) => (
                <div
                  key={a.id || a._id || a.email}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '12px 16px',
                    borderRadius: 12,
                    border: '1px solid #2A1A1A',
                  }}
                >
                  <div>
                    <p style={{ fontWeight: 600, fontSize: 14 }}>{a.email || a.username}</p>
                    <p style={{ color: '#9A8A7A', fontSize: 12 }}>
                      {a.role || 'admin'} • Added{' '}
                      {a.createdAt ? new Date(a.createdAt).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                  <button
                    onClick={() => removeAdmin(a.id || a._id!)}
                    style={{
                      padding: '6px 14px',
                      borderRadius: 999,
                      border: '1px solid #CC1C1C',
                      background: 'transparent',
                      color: '#CC1C1C',
                      fontSize: 12,
                      cursor: 'pointer',
                    }}
                  >
                    Remove
                  </button>
                </div>
              ))}
              {admins.length === 0 && (
                <p style={{ textAlign: 'center', padding: 24, color: '#9A8A7A' }}>
                  No admin users found
                </p>
              )}
            </div>
          </div>

          <Modal
            open={showAdminModal}
            onClose={() => {
              setShowAdminModal(false);
              setAdminForm({ email: '', role: 'admin' });
            }}
            title="Add Admin User"
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <Field label="Email">
                <input
                  type="email"
                  value={adminForm.email}
                  onChange={(e) => setAdminForm({ ...adminForm, email: e.target.value })}
                  style={inputStyle}
                  placeholder="admin@example.com"
                />
              </Field>
              <Field label="Role">
                <select
                  value={adminForm.role}
                  onChange={(e) => setAdminForm({ ...adminForm, role: e.target.value })}
                  style={inputStyle}
                >
                  <option value="admin">Admin</option>
                  <option value="super_admin">Super Admin</option>
                </select>
              </Field>
              <button
                onClick={addAdmin}
                disabled={!adminForm.email}
                style={{ ...btnPrimary, width: '100%', opacity: !adminForm.email ? 0.5 : 1 }}
              >
                Add Admin
              </button>
            </div>
          </Modal>
        </div>
      )}

      {/* ===== PERFORMANCE TAB ===== */}
      {activeTab === 'performance' && (
        <div className="az-glass" style={cardStyle}>
          <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20 }}>Performance Settings</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Field label="Cache TTL (seconds)" hint="How long cached data stays fresh">
              <input
                type="number"
                value={perfForm.cacheTtl}
                onChange={(e) => setPerfForm({ ...perfForm, cacheTtl: Number(e.target.value) })}
                style={inputStyle}
              />
            </Field>
            <Field label="CDN URL" hint="Content delivery network base URL">
              <input
                value={perfForm.cdnUrl}
                onChange={(e) => setPerfForm({ ...perfForm, cdnUrl: e.target.value })}
                style={inputStyle}
                placeholder="https://cdn.azeebo.com"
              />
            </Field>
            <Field
              label="Image Compression Quality"
              hint="1-100, higher = better quality, larger files"
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <input
                  type="range"
                  min={10}
                  max={100}
                  value={perfForm.imageCompressionQuality}
                  onChange={(e) =>
                    setPerfForm({ ...perfForm, imageCompressionQuality: Number(e.target.value) })
                  }
                  style={{ flex: 1, accentColor: '#E8420A' }}
                />
                <span style={{ fontWeight: 700, fontSize: 16, minWidth: 48, textAlign: 'right' }}>
                  {perfForm.imageCompressionQuality}%
                </span>
              </div>
            </Field>
            <Field label="Max Upload Size (MB)">
              <input
                type="number"
                value={perfForm.maxUploadSize}
                onChange={(e) =>
                  setPerfForm({ ...perfForm, maxUploadSize: Number(e.target.value) })
                }
                style={inputStyle}
              />
            </Field>
          </div>
        </div>
      )}

      {/* ===== NOTIFICATIONS TAB ===== */}
      {activeTab === 'notifications' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="az-glass" style={cardStyle}>
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>
              Notification Triggers
            </h2>
            <Toggle
              checked={notifTriggers.onUserRegister}
              onChange={(v) => setNotifTriggers({ ...notifTriggers, onUserRegister: v })}
              label="User Registration"
              desc="Send notification when a new user registers"
            />
            <Toggle
              checked={notifTriggers.onContentUpload}
              onChange={(v) => setNotifTriggers({ ...notifTriggers, onContentUpload: v })}
              label="Content Upload"
              desc="Send notification when content is uploaded"
            />
            <Toggle
              checked={notifTriggers.onSubscription}
              onChange={(v) => setNotifTriggers({ ...notifTriggers, onSubscription: v })}
              label="Subscription Purchase"
              desc="Send notification on subscription purchase"
            />
            <Toggle
              checked={notifTriggers.onPayment}
              onChange={(v) => setNotifTriggers({ ...notifTriggers, onPayment: v })}
              label="Payment Received"
              desc="Send notification on payment received"
            />
            <Toggle
              checked={notifTriggers.onReferral}
              onChange={(v) => setNotifTriggers({ ...notifTriggers, onReferral: v })}
              label="Referral"
              desc="Send notification on successful referral"
            />
          </div>

          <div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 16,
              }}
            >
              <h2 style={{ fontSize: 18, fontWeight: 700 }}>Email Templates</h2>
              <button onClick={() => openTemplateModal()} style={btnPrimary}>
                + Add Template
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {templates.map((t) => (
                <div
                  key={t.id || t._id}
                  className="az-glass"
                  style={{ padding: 16, borderRadius: 16 }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'start',
                    }}
                  >
                    <div>
                      <h3 style={{ fontWeight: 600, fontSize: 15, marginBottom: 4 }}>
                        {t.name || (t as unknown as { title?: string }).title}
                      </h3>
                      <p style={{ color: '#9A8A7A', fontSize: 13 }}>
                        {t.subject || (t as unknown as { description?: string }).description}
                      </p>
                    </div>
                    <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                      <span
                        style={{
                          padding: '2px 10px',
                          borderRadius: 999,
                          fontSize: 11,
                          fontWeight: 600,
                          backgroundColor: 'rgba(232,66,10,0.1)',
                          color: '#E8420A',
                          textTransform: 'capitalize',
                        }}
                      >
                        {t.type || 'email'}
                      </span>
                      <button
                        onClick={() => openTemplateModal(t)}
                        style={{
                          padding: '4px 12px',
                          borderRadius: 999,
                          border: '1px solid #2A1A1A',
                          background: 'transparent',
                          color: '#9A8A7A',
                          fontSize: 12,
                          cursor: 'pointer',
                        }}
                      >
                        Edit
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              {templates.length === 0 && (
                <div
                  className="az-glass"
                  style={{ padding: 40, borderRadius: 16, textAlign: 'center' }}
                >
                  <p style={{ color: '#9A8A7A' }}>No templates configured</p>
                </div>
              )}
            </div>
          </div>

          <Modal
            open={showTemplateModal}
            onClose={() => {
              setShowTemplateModal(false);
              resetTemplateForm();
            }}
            title={editingTemplate ? 'Edit Template' : 'Add Template'}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <Field label="Template Name">
                <input
                  value={templateForm.name}
                  onChange={(e) => setTemplateForm({ ...templateForm, name: e.target.value })}
                  style={inputStyle}
                  placeholder="e.g. Welcome Email"
                />
              </Field>
              <Field label="Subject">
                <input
                  value={templateForm.subject}
                  onChange={(e) => setTemplateForm({ ...templateForm, subject: e.target.value })}
                  style={inputStyle}
                  placeholder="Welcome to Azeebo+!"
                />
              </Field>
              <Field label="Channel">
                <select
                  value={templateForm.type}
                  onChange={(e) =>
                    setTemplateForm({
                      ...templateForm,
                      type: e.target.value as 'email' | 'push' | 'sms' | 'in-app',
                    })
                  }
                  style={inputStyle}
                >
                  <option value="email">Email</option>
                  <option value="push">Push Notification</option>
                  <option value="sms">SMS</option>
                  <option value="in-app">In-App</option>
                </select>
              </Field>
              <Field label="Content">
                <textarea
                  value={templateForm.content}
                  onChange={(e) => setTemplateForm({ ...templateForm, content: e.target.value })}
                  style={{ ...inputStyle, minHeight: 120, resize: 'vertical' }}
                  placeholder="Template body..."
                />
              </Field>
              <button
                onClick={saveTemplate}
                disabled={!templateForm.name || !templateForm.content}
                style={{
                  ...btnPrimary,
                  width: '100%',
                  opacity: !templateForm.name || !templateForm.content ? 0.5 : 1,
                }}
              >
                {editingTemplate ? 'Update Template' : 'Create Template'}
              </button>
            </div>
          </Modal>
        </div>
      )}

      {/* ===== INTEGRATIONS TAB ===== */}
      {activeTab === 'integrations' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {(
            [
              { key: 'paystack', name: 'Paystack', desc: 'Payment processing' },
              { key: 'flutterwave', name: 'Flutterwave', desc: 'Payment processing' },
              { key: 'sendgrid', name: 'SendGrid', desc: 'Email delivery' },
              { key: 'twilio', name: 'Twilio', desc: 'SMS & voice' },
              { key: 'aws', name: 'AWS', desc: 'S3 storage & SES' },
            ] as const
          ).map(({ key, name, desc }) => {
            const cfg = integrations[key as keyof typeof integrations] || {};
            return (
              <div key={key} className="az-glass" style={cardStyle}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 16,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <h2 style={{ fontSize: 18, fontWeight: 700 }}>{name}</h2>
                    <span style={{ color: '#9A8A7A', fontSize: 13 }}>{desc}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <button
                      onClick={() => testConnection(key)}
                      disabled={testingProvider === key}
                      style={{
                        ...btnSecondary,
                        padding: '8px 16px',
                        fontSize: 12,
                        opacity: testingProvider === key ? 0.5 : 1,
                      }}
                    >
                      {testingProvider === key ? 'Testing...' : 'Test Connection'}
                    </button>
                    <Toggle
                      checked={!!cfg.enabled}
                      onChange={(v) =>
                        setIntegrations({
                          ...integrations,
                          [key]: { ...cfg, enabled: v },
                        })
                      }
                      label=""
                    />
                  </div>
                </div>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                    gap: 12,
                  }}
                >
                  {Object.entries(cfg)
                    .filter(([k]) => k !== 'enabled')
                    .map(([field, val]) => (
                      <Field
                        key={field}
                        label={field
                          .replace(/([A-Z])/g, ' $1')
                          .replace(/^./, (s) => s.toUpperCase())}
                      >
                        <input
                          type={
                            field.toLowerCase().includes('key') ||
                            field.toLowerCase().includes('secret') ||
                            field.toLowerCase().includes('auth')
                              ? 'password'
                              : 'text'
                          }
                          value={String(val || '')}
                          onChange={(e) =>
                            setIntegrations({
                              ...integrations,
                              [key]: { ...cfg, [field]: e.target.value },
                            })
                          }
                          style={inputStyle}
                          placeholder={`Enter ${field}`}
                        />
                      </Field>
                    ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ===== COMPLIANCE TAB ===== */}
      {activeTab === 'compliance' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="az-glass" style={cardStyle}>
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>
              Regulatory Compliance
            </h2>
            <Toggle
              checked={compliance.gdprEnabled}
              onChange={(v) => setCompliance({ ...compliance, gdprEnabled: v })}
              label="GDPR Compliance"
              desc="Enable GDPR data protection features"
            />
            <Toggle
              checked={compliance.ccpaEnabled}
              onChange={(v) => setCompliance({ ...compliance, ccpaEnabled: v })}
              label="CCPA Compliance"
              desc="Enable California Consumer Privacy Act features"
            />
          </div>

          <div className="az-glass" style={cardStyle}>
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20 }}>Terms & Privacy</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <Field label="Terms of Service URL">
                <input
                  value={compliance.termsUrl}
                  onChange={(e) => setCompliance({ ...compliance, termsUrl: e.target.value })}
                  style={inputStyle}
                  placeholder="https://..."
                />
              </Field>
              <Field label="Terms of Service Text" hint="Plain text content (used if no URL)">
                <textarea
                  value={compliance.termsText}
                  onChange={(e) => setCompliance({ ...compliance, termsText: e.target.value })}
                  style={{ ...inputStyle, minHeight: 100, resize: 'vertical' }}
                  placeholder="Terms content..."
                />
              </Field>
              <Field label="Privacy Policy URL">
                <input
                  value={compliance.privacyUrl}
                  onChange={(e) => setCompliance({ ...compliance, privacyUrl: e.target.value })}
                  style={inputStyle}
                  placeholder="https://..."
                />
              </Field>
              <Field label="Privacy Policy Text" hint="Plain text content (used if no URL)">
                <textarea
                  value={compliance.privacyText}
                  onChange={(e) => setCompliance({ ...compliance, privacyText: e.target.value })}
                  style={{ ...inputStyle, minHeight: 100, resize: 'vertical' }}
                  placeholder="Privacy policy content..."
                />
              </Field>
            </div>
          </div>

          <div className="az-glass" style={cardStyle}>
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20 }}>Data Retention</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <Field label="User Data (days)" hint="How long to keep user accounts after deletion">
                <input
                  type="number"
                  value={compliance.retentionUsers}
                  onChange={(e) =>
                    setCompliance({ ...compliance, retentionUsers: Number(e.target.value) })
                  }
                  style={inputStyle}
                />
              </Field>
              <Field label="Content Data (days)">
                <input
                  type="number"
                  value={compliance.retentionContent}
                  onChange={(e) =>
                    setCompliance({ ...compliance, retentionContent: Number(e.target.value) })
                  }
                  style={inputStyle}
                />
              </Field>
              <Field label="Analytics Data (days)">
                <input
                  type="number"
                  value={compliance.retentionAnalytics}
                  onChange={(e) =>
                    setCompliance({ ...compliance, retentionAnalytics: Number(e.target.value) })
                  }
                  style={inputStyle}
                />
              </Field>
              <Field label="Audit Logs (days)">
                <input
                  type="number"
                  value={compliance.retentionLogs}
                  onChange={(e) =>
                    setCompliance({ ...compliance, retentionLogs: Number(e.target.value) })
                  }
                  style={inputStyle}
                />
              </Field>
            </div>
          </div>
        </div>
      )}

      {/* ===== LOCALIZATION TAB ===== */}
      {activeTab === 'localization' && (
        <div className="az-glass" style={cardStyle}>
          <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20 }}>Localization Settings</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Field label="Default Language">
              <select
                value={localization.defaultLanguage}
                onChange={(e) =>
                  setLocalization({ ...localization, defaultLanguage: e.target.value })
                }
                style={inputStyle}
              >
                {languages.map((l) => (
                  <option key={l.code} value={l.code}>
                    {l.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Supported Languages" hint="Click to toggle languages">
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {languages.map((l) => {
                  const active = localization.supportedLanguages.includes(l.code);
                  return (
                    <button
                      key={l.code}
                      onClick={() => {
                        const updated = active
                          ? localization.supportedLanguages.filter((x) => x !== l.code)
                          : [...localization.supportedLanguages, l.code];
                        setLocalization({ ...localization, supportedLanguages: updated });
                      }}
                      style={{
                        padding: '8px 16px',
                        borderRadius: 999,
                        border: active ? 'none' : '1px solid #2A1A1A',
                        background: active
                          ? 'linear-gradient(135deg, #E8420A 0%, #CC1C1C 100%)'
                          : 'transparent',
                        color: active ? '#fff' : '#9A8A7A',
                        fontWeight: 500,
                        fontSize: 13,
                        cursor: 'pointer',
                      }}
                    >
                      {l.name}
                    </button>
                  );
                })}
              </div>
            </Field>
            <Field label="Timezone">
              <select
                value={localization.timezone}
                onChange={(e) => setLocalization({ ...localization, timezone: e.target.value })}
                style={inputStyle}
              >
                {timezones.map((tz) => (
                  <option key={tz} value={tz}>
                    {tz}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Currency">
              <select
                value={localization.currency}
                onChange={(e) => setLocalization({ ...localization, currency: e.target.value })}
                style={inputStyle}
              >
                {currencies.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </Field>
          </div>
        </div>
      )}

      {/* ===== SECURITY TAB ===== */}
      {activeTab === 'security' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="az-glass" style={cardStyle}>
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>
              Two-Factor Authentication
            </h2>
            <Toggle
              checked={security.twoFactorRequired}
              onChange={(v) => setSecurity({ ...security, twoFactorRequired: v })}
              label="Require 2FA for All Users"
              desc="Enforce two-factor authentication for every account"
            />
          </div>

          <div className="az-glass" style={cardStyle}>
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20 }}>Password Policy</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <Field label="Minimum Password Length">
                <input
                  type="number"
                  min={6}
                  max={128}
                  value={security.passwordMinLength}
                  onChange={(e) =>
                    setSecurity({ ...security, passwordMinLength: Number(e.target.value) })
                  }
                  style={inputStyle}
                />
              </Field>
              <Toggle
                checked={security.passwordRequireUppercase}
                onChange={(v) => setSecurity({ ...security, passwordRequireUppercase: v })}
                label="Require Uppercase Letters"
              />
              <Toggle
                checked={security.passwordRequireNumbers}
                onChange={(v) => setSecurity({ ...security, passwordRequireNumbers: v })}
                label="Require Numbers"
              />
              <Toggle
                checked={security.passwordRequireSpecial}
                onChange={(v) => setSecurity({ ...security, passwordRequireSpecial: v })}
                label="Require Special Characters"
              />
            </div>
          </div>

          <div className="az-glass" style={cardStyle}>
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20 }}>Session & IP</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <Field label="Session Timeout (minutes)" hint="Auto-logout after inactivity">
                <input
                  type="number"
                  min={5}
                  value={security.sessionTimeout}
                  onChange={(e) =>
                    setSecurity({ ...security, sessionTimeout: Number(e.target.value) })
                  }
                  style={inputStyle}
                />
              </Field>
              <Field label="IP Whitelist" hint="One IP per line. Leave empty to disable.">
                <textarea
                  value={security.ipWhitelist}
                  onChange={(e) => setSecurity({ ...security, ipWhitelist: e.target.value })}
                  style={{
                    ...inputStyle,
                    minHeight: 100,
                    fontFamily: 'monospace',
                    fontSize: 13,
                    resize: 'vertical',
                  }}
                  placeholder={'192.168.1.1\n10.0.0.0/8'}
                />
              </Field>
              <Field label="IP Blacklist" hint="One IP per line. Leave empty to disable.">
                <textarea
                  value={security.ipBlacklist}
                  onChange={(e) => setSecurity({ ...security, ipBlacklist: e.target.value })}
                  style={{
                    ...inputStyle,
                    minHeight: 100,
                    fontFamily: 'monospace',
                    fontSize: 13,
                    resize: 'vertical',
                  }}
                  placeholder={'203.0.113.50\n198.51.100.0/24'}
                />
              </Field>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
    <ConfirmDialog
      open={confirmDialog.open}
      title={confirmDialog.title}
      message={confirmDialog.message}
      destructive={confirmDialog.destructive}
      onConfirm={confirmDialog.onConfirm}
      onCancel={() => setConfirmDialog((prev) => ({ ...prev, open: false }))}
    />
  );
}
