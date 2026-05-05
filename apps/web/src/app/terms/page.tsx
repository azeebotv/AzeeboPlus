'use client';
import React from 'react';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-white">Terms of Service</h1>
        <div className="space-y-6">
          <section>
            <h2 className="text-2xl font-semibold mb-4 text-gray-200">1. Agreement to Terms</h2>
            <p className="text-gray-400">
              By accessing and using Azeebo+, you agree to be bound by these Terms of Service.
              If you do not agree to these terms, please do not use our service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-gray-200">2. Account Registration</h2>
            <p className="text-gray-400">
              To use certain features of the service, you must register for an account.
              You are responsible for maintaining the confidentiality of your account credentials.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-gray-200">3. User Conduct</h2>
            <p className="text-gray-400">
              You agree not to use the service for any unlawful purpose or in any way that
              could damage, disable, overburden, or impair the service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-gray-200">4. Content</h2>
            <p className="text-gray-400">
              All content provided on Azeebo+ is for informational and entertainment purposes only.
              We reserve the right to remove any content that violates these terms.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-gray-200">5. Payments</h2>
            <p className="text-gray-400">
              Certain features of the service require payment. You agree to pay all fees
              associated with your account in accordance with our pricing and payment terms.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
