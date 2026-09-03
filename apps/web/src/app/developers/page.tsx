'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { BookOpen, Code, Key, Webhook, Shield, Zap, ExternalLink } from 'lucide-react';
import AppHeader from '@/components/layout/AppHeader';
import AppFooter from '@/components/layout/AppFooter';

const sections = [
  {
    title: 'Getting Started',
    description: 'Quick start guide to integrate with the Azeebo+ API',
    icon: Zap,
    href: '/developers/quickstart',
    color: 'var(--brand-emerald)',
  },
  {
    title: 'API Reference',
    description: 'Complete API documentation with examples',
    icon: Code,
    href: '/developers/api-reference',
    color: 'var(--brand-blue)',
  },
  {
    title: 'Authentication',
    description: 'OAuth 2.0, API keys, and JWT token management',
    icon: Key,
    href: '/developers/authentication',
    color: 'var(--brand-purple)',
  },
  {
    title: 'Webhooks',
    description: 'Real-time event notifications for your application',
    icon: Webhook,
    href: '/developers/webhooks',
    color: 'var(--brand-pink)',
  },
  {
    title: 'Security',
    description: 'Security best practices and compliance guidelines',
    icon: Shield,
    href: '/developers/security',
    color: 'var(--brand-red)',
  },
  {
    title: 'Changelog',
    description: 'Track all API changes and updates',
    icon: BookOpen,
    href: '/developers/changelog',
    color: 'var(--brand-amber)',
  },
];

export default function DevelopersPage(): React.JSX.Element {
  return (
    <div
      style={{
        backgroundColor: 'var(--bg-primary, #1A0A0A)',
        minHeight: '100vh',
        color: 'var(--text-primary, #F5F0EB)',
      }}
    >
      <AppHeader />
      <main
        style={{
          paddingTop: 100,
          paddingBottom: 60,
          maxWidth: 1000,
          margin: '0 auto',
          padding: '100px 24px 60px',
        }}
      >
        {/* Hero Section */}
        <div style={{ textAlign: 'center', marginBottom: 64 }}>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ fontSize: 48, fontWeight: 800, marginBottom: 16 }}
          >
            Azeebo+ Developer Platform
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            style={{
              fontSize: 18,
              color: 'var(--text-muted, #9A8A7A)',
              maxWidth: 600,
              margin: '0 auto',
              lineHeight: 1.6,
            }}
          >
            Build amazing experiences on top of Africa's leading entertainment platform. Access
            content, payments, and user management through our RESTful APIs.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            style={{ display: 'flex', gap: 16, justifyContent: 'center', marginTop: 32 }}
          >
            <Link
              href="/developers/quickstart"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '14px 28px',
                borderRadius: 12,
                backgroundColor: 'var(--brand-orange)',
                color: 'white',
                fontSize: 16,
                fontWeight: 600,
                textDecoration: 'none',
              }}
            >
              Get Started
              <ExternalLink size={18} />
            </Link>
            <Link
              href="/developers/api-reference"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '14px 28px',
                borderRadius: 12,
                border: '1px solid var(--glass-border)',
                backgroundColor: 'transparent',
                color: 'var(--text-primary)',
                fontSize: 16,
                fontWeight: 600,
                textDecoration: 'none',
              }}
            >
              API Reference
            </Link>
          </motion.div>
        </div>

        {/* Quick Stats */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 16,
            marginBottom: 64,
          }}
        >
          {[
            { label: 'API Endpoints', value: '200+' },
            { label: 'Uptime', value: '99.99%' },
            { label: 'Response Time', value: '<100ms' },
            { label: 'Daily Requests', value: '1M+' },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + i * 0.1 }}
              style={{
                padding: 24,
                borderRadius: 16,
                border: '1px solid var(--glass-border)',
                backgroundColor: 'var(--glass-bg)',
                textAlign: 'center',
              }}
            >
              <div
                style={{
                  fontSize: 32,
                  fontWeight: 700,
                  color: 'var(--brand-orange)',
                  marginBottom: 4,
                }}
              >
                {stat.value}
              </div>
              <div style={{ fontSize: 14, color: 'var(--text-muted, #9A8A7A)' }}>{stat.label}</div>
            </motion.div>
          ))}
        </div>

        {/* Documentation Sections */}
        <h2 style={{ fontSize: 28, fontWeight: 700, marginBottom: 32 }}>Documentation</h2>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: 20,
          }}
        >
          {sections.map((section, i) => (
            <motion.div
              key={section.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 + i * 0.1 }}
            >
              <Link
                href={section.href}
                style={{
                  display: 'block',
                  padding: 24,
                  borderRadius: 16,
                  border: '1px solid var(--glass-border)',
                  backgroundColor: 'var(--glass-bg)',
                  textDecoration: 'none',
                  color: 'inherit',
                  transition: 'all 0.2s ease',
                }}
              >
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 12,
                    backgroundColor: `${section.color}20`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 16,
                  }}
                >
                  <section.icon size={24} color={section.color} />
                </div>
                <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>{section.title}</h3>
                <p style={{ fontSize: 14, color: 'var(--text-muted, #9A8A7A)', lineHeight: 1.5 }}>
                  {section.description}
                </p>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Code Example */}
        <div
          style={{
            marginTop: 64,
            padding: 32,
            borderRadius: 20,
            border: '1px solid var(--glass-border)',
            backgroundColor: 'var(--glass-bg)',
          }}
        >
          <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 16 }}>Quick Example</h2>
          <pre
            style={{
              padding: 20,
              borderRadius: 12,
              backgroundColor: 'rgba(0,0,0,0.3)',
              overflow: 'auto',
              fontSize: 14,
              fontFamily: 'monospace',
              lineHeight: 1.6,
            }}
          >
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
      </main>
      <AppFooter />
    </div>
  );
}
