#!/bin/bash
# Add error.tsx and loading.tsx to all page directories missing them
set -euo pipefail
cd "$(dirname "$0")/.."

ERROR_COUNT=0
LOADING_COUNT=0

# Generic error.tsx template
ERROR_TSX="'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className=\"flex min-h-[400px] flex-col items-center justify-center p-8 text-center\">
      <h2 className=\"mb-2 text-xl font-semibold text-[var(--brand-near-black)] dark:text-white\">
        Something went wrong
      </h2>
      <p className=\"mb-4 text-sm text-[var(--brand-mid-brown)]\">
        {error.message || 'An unexpected error occurred'}
      </p>
      <button
        onClick={reset}
        className=\"rounded-lg bg-[var(--brand-orange)] px-4 py-2 text-sm font-medium text-white hover:opacity-90\"
      >
        Try again
      </button>
    </div>
  );
}
'

# Generic loading.tsx template
LOADING_TSX="export default function Loading() {
  return (
    <div className=\"flex min-h-[400px] items-center justify-center\">
      <div className=\"h-8 w-8 animate-spin rounded-full border-4 border-[var(--brand-orange)] border-t-transparent\" />
    </div>
  );
}
"

while IFS= read -r page; do
  dir=$(dirname "$page")
  
  # Add error.tsx if missing
  if [ ! -f "$dir/error.tsx" ] && [ ! -f "$dir/error.js" ]; then
    echo "$ERROR_TSX" > "$dir/error.tsx"
    echo "  + error.tsx: $dir"
    ERROR_COUNT=$((ERROR_COUNT + 1))
  fi
  
  # Add loading.tsx if missing
  if [ ! -f "$dir/loading.tsx" ] && [ ! -f "$dir/loading.js" ]; then
    echo "$LOADING_TSX" > "$dir/loading.tsx"
    echo "  + loading.tsx: $dir"
    LOADING_COUNT=$((LOADING_COUNT + 1))
  fi
done < <(find apps/web/src/app -name "page.tsx" 2>/dev/null)

echo ""
echo "Added $ERROR_COUNT error.tsx files"
echo "Added $LOADING_COUNT loading.tsx files"
