import React from 'react';
import Link from 'next/link';

export default function AdminWebLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      {/* Platform Gateway Trampoline Banner */}
      <div className="bg-gradient-to-r from-amber-950/80 via-zinc-900 to-amber-950/80 border-b border-amber-500/30 px-6 py-3 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-amber-300">
          <span className="font-semibold uppercase tracking-wider bg-amber-500/20 px-2 py-0.5 rounded">
            Embedded Console
          </span>
          <span>
            You are viewing an embedded administrative view. Production approvals, dual-control execution, and telemetry must be managed in the dedicated Admin Portal.
          </span>
        </div>
        <a
          href="http://localhost:4016"
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/40 font-medium transition-colors"
        >
          Open Dedicated Admin Portal (:4016) →
        </a>
      </div>

      <div className="p-6 max-w-7xl mx-auto">{children}</div>
    </div>
  );
}
