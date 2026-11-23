import React from 'react';

export default function AdminWebLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-ink-950 text-ink-100">
      {/* Platform Gateway Trampoline Banner */}
      <div className="bg-gradient-to-r from-az-warning-900/80 via-ink-900 to-az-warning-900/80 border-b border-az-warning-500/30 px-6 py-3 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-az-warning-300">
          <span className="font-semibold uppercase tracking-wider bg-az-warning-500/20 px-2 py-0.5 rounded">
            Embedded Console
          </span>
          <span>
            You are viewing an embedded administrative view. Production approvals, dual-control
            execution, and telemetry must be managed in the dedicated Admin Portal.
          </span>
        </div>
        <a
          href="http://localhost:4016"
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 px-3 py-1.5 rounded-lg bg-az-warning-500/20 hover:bg-az-warning-500/30 text-az-warning-200 border border-az-warning-500/40 font-medium transition-colors"
        >
          Open Dedicated Admin Portal (:4016) →
        </a>
      </div>

      <div className="p-6 max-w-7xl mx-auto">{children}</div>
    </div>
  );
}
