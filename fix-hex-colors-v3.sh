#!/bin/bash
# Fix remaining hardcoded hex colors in ternary expressions and other patterns

WEB_SRC="/Users/deprof/www/azeebo+/apps/web/src"

find "$WEB_SRC" -name "*.tsx" -o -name "*.ts" | while read file; do
  if echo "$file" | grep -q "node_modules\|.next\|globals.css"; then
    continue
  fi

  modified=false

  # Fix ternary expressions with hex colors
  # Pattern: ? '#E8420A' : '#9A8A7A'
  if grep -q "'#E8420A'" "$file"; then
    sed -i '' "s/'#E8420A'/'var(--brand-orange)'/g" "$file"
    modified=true
  fi

  if grep -q "'#9A8A7A'" "$file"; then
    sed -i '' "s/'#9A8A7A'/'var(--text-secondary)'/g" "$file"
    modified=true
  fi

  if grep -q "'#4ADE80'" "$file"; then
    sed -i '' "s/'#4ADE80'/'var(--color-success-400)'/g" "$file"
    modified=true
  fi

  if grep -q "'#F59E0B'" "$file"; then
    sed -i '' "s/'#F59E0B'/'var(--color-warning-500)'/g" "$file"
    modified=true
  fi

  if grep -q "'#EF4444'" "$file"; then
    sed -i '' "s/'#EF4444'/'var(--color-error-500)'/g" "$file"
    modified=true
  fi

  if grep -q "'#60A5FA'" "$file"; then
    sed -i '' "s/'#60A5FA'/'var(--color-secondary-400)'/g" "$file"
    modified=true
  fi

  if grep -q "'#0EA5F9'" "$file"; then
    sed -i '' "s/'#0EA5F9'/'var(--color-secondary-400)'/g" "$file"
    modified=true
  fi

  if grep -q "'#CC1C1C'" "$file"; then
    sed -i '' "s/'#CC1C1C'/'var(--brand-red)'/g" "$file"
    modified=true
  fi

  if grep -q "'#FBBF24'" "$file"; then
    sed -i '' "s/'#FBBF24'/'var(--color-accent-gold)'/g" "$file"
    modified=true
  fi

  if grep -q "'#F87171'" "$file"; then
    sed -i '' "s/'#F87171'/'var(--color-error-400)'/g" "$file"
    modified=true
  fi

  # Fix rgba colors with hex values
  # rgba(232,66,10,0.2) → rgba(var(--brand-orange-rgb), 0.2) - but this is complex
  # For now, keep rgba as-is since they're used for transparency

  if [ "$modified" = true ]; then
    echo "Fixed: $file"
  fi
done

echo ""
echo "=== Final count of remaining hex colors ==="
grep -rn '#[0-9a-fA-F]\{6\}' "$WEB_SRC" --include="*.tsx" --include="*.ts" 2>/dev/null | grep -v "node_modules\|.next\|globals.css\|--brand-\|--color-\|themeColor\|favicon\|ogImage\|metadata\|rgba(" | wc -l
