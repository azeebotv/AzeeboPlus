#!/bin/bash
{
  echo "=== captured at ==="
  date -u +"%Y-%m-%dT%H:%M:%SZ"
  echo
  echo "=== biometric callers ==="
  grep -rn "enableBiometrics\|authenticateWithStoredCredentials\|getStoredCredentials" apps/mobile/src apps/mobile/app 2>/dev/null
  echo
  echo "=== certificatePinning.ts (head) ==="
  if [ -f apps/mobile/src/utils/certificatePinning.ts ]; then
    wc -l apps/mobile/src/utils/certificatePinning.ts
    head -n 80 apps/mobile/src/utils/certificatePinning.ts
  else
    echo "MISSING"
  fi
  echo
  echo "=== offlineMode.ts (head) ==="
  if [ -f apps/mobile/src/utils/offlineMode.ts ]; then
    wc -l apps/mobile/src/utils/offlineMode.ts
    head -n 60 apps/mobile/src/utils/offlineMode.ts
  fi
  echo
  echo "=== deepLinking.ts (head) ==="
  if [ -f apps/mobile/src/utils/deepLinking.ts ]; then
    wc -l apps/mobile/src/utils/deepLinking.ts
    head -n 60 apps/mobile/src/utils/deepLinking.ts
  fi
  echo
  echo "=== AuthContext.tsx (mobile) ==="
  if [ -f apps/mobile/src/contexts/AuthContext.tsx ]; then
    wc -l apps/mobile/src/contexts/AuthContext.tsx
    head -n 100 apps/mobile/src/contexts/AuthContext.tsx
  fi
  echo
  echo "=== WalletContext.tsx (mobile) ==="
  if [ -f apps/mobile/src/contexts/WalletContext.tsx ]; then
    wc -l apps/mobile/src/contexts/WalletContext.tsx
    head -n 80 apps/mobile/src/contexts/WalletContext.tsx
  fi
} > audit-evidence/P1/mobile/_biometric-and-utilities.txt 2>&1
echo "wrote $(wc -l < audit-evidence/P1/mobile/_biometric-and-utilities.txt) lines"