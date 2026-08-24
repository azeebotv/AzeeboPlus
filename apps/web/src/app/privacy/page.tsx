'use client';

import Link from 'next/link';

/**
 * Privacy Policy & Data Collection Disclosures (TAA §83)
 *
 * Comprehensive privacy policy covering:
 * - Data collection and usage
 * - User rights (GDPR, CCPA)
 * - Data retention policies
 * - Third-party services
 * - Contact information
 */

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <Link href="/" className="text-blue-600 hover:text-blue-700 text-sm mb-4 inline-block">
            ← Back to Home
          </Link>
          <h1 className="text-4xl font-bold text-foreground mb-4">Privacy Policy</h1>
          <p className="text-muted-foreground">
            Last updated:{' '}
            {new Date().toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        </div>

        <div className="prose prose-lg max-w-none text-foreground">
          {/* Introduction */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">1. Introduction</h2>
            <p className="text-muted-foreground mb-4">
              Virtual Media Network Limited (&quot;Azeebo+&quot;, &quot;we&quot;, &quot;us&quot;, or
              &quot;our&quot;) respects your privacy and is committed to protecting your personal
              data. This privacy policy explains how we collect, use, disclose, and safeguard your
              information when you use our streaming platform and services.
            </p>
            <p className="text-muted-foreground">
              By using Azeebo+, you agree to the collection and use of information in accordance
              with this policy.
            </p>
          </section>

          {/* Data Collection */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">2. Information We Collect</h2>

            <h3 className="text-xl font-semibold mb-3">2.1 Information You Provide</h3>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 mb-4">
              <li>
                <strong>Account Information:</strong> Email address, display name, password
                (encrypted)
              </li>
              <li>
                <strong>Profile Data:</strong> Avatar, bio, interests, preferences
              </li>
              <li>
                <strong>Payment Information:</strong> Payment method details (processed securely by
                our payment partners)
              </li>
              <li>
                <strong>User Content:</strong> Comments, reviews, messages, and other content you
                create
              </li>
              <li>
                <strong>Communications:</strong> Customer support inquiries and feedback
              </li>
            </ul>

            <h3 className="text-xl font-semibold mb-3">2.2 Information Collected Automatically</h3>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 mb-4">
              <li>
                <strong>Usage Data:</strong> Content viewed, watch history, search queries,
                interaction patterns
              </li>
              <li>
                <strong>Device Information:</strong> Device type, operating system, browser type,
                screen resolution
              </li>
              <li>
                <strong>Log Data:</strong> IP address, access times, pages viewed, error logs
              </li>
              <li>
                <strong>Location Data:</strong> Approximate location based on IP address
                (country/region level)
              </li>
              <li>
                <strong>Analytics Data:</strong> App performance, crash reports, feature usage
              </li>
            </ul>

            <h3 className="text-xl font-semibold mb-3">2.3 Information from Third Parties</h3>
            <ul className="list-disc list-inside text-muted-foreground space-y-2">
              <li>
                <strong>Social Login:</strong> Basic profile information from Google/Apple when you
                sign in
              </li>
              <li>
                <strong>Payment Partners:</strong> Transaction confirmations from
                Paystack/Flutterwave
              </li>
              <li>
                <strong>Analytics Partners:</strong> Aggregated usage statistics
              </li>
            </ul>
          </section>

          {/* Data Usage */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">3. How We Use Your Information</h2>
            <ul className="list-disc list-inside text-muted-foreground space-y-2">
              <li>Provide, maintain, and improve our services</li>
              <li>Personalize your experience and content recommendations</li>
              <li>Process transactions and send related information</li>
              <li>Send technical notices, updates, and security alerts</li>
              <li>Respond to comments, questions, and customer service requests</li>
              <li>Monitor and analyze usage patterns and trends</li>
              <li>
                Detect, investigate, and prevent fraudulent transactions and unauthorized access
              </li>
              <li>Comply with legal obligations</li>
            </ul>
          </section>

          {/* Data Sharing */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">4. How We Share Your Information</h2>
            <p className="text-muted-foreground mb-4">
              We do not sell your personal information. We may share your information with:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2">
              <li>
                <strong>Service Providers:</strong> Third parties that help us operate our platform
                (hosting, payment processing, analytics)
              </li>
              <li>
                <strong>Content Creators:</strong> Anonymized analytics about content performance
              </li>
              <li>
                <strong>Legal Requirements:</strong> When required by law or to protect our rights
              </li>
              <li>
                <strong>Business Transfers:</strong> In connection with a merger, acquisition, or
                sale of assets
              </li>
              <li>
                <strong>With Your Consent:</strong> When you explicitly authorize sharing
              </li>
            </ul>
          </section>

          {/* Data Retention */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">5. Data Retention</h2>
            <div className="bg-muted rounded-lg p-6 mb-4">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">Data Type</th>
                    <th className="text-left py-2">Retention Period</th>
                  </tr>
                </thead>
                <tbody className="text-muted-foreground">
                  <tr className="border-b">
                    <td className="py-2">Account data</td>
                    <td className="py-2">Duration of account + 30 days</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2">Watch history</td>
                    <td className="py-2">12 months</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2">Search queries</td>
                    <td className="py-2">30 days (anonymized), 90 days (deleted)</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2">Payment records</td>
                    <td className="py-2">7 years (legal requirement)</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2">Analytics data</td>
                    <td className="py-2">24 months (anonymized)</td>
                  </tr>
                  <tr>
                    <td className="py-2">Support tickets</td>
                    <td className="py-2">24 months</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* User Rights */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">6. Your Rights</h2>
            <p className="text-muted-foreground mb-4">
              Depending on your location, you may have the following rights:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2">
              <li>
                <strong>Access:</strong> Request a copy of your personal data
              </li>
              <li>
                <strong>Rectification:</strong> Request correction of inaccurate data
              </li>
              <li>
                <strong>Erasure:</strong> Request deletion of your personal data
              </li>
              <li>
                <strong>Portability:</strong> Request transfer of your data in a machine-readable
                format
              </li>
              <li>
                <strong>Objection:</strong> Object to processing of your personal data
              </li>
              <li>
                <strong>Restriction:</strong> Request restriction of processing
              </li>
              <li>
                <strong>Withdraw Consent:</strong> Withdraw consent at any time
              </li>
            </ul>
            <p className="text-muted-foreground mt-4">
              To exercise these rights, contact us at{' '}
              <a href="mailto:privacy@azeeboplus.com" className="text-blue-600 hover:text-blue-700">
                privacy@azeeboplus.com
              </a>
            </p>
          </section>

          {/* Security */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">7. Data Security</h2>
            <p className="text-muted-foreground">
              We implement appropriate technical and organizational measures to protect your
              personal data, including:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 mt-4">
              <li>Encryption of data in transit (TLS 1.3) and at rest (AES-256)</li>
              <li>Regular security audits and penetration testing</li>
              <li>Access controls and authentication requirements</li>
              <li>Employee training on data protection</li>
              <li>Incident response procedures</li>
            </ul>
          </section>

          {/* Contact */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">8. Contact Us</h2>
            <p className="text-muted-foreground mb-4">
              If you have any questions about this Privacy Policy, please contact us:
            </p>
            <div className="bg-muted rounded-lg p-6">
              <p className="text-foreground font-medium">Virtual Media Network Limited</p>
              <p className="text-muted-foreground">Email: privacy@azeeboplus.com</p>
              <p className="text-muted-foreground">Support: support@azeeboplus.com</p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
