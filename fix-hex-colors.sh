#!/bin/bash
# Fix hardcoded hex colors in web app components
# Replace with CSS variables from the design system

WEB_SRC="/Users/deprof/www/azeebo+/apps/web/src"

# Color mapping (hex → CSS variable):
# #E8420A → var(--brand-orange)
# #CC1C1C → var(--brand-red)
# #1A0A0A → var(--brand-near-black)
# #0D3B2E → var(--brand-forest)
# #F5F0EB → var(--text-primary)
# #9A8A7A → var(--text-secondary)
# #2A1A1A → var(--bg-secondary)
# #140808 → var(--bg-primary) (darker variant)
# #09090F → var(--bg-primary) (keep in metadata only)
# #D03A08 → var(--brand-orange) with hover state
# #FFFFFF → var(--brand-white)
# #fff → var(--brand-white)

# Fix in tailwind className strings (bg-[#xxx], text-[#xxx], etc.)
find "$WEB_SRC" -name "*.tsx" -o -name "*.ts" | while read file; do
  # Skip node_modules and .next
  if echo "$file" | grep -q "node_modules\|.next"; then
    continue
  fi

  modified=false

  # Replace bg-[#1A0A0A] with bg-background (uses CSS var)
  if grep -q 'bg-\[#1A0A0A\]' "$file"; then
    sed -i '' 's/bg-\[#1A0A0A\]/bg-background/g' "$file"
    modified=true
  fi

  # Replace bg-[#E8420A] with bg-primary
  if grep -q 'bg-\[#E8420A\]' "$file"; then
    sed -i '' 's/bg-\[#E8420A\]/bg-primary/g' "$file"
    modified=true
  fi

  # Replace bg-[#D03A08] with hover state
  if grep -q 'hover:bg-\[#D03A08\]' "$file"; then
    sed -i '' 's/hover:bg-\[#D03A08\]/hover:bg-primary\/80/g' "$file"
    modified=true
  fi

  # Replace text-[#F5F0EB] with text-foreground
  if grep -q 'text-\[#F5F0EB\]' "$file"; then
    sed -i '' 's/text-\[#F5F0EB\]/text-foreground/g' "$file"
    modified=true
  fi

  # Replace text-[#9A8A7A] with text-muted-foreground
  if grep -q 'text-\[#9A8A7A\]' "$file"; then
    sed -i '' 's/text-\[#9A8A7A\]/text-muted-foreground/g' "$file"
    modified=true
  fi

  # Replace text-white with text-foreground
  if grep -q 'text-white' "$file" && ! grep -q 'text-white/'; "$file"; then
    sed -i '' 's/text-white/text-foreground/g' "$file"
    modified=true
  fi

  # Replace border-[#2A1A1A] with border-border
  if grep -q 'border-\[#2A1A1A\]' "$file"; then
    sed -i '' 's/border-\[#2A1A1A\]/border-border/g' "$file"
    modified=true
  fi

  if [ "$modified" = true ]; then
    echo "Fixed: $file"
  fi
done

echo ""
echo "=== Fixing inline style hex colors ==="

# Fix inline styles with hex colors
find "$WEB_SRC" -name "*.tsx" | while read file; do
  if echo "$file" | grep -q "node_modules\|.next"; then
    continue
  fi

  modified=false

  # Fix style={{ backgroundColor: '#1A0A0A' }}
  if grep -q "backgroundColor: '#1A0A0A'" "$file"; then
    sed -i '' "s/backgroundColor: '#1A0A0A'/backgroundColor: 'var(--brand-near-black)'/g" "$file"
    modified=true
  fi

  # Fix style={{ backgroundColor: '#E8420A' }}
  if grep -q "backgroundColor: '#E8420A'" "$file"; then
    sed -i '' "s/backgroundColor: '#E8420A'/backgroundColor: 'var(--brand-orange)'/g" "$file"
    modified=true
  fi

  # Fix style={{ color: '#F5F0EB' }}
  if grep -q "color: '#F5F0EB'" "$file"; then
    sed -i '' "s/color: '#F5F0EB'/color: 'var(--text-primary)'/g" "$file"
    modified=true
  fi

  # Fix style={{ color: '#9A8A7A' }}
  if grep -q "color: '#9A8A7A'" "$file"; then
    sed -i '' "s/color: '#9A8A7A'/color: 'var(--text-secondary)'/g" "$file"
    modified=true
  fi

  # Fix style={{ border: '1px solid #2A1A1A' }}
  if grep -q "border: '1px solid #2A1A1A'" "$file"; then
    sed -i '' "s/border: '1px solid #2A1A1A'/border: '1px solid var(--border-default)'/g" "$file"
    modified=true
  fi

  # Fix style={{ background: '#140808' }}
  if grep -q "background: '#140808'" "$file"; then
    sed -i '' "s/background: '#140808'/background: 'var(--bg-tertiary)'/g" "$file"
    modified=true
  fi

  # Fix style={{ color: '#fff' }} or style={{ color: '#ffffff' }}
  if grep -q "color: '#fff'" "$file"; then
    sed -i '' "s/color: '#fff'/color: 'var(--brand-white)'/g" "$file"
    modified=true
  fi

  # Fix linear-gradient with hardcoded colors
  if grep -q "linear-gradient(135deg, #E8420A 0%, #CC1C1C 100%)" "$file"; then
    sed -i '' "s/linear-gradient(135deg, #E8420A 0%, #CC1C1C 100%)/linear-gradient(135deg, var(--brand-orange) 0%, var(--brand-red) 100%)/g" "$file"
    modified=true
  fi

  # Fix border with hardcoded colors
  if grep -q "border: '1px solid #CC1C1C'" "$file"; then
    sed -i '' "s/border: '1px solid #CC1C1C'/border: '1px solid var(--brand-red)'/g" "$file"
    modified=true
  fi

  if [ "$modified" = true ]; then
    echo "Fixed styles: $file"
  fi
done

echo ""
echo "=== Summary ==="
echo "Remaining hardcoded hex colors:"
grep -rn '#[0-9a-fA-F]\{6\}\|#[0-9a-fA-F]\{3\}' "$WEB_SRC" --include="*.tsx" --include="*.ts" 2>/dev/null | grep -v "node_modules\|.next\|globals.css\|--brand-\|--color-" | wc -l
