'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function PrivacySecurityPage(): JSX.Element {
  const router = useRouter();

  const [twoFactorEnabled, setTwoFactorEnabled] = useState<boolean>(false);
  const [loginAlertsEnabled, setLoginAlertsEnabled] = useState<boolean>(true);
  const [profileVisibility, setProfileVisibility] = useState<'public' | 'private'>('public');
  const [activityStatusEnabled, setActivityStatusEnabled] = useState<boolean>(true);
  const [dataSharingEnabled, setDataSharingEnabled] = useState<boolean>(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false);

  const handleToggleTwoFactor = (): void => {
    setTwoFactorEnabled(!twoFactorEnabled);
  };

  const handleToggleLoginAlerts = (): void => {
    setLoginAlertsEnabled(!loginAlertsEnabled);
  };

  const handleToggleProfileVisibility = (): void => {
    setProfileVisibility(profileVisibility === 'public' ? 'private' : 'public');
  };

  const handleToggleActivityStatus = (): void => {
    setActivityStatusEnabled(!activityStatusEnabled);
  };

  const handleToggleDataSharing = (): void => {
    setDataSharingEnabled(!dataSharingEnabled);
  };

  return (
    <div className="min-h-screen bg-background py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="text-muted-foreground hover:text-foreground mb-4 flex items-center gap-2"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>
          <h1 className="text-3xl font-bold text-foreground">Privacy & Security</h1>
        </div>

        <div className="space-y-8">
          <div className="bg-card p-6 rounded-lg border border-border">
            <h2 className="text-xl font-semibold text-foreground mb-4">Security</h2>

            <div className="space-y-4">
              <div className="flex items-center justify-between py-3 border-b border-border">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-accent rounded-lg flex items-center justify-center">
                    <span className="text-xl">🔐</span>
                  </div>
                  <div>
                    <h3 className="font-medium text-foreground">Two-Factor Authentication</h3>
                    <p className="text-sm text-muted-foreground">Add an extra layer of security to your account</p>
                  </div>
                </div>
                <button
                  onClick={handleToggleTwoFactor}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    twoFactorEnabled ? 'bg-primary' : 'bg-muted'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      twoFactorEnabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between py-3 border-b border-border">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-accent rounded-lg flex items-center justify-center">
                    <span className="text-xl">🔑</span>
                  </div>
                  <div>
                    <h3 className="font-medium text-foreground">Change Password</h3>
                    <p className="text-sm text-muted-foreground">Update your account password</p>
                  </div>
                </div>
                <button
                  onClick={() => router.push('/auth/reset-password')}
                  className="text-primary hover:text-primary/90 text-sm font-medium"
                >
                  Change
                </button>
              </div>

              <div className="flex items-center justify-between py-3 border-b border-border">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-accent rounded-lg flex items-center justify-center">
                    <span className="text-xl">📱</span>
                  </div>
                  <div>
                    <h3 className="font-medium text-foreground">Active Sessions</h3>
                    <p className="text-sm text-muted-foreground">Manage your active login sessions</p>
                  </div>
                </div>
                <button className="text-primary hover:text-primary/90 text-sm font-medium">
                  Manage
                </button>
              </div>

              <div className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-accent rounded-lg flex items-center justify-center">
                    <span className="text-xl">🔔</span>
                  </div>
                  <div>
                    <h3 className="font-medium text-foreground">Login Alerts</h3>
                    <p className="text-sm text-muted-foreground">Get notified of suspicious login attempts</p>
                  </div>
                </div>
                <button
                  onClick={handleToggleLoginAlerts}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    loginAlertsEnabled ? 'bg-primary' : 'bg-muted'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      loginAlertsEnabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          <div className="bg-card p-6 rounded-lg border border-border">
            <h2 className="text-xl font-semibold text-foreground mb-4">Privacy</h2>

            <div className="space-y-4">
              <div className="flex items-center justify-between py-3 border-b border-border">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-accent rounded-lg flex items-center justify-center">
                    <span className="text-xl">👁️</span>
                  </div>
                  <div>
                    <h3 className="font-medium text-foreground">Profile Visibility</h3>
                    <p className="text-sm text-muted-foreground">Control who can see your profile</p>
                  </div>
                </div>
                <button
                  onClick={handleToggleProfileVisibility}
                  className="text-primary hover:text-primary/90 text-sm font-medium"
                >
                  {profileVisibility === 'public' ? 'Public' : 'Private'}
                </button>
              </div>

              <div className="flex items-center justify-between py-3 border-b border-border">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-accent rounded-lg flex items-center justify-center">
                    <span className="text-xl">🟢</span>
                  </div>
                  <div>
                    <h3 className="font-medium text-foreground">Activity Status</h3>
                    <p className="text-sm text-muted-foreground">Show when you're active</p>
                  </div>
                </div>
                <button
                  onClick={handleToggleActivityStatus}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    activityStatusEnabled ? 'bg-primary' : 'bg-muted'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      activityStatusEnabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between py-3 border-b border-border">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-accent rounded-lg flex items-center justify-center">
                    <span className="text-xl">📊</span>
                  </div>
                  <div>
                    <h3 className="font-medium text-foreground">Data Sharing</h3>
                    <p className="text-sm text-muted-foreground">Control how your data is used</p>
                  </div>
                </div>
                <button
                  onClick={handleToggleDataSharing}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    dataSharingEnabled ? 'bg-primary' : 'bg-muted'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      dataSharingEnabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-accent rounded-lg flex items-center justify-center">
                    <span className="text-xl">🚫</span>
                  </div>
                  <div>
                    <h3 className="font-medium text-foreground">Blocked Users</h3>
                    <p className="text-sm text-muted-foreground">Manage blocked accounts</p>
                  </div>
                </div>
                <button className="text-primary hover:text-primary/90 text-sm font-medium">
                  Manage
                </button>
              </div>
            </div>
          </div>

          <div className="bg-card p-6 rounded-lg border border-border">
            <h2 className="text-xl font-semibold text-foreground mb-4">Data & Privacy</h2>

            <div className="space-y-4">
              <div className="flex items-center justify-between py-3 border-b border-border">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-accent rounded-lg flex items-center justify-center">
                    <span className="text-xl">📥</span>
                  </div>
                  <div>
                    <h3 className="font-medium text-foreground">Download My Data</h3>
                    <p className="text-sm text-muted-foreground">Export all your data</p>
                  </div>
                </div>
                <button className="text-primary hover:text-primary/90 text-sm font-medium">
                  Download
                </button>
              </div>

              <div className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-destructive/10 rounded-lg flex items-center justify-center">
                    <span className="text-xl">🗑️</span>
                  </div>
                  <div>
                    <h3 className="font-medium text-destructive">Delete Account</h3>
                    <p className="text-sm text-muted-foreground">Permanently delete your account</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="text-destructive hover:text-destructive/90 text-sm font-medium"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>

        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-card rounded-lg p-6 max-w-md w-full">
              <h3 className="text-xl font-semibold text-foreground mb-2">Delete Account</h3>
              <p className="text-muted-foreground mb-6">
                This action cannot be undone. All your data will be permanently deleted.
              </p>
              <div className="flex gap-4">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 py-2 px-4 border border-border text-sm font-medium rounded-md text-muted-foreground hover:text-foreground hover:bg-accent"
                >
                  Cancel
                </button>
                <button className="flex-1 py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-destructive hover:bg-destructive/90">
                  Delete Account
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
