#!/bin/bash
# Fix all error.tsx files in apps/web/src/app
# 1. Add aria-label="Try again" to buttons missing it
# 2. Replace hardcoded colors with theme tokens

WEB_APP="/Users/deprof/www/azeebo+/apps/web/src/app"

# Fix Pattern 1: buttons missing aria-label (theme-compliant files)
# Match: <button onClick={reset} className="...">Try again</button>
# Add aria-label="Try again" after className
find "$WEB_APP" -name "error.tsx" -exec grep -l 'className="px-4 py-2 bg-primary text-primary-foreground' {} \; | while read file; do
  if ! grep -q 'aria-label="Try again"' "$file"; then
    sed -i '' 's/className="px-4 py-2 bg-primary text-primary-foreground rounded-md"/className="px-4 py-2 bg-primary text-primary-foreground rounded-md" aria-label="Try again"/' "$file"
    echo "Fixed aria-label in: $file"
  fi
done

# Fix Pattern 2: hardcoded colors - replace gray-400 with muted-foreground
find "$WEB_APP" -name "error.tsx" -exec grep -l 'text-gray-400' {} \; | while read file; do
  sed -i '' 's/text-gray-400/text-muted-foreground/g' "$file"
  echo "Fixed gray-400 in: $file"
done

# Fix Pattern 2: hardcoded colors - replace orange-500 with primary
find "$WEB_APP" -name "error.tsx" -exec grep -l 'bg-orange-500' {} \; | while read file; do
  sed -i '' 's/bg-orange-500/bg-primary/g' "$file"
  echo "Fixed orange-500 in: $file"
done

# Fix Pattern 2: hardcoded colors - replace text-white with text-primary-foreground
find "$WEB_APP" -name "error.tsx" -exec grep -l 'text-white' {} \; | while read file; do
  # Only fix in error.tsx files that have the orange pattern
  if grep -q 'bg-primary text-white' "$file"; then
    sed -i '' 's/bg-primary text-white/bg-primary text-primary-foreground/g' "$file"
    echo "Fixed text-white in: $file"
  fi
done

# Fix Pattern 2: hardcoded colors - replace hover:bg-orange-600 with hover:bg-primary/80
find "$WEB_APP" -name "error.tsx" -exec grep -l 'hover:bg-orange-600' {} \; | while read file; do
  sed -i '' 's/hover:bg-orange-600/hover:bg-primary\/80/g' "$file"
  echo "Fixed hover orange in: $file"
done

# Fix Pattern 2: add aria-label to buttons that still don't have it
find "$WEB_APP" -name "error.tsx" -exec grep -l 'className="px-4 py-2 bg-primary text-primary-foreground rounded-lg' {} \; | while read file; do
  if ! grep -q 'aria-label="Try again"' "$file"; then
    sed -i '' 's/className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary\/80"/className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary\/80" aria-label="Try again"/' "$file"
    echo "Fixed aria-label (rounded-lg) in: $file"
  fi
done

echo ""
echo "=== Summary ==="
echo "Files with aria-label after fix:"
find "$WEB_APP" -name "error.tsx" -exec grep -l 'aria-label' {} \; | wc -l
echo "Files still missing aria-label:"
find "$WEB_APP" -name "error.tsx" -exec grep -L 'aria-label' {} \; | wc -l
echo "Files with hardcoded colors after fix:"
find "$WEB_APP" -name "error.tsx" -exec grep -l 'text-gray-\|bg-orange-\|text-white\|hover:bg-orange' {} \; | wc -l
