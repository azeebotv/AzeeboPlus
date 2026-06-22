'use client';
import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Button, Card, Badge, Avatar } from '@azeebo/ui';
import { colors, gradients } from '@azeebo/design-tokens';
import Link from 'next/link';
import { apiFetch } from '@/lib/api';
import { webLogger } from '@/lib/logger';

const faqData = [
  {
    id: '1',
    question: 'How do I reset my password?',
    answer:
      'Go to Settings > Security > Change Password. If you forgot your password, use the "Forgot Password" option on the login screen.',
  },
  {
    id: '2',
    question: 'How do I cancel my subscription?',
    answer:
      'Go to Wallet > Subscriptions and select the subscription you want to cancel. Follow the on-screen instructions.',
  },
  {
    id: '3',
    question: 'How do I become a creator?',
    answer:
      'Go to Creators > Sign Up and fill out the application form. Our team will review your application within 48 hours.',
  },
  {
    id: '4',
    question: 'How do I report a problem?',
    answer:
      'Use the "Contact Support" form below or email us at support@azeebo.com with details about the issue.',
  },
];

const supportCategories = ['Account', 'Payment', 'Content', 'Technical', 'Creator'];

export default function SupportPage(): JSX.Element {
  const { user, isAuthenticated } = useAuth();
  const [expandedFAQ, setExpandedFAQ] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    subject: '',
    category: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const toggleFAQ = (id: string) => {
    setExpandedFAQ(expandedFAQ === id ? null : id);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormError(null);

    try {
      const result = await apiFetch('/v1/support/tickets', {
        method: 'POST',
        body: JSON.stringify({
          subject: formData.subject,
          category: formData.category,
          message: formData.message,
        }),
      });

      if (result.success) {
        setFormSubmitted(true);
        setFormData({ subject: '', category: '', message: '' });
      } else {
        setFormError(result.message || 'Failed to submit ticket. Please try again.');
      }
    } catch (err) {
      webLogger.error('Failed to submit support ticket', err);
      setFormError('Failed to submit ticket. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: colors.bg.primary }}>
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-black/40 border-b border-gray-700/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div
              className="h-10 w-10 rounded-xl flex items-center justify-center"
              style={{ background: gradients.primary }}
            >
              <span className="text-white font-bold text-xl leading-none">A</span>
            </div>
            <h1
              className="text-2xl font-bold hidden sm:block"
              style={{ color: colors.text.primary }}
            >
              Azeebo+
            </h1>
          </div>

          <nav className="hidden md:flex items-center gap-8">
            {['Home', 'Browse', 'Library', 'Creators', 'Support'].map((item) => (
              <Link
                key={item}
                href={
                  item === 'Home' ? '/' : item === 'Support' ? '/support' : `/${item.toLowerCase()}`
                }
                className="text-base font-medium transition-colors"
                style={{ color: item === 'Support' ? colors.primary[500] : colors.text.secondary }}
              >
                {item}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Avatar size="md" fallback={user?.name?.charAt(0) || 'U'} />
                  <span className="text-sm font-medium" style={{ color: colors.text.primary }}>
                    {user?.name}
                  </span>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/auth/login">
                  <Button variant="ghost" size="sm">
                    Sign In
                  </Button>
                </Link>
                <Link href="/auth/register">
                  <Button variant="primary" size="sm">
                    Get Started
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Support Content */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4" style={{ color: colors.text.primary }}>
            How can we help you?
          </h2>
          <p style={{ color: colors.text.secondary }}>
            Find answers to common questions or contact our support team.
          </p>
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
          {[
            { icon: '📚', label: 'Help Center', description: 'Browse our knowledge base' },
            { icon: '📞', label: 'Contact Us', description: 'Get in touch with support' },
            { icon: '📋', label: 'Submit Ticket', description: 'Report an issue' },
            { icon: '💬', label: 'Live Chat', description: 'Chat with us now' },
          ].map((item, idx) => (
            <Card
              key={idx}
              padding="md"
              className="text-center cursor-pointer hover:shadow-lg transition-shadow"
            >
              <span className="text-4xl mb-3 block">{item.icon}</span>
              <h4 className="font-bold mb-1" style={{ color: colors.text.primary }}>
                {item.label}
              </h4>
              <p className="text-sm" style={{ color: colors.text.secondary }}>
                {item.description}
              </p>
            </Card>
          ))}
        </div>

        {/* FAQ Section */}
        <div className="mb-12">
          <h3 className="text-2xl font-bold mb-6" style={{ color: colors.text.primary }}>
            Frequently Asked Questions
          </h3>
          <div className="space-y-4">
            {faqData.map((faq) => (
              <Card key={faq.id} padding="md" className="cursor-pointer">
                <div
                  onClick={() => toggleFAQ(faq.id)}
                  className="flex items-center justify-between"
                >
                  <h4 className="font-bold" style={{ color: colors.text.primary }}>
                    {faq.question}
                  </h4>
                  <span className="text-2xl" style={{ color: colors.text.secondary }}>
                    {expandedFAQ === faq.id ? '−' : '+'}
                  </span>
                </div>
                {expandedFAQ === faq.id && (
                  <p
                    className="mt-4 pt-4 border-t"
                    style={{ borderColor: colors.border.light, color: colors.text.secondary }}
                  >
                    {faq.answer}
                  </p>
                )}
              </Card>
            ))}
          </div>
        </div>

        {/* Contact Form */}
        <div>
          <h3 className="text-2xl font-bold mb-6" style={{ color: colors.text.primary }}>
            Contact Support
          </h3>
          {formSubmitted ? (
            <Card padding="md" className="text-center py-12">
              <span className="text-6xl mb-4 block">✅</span>
              <h4 className="text-xl font-bold mb-2" style={{ color: colors.text.primary }}>
                Ticket Submitted!
              </h4>
              <p className="mb-6" style={{ color: colors.text.secondary }}>
                We&apos;ll get back to you within 24 hours.
              </p>
              <Button variant="primary" onClick={() => setFormSubmitted(false)}>
                Submit Another Ticket
              </Button>
            </Card>
          ) : (
            <Card padding="md">
              <form onSubmit={handleSubmit}>
                <div className="space-y-6">
                  {formError && (
                    <div
                      className="p-4 rounded-lg"
                      style={{ backgroundColor: 'rgba(239,68,68,0.1)', color: '#EF4444' }}
                    >
                      {formError}
                    </div>
                  )}

                  <div>
                    <label
                      className="block font-medium mb-2"
                      style={{ color: colors.text.primary }}
                    >
                      Subject
                    </label>
                    <input
                      type="text"
                      name="subject"
                      value={formData.subject}
                      onChange={handleInputChange}
                      placeholder="Brief description of your issue"
                      className="w-full px-4 py-3 rounded-lg border-2 focus:outline-none"
                      style={{
                        backgroundColor: colors.bg.secondary,
                        borderColor: colors.border.light,
                        color: colors.text.primary,
                      }}
                      required
                    />
                  </div>

                  <div>
                    <label
                      className="block font-medium mb-2"
                      style={{ color: colors.text.primary }}
                    >
                      Category
                    </label>
                    <select
                      name="category"
                      value={formData.category}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 rounded-lg border-2 focus:outline-none"
                      style={{
                        backgroundColor: colors.bg.secondary,
                        borderColor: colors.border.light,
                        color: colors.text.primary,
                      }}
                      required
                    >
                      <option value="">Select a category</option>
                      {supportCategories.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label
                      className="block font-medium mb-2"
                      style={{ color: colors.text.primary }}
                    >
                      Message
                    </label>
                    <textarea
                      name="message"
                      value={formData.message}
                      onChange={handleInputChange}
                      placeholder="Tell us more about your issue..."
                      rows={6}
                      className="w-full px-4 py-3 rounded-lg border-2 focus:outline-none"
                      style={{
                        backgroundColor: colors.bg.secondary,
                        borderColor: colors.border.light,
                        color: colors.text.primary,
                      }}
                      required
                    />
                  </div>

                  <Button variant="primary" className="w-full" size="lg" disabled={isSubmitting}>
                    {isSubmitting ? 'Submitting...' : 'Submit Ticket'}
                  </Button>
                </div>
              </form>
            </Card>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer
        className="border-t py-12"
        style={{ borderColor: colors.border.light, backgroundColor: colors.bg.secondary }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
            <div>
              <h4 className="font-bold text-lg mb-4" style={{ color: colors.text.primary }}>
                Azeebo+
              </h4>
              <ul className="space-y-2" style={{ color: colors.text.secondary }}>
                {['About', 'Careers', 'Press'].map((item) => (
                  <li
                    key={item}
                    className="text-sm hover:text-gray-200 transition-colors cursor-pointer"
                  >
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-lg mb-4" style={{ color: colors.text.primary }}>
                Help
              </h4>
              <ul className="space-y-2" style={{ color: colors.text.secondary }}>
                {['Support', 'FAQ', 'Contact'].map((item) => (
                  <li
                    key={item}
                    className="text-sm hover:text-gray-200 transition-colors cursor-pointer"
                  >
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-lg mb-4" style={{ color: colors.text.primary }}>
                Legal
              </h4>
              <ul className="space-y-2" style={{ color: colors.text.secondary }}>
                {['Terms', 'Privacy', 'Cookies'].map((item) => (
                  <li
                    key={item}
                    className="text-sm hover:text-gray-200 transition-colors cursor-pointer"
                  >
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-lg mb-4" style={{ color: colors.text.primary }}>
                Connect
              </h4>
              <ul className="space-y-2" style={{ color: colors.text.secondary }}>
                {['Twitter', 'Instagram', 'Facebook'].map((item) => (
                  <li
                    key={item}
                    className="text-sm hover:text-gray-200 transition-colors cursor-pointer"
                  >
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div
            className="mt-12 pt-8 border-t text-center text-sm"
            style={{ borderColor: colors.border.light, color: colors.text.tertiary }}
          >
            <p>© 2026 Azeebo+. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
