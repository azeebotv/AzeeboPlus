#!/bin/bash
# Fix remaining hardcoded hex colors in web app components
# More comprehensive replacement with semantic CSS variables

WEB_SRC="/Users/deprof/www/azeebo+/apps/web/src"

find "$WEB_SRC" -name "*.tsx" -o -name "*.ts" | while read file; do
  if echo "$file" | grep -q "node_modules\|.next\|globals.css"; then
    continue
  fi

  modified=false

  # === Inline style replacements ===

  # Background colors
  sed -i '' "s/background: '#0D3B2E'/background: 'var(--brand-forest)'/g" "$file"
  sed -i '' "s/backgroundColor: '#0A0A0A'/backgroundColor: 'var(--bg-primary)'/g" "$file"
  sed -i '' "s/backgroundColor: '#2A1A1A'/backgroundColor: 'var(--bg-secondary)'/g" "$file"

  # Text colors - brand
  sed -i '' "s/color: '#E8420A'/color: 'var(--brand-orange)'/g" "$file"
  sed -i '' "s/color: '#CC1C1C'/color: 'var(--brand-red)'/g" "$file"

  # Text colors - semantic
  sed -i '' "s/color: '#4ADE80'/color: 'var(--color-success-400)'/g" "$file"
  sed -i '' "s/color: '#22c55e'/color: 'var(--color-success-500)'/g" "$file"
  sed -i '' "s/color: '#F59E0B'/color: 'var(--color-warning-500)'/g" "$file"
  sed -i '' "s/color: '#FBBF24'/color: 'var(--color-accent-gold)'/g" "$file"
  sed -i '' "s/color: '#EF4444'/color: 'var(--color-error-500)'/g" "$file"
  sed -i '' "s/color: '#F87171'/color: 'var(--color-error-400)'/g" "$file"
  sed -i '' "s/color: '#60A5FA'/color: 'var(--color-secondary-400)'/g" "$file"
  sed -i '' "s/color: '#0EA5F9'/color: 'var(--color-secondary-400)'/g" "$file"

  # Text colors - muted
  sed -i '' "s/color: '#6B5A4A'/color: 'var(--text-tertiary)'/g" "$file"
  sed -i '' "s/color: '#6A5A4A'/color: 'var(--text-tertiary)'/g" "$file"

  # Background colors - active states
  sed -i '' "s/background: '#E8420A'/background: 'var(--brand-orange)'/g" "$file"

  # Border colors
  sed -i '' "s/border: '1px solid #0EA5F9'/border: '1px solid var(--color-secondary-400)'/g" "$file"

  # === Tailwind class replacements ===

  # bg-[#0D3B2E] → bg-[var(--brand-forest)]
  sed -i '' 's/bg-\[#0D3B2E\]/bg-\[var(--brand-forest)\]/g' "$file"

  # text-[#0EA5F9] → text-[var(--color-secondary-400)]
  sed -i '' 's/text-\[#0EA5F9\]/text-\[var(--color-secondary-400)\]/g' "$file"

done

echo "=== Remaining hex colors (excluding CSS variable definitions) ==="
grep -rn '#[0-9a-fA-F]\{6\}\|#[0-9a-fA-F]\{3\}' "$WEB_SRC" --include="*.tsx" --include="*.ts" 2>/dev/null | grep -v "node_modules\|.next\|globals.css\|--brand-\|--color-\|themeColor\|favicon\|ogImage\|metadata" | wc -l
