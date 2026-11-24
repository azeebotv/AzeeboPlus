'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { BookOpen, Code, Key, Webhook, Shield, Zap, ExternalLink } from 'lucide-react';
import PageShell from '@/components/layout/PageShell';
import PageHero from '@/components/layout/PageHero';

const sections = [
  {
    title: 'Getting Started',
    description: 'Quick start guide to integrate with the Azeebo+ API',
    icon: Zap,
    href: '/developers/quickstart',
    tint: 'text-az-success-400',
    tile: 'bg-az-success-400/10',
  },
  {
    title: 'API Reference',
    description: 'Complete API documentation with examples',
    icon: Code,
    href: '/developers/api-reference',
    tint: 'text-az-secondary-400',
    tile: 'bg-az-secondary-400/10',
  },
  {
    title: 'Authentication',
    description: 'OAuth 2.0, API keys, and JWT token management',
    icon: Key,
    href: '/developers/authentication',
    tint: 'text-az-primary-300',
    tile: 'bg-az-primary-300/10',
  },
  {
    title: 'Webhooks',
    description: 'Real-time event notifications for your application',
    icon: Webhook,
    href: '/developers/webhooks',
    tint: 'text-az-flame',
    tile: 'bg-az-flame/10',
  },
  {
    title: 'Security',
    description: 'Security best practices and compliance guidelines',
    icon: Shield,
    href: '/developers/security',
    tint: 'text-az-error-400',
    tile: 'bg-az-error-400/10',
  },
  {
    title: 'Changelog',
    description: 'Track all API changes and updates',
    icon: BookOpen,
    href: '/developers/changelog',
    tint: 'text-az-warning-400',
    tile: 'bg-az-warning-400/10',
  },
];

const STATS = [
  { label: 'API Endpoints', value: '200+' },
  { label: 'Uptime', value: '99.99%' },
  { label: 'Response Time', value: '<100ms' },
  { label: 'Daily Requests', value: '1M+' },
];

export default function DevelopersPage(): React.JSX.Element {
  return (
    <PageShell activeNav="Developers" maxWidth="xl">
      <PageHero
        eyebrow="Developer Platform"
        title="Build on Azeebo+"
        subtitle="Access content, payments, and user management through our RESTful APIs — and ship amazing experiences on top of Africa's leading entertainment platform."
        actions={
          <>
            <Link href="/developers/quickstart" className="az-btn-social w-auto">
              Get Started
              <ExternalLink size={18} />
            </Link>
            <Link href="/developers/api-reference" className="az-btn-social w-auto">
              API Reference
            </Link>
          </>
        }
      />

      <div className="mb-14 grid grid-cols-2 gap-4 md:grid-cols-4">
        {STATS.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + i * 0.08 }}
            className="az-glass p-6 text-center"
          >
            <div className="az-heading az-text-gradient">{stat.value}</div>
            <div className="az-body text-az-ink-muted mt-1">{stat.label}</div>
          </motion.div>
        ))}
      </div>

      <h2 className="az-section-title text-az-ink mb-6">Documentation</h2>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-5">
        {sections.map((section, i) => (
          <motion.div
            key={section.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 + i * 0.06 }}
          >
            <Link href={section.href} className="az-glass block p-6">
              <span
                className={`mb-4 flex size-12 items-center justify-center rounded-az-control ${section.tile}`}
              >
                <section.icon size={24} className={section.tint} />
              </span>
              <h3 className="az-subtitle text-az-ink mb-2">{section.title}</h3>
              <p className="az-body text-az-ink-muted">{section.description}</p>
            </Link>
          </motion.div>
        ))}
      </div>

      <div className="az-glass mt-14 p-6 sm:p-8">
        <h2 className="az-title text-az-ink mb-4">Quick Example</h2>
        <pre className="overflow-auto rounded-az-control bg-az-surface-root/60 p-5 az-caption font-mono leading-relaxed">
          <code>{`// Fetch trending content
const response = await fetch('https://api.azeeboplus.com/v1/content/trending', {
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
  }
});

const data = await response.json();
console.log(data.content); // Array of trending content`}</code>
        </pre>
      </div>
    </PageShell>
  );
}
