'use client';
import React from 'react';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-white">Privacy Policy</h1>
        <div className="space-y-6">
          <section>
            <h2 className="text-2xl font-semibold mb-4 text-gray-200">1. Introduction</h2>
            <p className="text-gray-400">
              Welcome to Azeebo+. We respect your privacy and are committed to protecting your personal data. 
              This privacy policy will inform you about how we look after your personal data when you visit our website.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-gray-200">2. Data We Collect</h2>
            <p className="text-gray-400">
              We may collect, use, store and transfer different kinds of personal data about you:
            </p>
            <ul className="list-disc list-inside mt-4 space-y-2 text-gray-400">
              <li>Identity Data (name, username)</li>
              <li>Contact Data (email address)</li>
              <li>Financial Data (payment card details, transaction history)</li>
              <li>Usage Data (information about how you use our website)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-gray-200">3. How We Use Your Data</h2>
            <p className="text-gray-400">
              We use your personal data to provide and improve our services, process payments, 
              communicate with you, and comply with legal obligations.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-gray-200">4. Data Security</h2>
            <p className="text-gray-400">
              We have put in place appropriate security measures to prevent your personal data 
              from being accidentally lost, used or accessed in an unauthorized way.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
