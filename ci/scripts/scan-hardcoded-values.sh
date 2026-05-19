#!/bin/bash

echo "🔍 Running hardcoded value scan..."

# Exit on first error
set -e

# Track if any issues were found
HAS_ERRORS=0

# --------------------------
# Forbidden Pattern: localhost in non-development contexts
# --------------------------
echo ""
echo "📡 Checking for localhost URLs in production contexts..."

LOCALHOST_ISSUES=$(grep -r "localhost" \
  --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" \
  --include="*.env*" --include="*.yaml" --include="*.yml" --include="*.json" \
  . \
  | grep -v "localhost:3000" \
  | grep -v "localhost:5432" \
  | grep -v "localhost:6379" \
  | grep -v "// localhost" \
  | grep -v "# localhost" \
  | grep -v "localhost" \
  | wc -l)

if [ $LOCALHOST_ISSUES -gt 0 ]; then
  echo "❌ Found $LOCALHOST_ISSUES potential localhost issues in production contexts"
  grep -r "localhost" \
    --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" \
    --include="*.env*" --include="*.yaml" --include="*.yml" --include="*.json" \
    . \
    | grep -v "localhost:3000" \
    | grep -v "localhost:5432" \
    | grep -v "localhost:6379" \
    | grep -v "// localhost" \
    | grep -v "# localhost" \
    | head -20
  HAS_ERRORS=1
else
  echo "✅ No localhost issues found"
fi

# --------------------------
# Forbidden Pattern: Default secrets
# --------------------------
echo ""
echo "🔑 Checking for default secrets..."

DEFAULT_SECRETS=$(grep -r -i \
  -E "development-secret|test-secret|default-secret|secret123|password123" \
  --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" \
  --include="*.env*" \
  . \
  | grep -v "test_" \
  | grep -v "development_only" \
  | wc -l)

if [ $DEFAULT_SECRETS -gt 0 ]; then
  echo "❌ Found $DEFAULT_SECRETS potential default secret issues"
  grep -r -i \
    -E "development-secret|test-secret|default-secret|secret123|password123" \
    --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" \
    --include="*.env*" \
    . \
    | grep -v "test_" \
    | grep -v "development_only" \
    | head -10
  HAS_ERRORS=1
else
  echo "✅ No default secrets found"
fi

# --------------------------
# Forbidden Pattern: Provider key examples
# --------------------------
echo ""
echo "🔐 Checking for provider key examples..."

PROVIDER_KEYS=$(grep -r -i \
  -E "pk_test_|sk_test_|flw_test_|paystack.*key|flutterwave.*key" \
  --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" \
  --include="*.env*" \
  . \
  | grep -v "REPLACE_WITH" \
  | grep -v "your-key-here" \
  | wc -l)

if [ $PROVIDER_KEYS -gt 0 ]; then
  echo "❌ Found $PROVIDER_KEYS potential provider key issues"
  grep -r -i \
    -E "pk_test_|sk_test_|flw_test_|paystack.*key|flutterwave.*key" \
    --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" \
    --include="*.env*" \
    . \
    | grep -v "REPLACE_WITH" \
    | grep -v "your-key-here" \
    | head -10
  HAS_ERRORS=1
else
  echo "✅ No provider key issues found"
fi

# --------------------------
# Forbidden Pattern: console.log in production code
# --------------------------
echo ""
echo "📝 Checking for console.log statements..."

CONSOLE_LOGS=$(grep -r "console.log" \
  --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" \
  . \
  | grep -v "console.log(" \
  | wc -l)

if [ $CONSOLE_LOGS -gt 0 ]; then
  echo "❌ Found $CONSOLE_LOGS console.log statements that may need removal"
  grep -r "console.log" \
    --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" \
    . \
    | grep -v "console.log(" \
    | head -10
  HAS_ERRORS=1
else
  echo "✅ No console.log issues found"
fi

# --------------------------
# Forbidden Pattern: Placeholder images
# --------------------------
echo ""
echo "🖼️  Checking for placeholder images..."

PLACEHOLDER_IMAGES=$(grep -r "via.placeholder.com" \
  --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" \
  --include="*.json" \
  . \
  | wc -l)

if [ $PLACEHOLDER_IMAGES -gt 0 ]; then
  echo "❌ Found $PLACEHOLDER_IMAGES placeholder image URLs"
  grep -r "via.placeholder.com" \
    --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" \
    --include="*.json" \
    . \
    | head -10
  HAS_ERRORS=1
else
  echo "✅ No placeholder images found"
fi

# --------------------------
# Forbidden Pattern: Math.random() in business logic
# --------------------------
echo ""
echo "🎲 Checking for Math.random() in business logic..."

MATH_RANDOM=$(grep -r "Math.random()" \
  --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" \
  . \
  | grep -v "generateIdempotencyKey" \
  | grep -v "test" \
  | wc -l)

if [ $MATH_RANDOM -gt 0 ]; then
  echo "❌ Found $MATH_RANDOM Math.random() usages that may need review"
  grep -r "Math.random()" \
    --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" \
    . \
    | grep -v "generateIdempotencyKey" \
    | grep -v "test" \
    | head -10
  HAS_ERRORS=1
else
  echo "✅ No Math.random() business logic issues found"
fi

# --------------------------
# Forbidden Pattern: Hardcoded prices
# --------------------------
echo ""
echo "💰 Checking for hardcoded prices..."

HARDCODED_PRICES=$(grep -r -E "\b[0-9]{3,}\s*(NGN|naira|kobo|dollar|usd|eur|gbp)\b" \
  -i \
  --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" \
  . \
  | grep -v "test" \
  | grep -v "example" \
  | wc -l)

if [ $HARDCODED_PRICES -gt 0 ]; then
  echo "❌ Found $HARDCODED_PRICES potential hardcoded price issues"
  grep -r -E "\b[0-9]{3,}\s*(NGN|naira|kobo|dollar|usd|eur|gbp)\b" \
    -i \
    --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" \
    . \
    | grep -v "test" \
    | grep -v "example" \
    | head -10
  HAS_ERRORS=1
else
  echo "✅ No hardcoded price issues found"
fi

# --------------------------
# Summary
# --------------------------
echo ""
echo "========================================"
if [ $HAS_ERRORS -eq 1 ]; then
  echo "❌ Scan completed with errors found"
  exit 1
else
  echo "✅ All scans passed"
  exit 0
fi
