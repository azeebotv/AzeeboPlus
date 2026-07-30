#!/bin/bash
# Final pass to fix remaining hardcoded hex colors

WEB_SRC="/Users/deprof/www/azeebo+/apps/web/src"

find "$WEB_SRC" -name "*.tsx" -o -name "*.ts" | while read file; do
  if echo "$file" | grep -q "node_modules\|.next\|globals.css"; then
    continue
  fi

  modified=false

  # Fix remaining colors (both cases)
  # Success colors
  sed -i '' "s/'#22C55E'/'var(--color-success-500)'/g" "$file"
  sed -i '' "s/'#22c55e'/'var(--color-success-500)'/g" "$file"
  sed -i '' "s/'#4ADE80'/'var(--color-success-400)'/g" "$file"
  sed -i '' "s/'#84cc16'/'var(--color-success-400)'/g" "$file"

  # Warning colors
  sed -i '' "s/'#EAB308'/'var(--color-warning-400)'/g" "$file"
  sed -i '' "s/'#F59E0B'/'var(--color-warning-500)'/g" "$file"
  sed -i '' "s/'#f59e0b'/'var(--color-warning-500)'/g" "$file"

  # Error colors
  sed -i '' "s/'#EF4444'/'var(--color-error-500)'/g" "$file"
  sed -i '' "s/'#ef4444'/'var(--color-error-500)'/g" "$file"
  sed -i '' "s/'#F87171'/'var(--color-error-400)'/g" "$file"

  # Brand colors
  sed -i '' "s/'#E8420A'/'var(--brand-orange)'/g" "$file"
  sed -i '' "s/'#CC1C1C'/'var(--brand-red)'/g" "$file"
  sed -i '' "s/'#0D3B2E'/'var(--brand-forest)'/g" "$file"

  # Background colors
  sed -i '' "s/'#2A1A1A'/'var(--bg-secondary)'/g" "$file"
  sed -i '' "s/'#140808'/'var(--bg-tertiary)'/g" "$file"
  sed -i '' "s/'#0A0A0A'/'var(--bg-primary)'/g" "$file"

  # Text colors
  sed -i '' "s/'#9A8A7A'/'var(--text-secondary)'/g" "$file"
  sed -i '' "s/'#D4C8B8'/'var(--text-secondary)'/g" "$file"
  sed -i '' "s/'#6B5B4B'/'var(--text-tertiary)'/g" "$file"
  sed -i '' "s/'#6B5A4A'/'var(--text-tertiary)'/g" "$file"
  sed -i '' "s/'#6A5A4A'/'var(--text-tertiary)'/g" "$file"

  # Secondary colors
  sed -i '' "s/'#60A5FA'/'var(--color-secondary-400)'/g" "$file"
  sed -i '' "s/'#0EA5F9'/'var(--color-secondary-400)'/g" "$file"

  # Gold accent
  sed -i '' "s/'#FBBF24'/'var(--color-accent-gold)'/g" "$file"

done

echo "=== Final count of remaining hex colors ==="
grep -rn "'#[0-9a-fA-F]\{6\}'" "$WEB_SRC" --include="*.tsx" --include="*.ts" 2>/dev/null | grep -v "node_modules\|.next\|globals.css\|var(" | wc -l
