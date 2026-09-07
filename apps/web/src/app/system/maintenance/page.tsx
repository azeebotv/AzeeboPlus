'use client';
import AppHeader from '@/components/layout/AppHeader';
import AppFooter from '@/components/layout/AppFooter';

export default function MaintenancePage(): React.JSX.Element {
  return (
    <>
      <AppHeader />
      <main className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
        <div className="max-w-md mx-auto px-4 py-16 text-center">
          <div className="text-6xl mb-6"></div>
          <h1 className="text-2xl font-bold mb-3">Scheduled Maintenance</h1>
          <p className="text-gray-400 mb-4">
            We&apos;re currently performing maintenance to improve your experience.
          </p>
          <p className="text-sm text-gray-500 mb-8">
            We&apos;ll be back shortly. No action needed — your account and data are safe.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="bg-amber-600 hover:bg-amber-700 px-6 py-3 rounded-lg font-semibold transition"
          >
            Check Again
          </button>
        </div>
      </main>
      <AppFooter />
    </>
  );
}
