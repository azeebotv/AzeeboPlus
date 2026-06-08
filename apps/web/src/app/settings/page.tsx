'use client';

import React from 'react';
import Link from 'next/link';
import { PushNotificationSettings } from '../../components/PushNotificationSettings';

export default function SettingsPage(): JSX.Element {
  const settingsSections = [
    {
      title: 'Account',
      items: [
        { label: 'Profile', href: '/profile/edit', icon: '👤' },
        { label: 'Privacy & Security', href: '/profile/privacy-security', icon: '🔒' },
        { label: 'Devices', href: '/settings/devices', icon: '🖥️' },
      ],
    },
    {
      title: 'Preferences',
      items: [
        { label: 'Notifications', href: '/notifications', icon: '🔔' },
        { label: 'Appearance', href: '#', icon: '🎨' },
        { label: 'Language', href: '#', icon: '🌐' },
      ],
    },
    {
      title: 'Support',
      items: [
        { label: 'Help Center', href: '/support', icon: '❓' },
        { label: 'Privacy Policy', href: '/privacy', icon: '📄' },
        { label: 'Terms of Service', href: '/terms', icon: '📋' },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-background py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Settings</h1>
          <p className="text-muted-foreground">Manage your account and preferences</p>
        </div>

        <div className="mb-8">
          <PushNotificationSettings />
        </div>

        <div className="space-y-8">
          {settingsSections.map((section) => (
            <div key={section.title}>
              <h2 className="text-xl font-bold text-foreground mb-4">{section.title}</h2>
              <div className="bg-card rounded-lg border border-border overflow-hidden">
                {section.items.map((item, index) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-4 p-4 hover:bg-muted transition-colors ${
                      index !== section.items.length - 1 ? 'border-b border-border' : ''
                    }`}
                  >
                    <span className="text-2xl">{item.icon}</span>
                    <span className="font-medium text-foreground">{item.label}</span>
                    <svg
                      className="w-5 h-5 ml-auto text-muted-foreground"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
