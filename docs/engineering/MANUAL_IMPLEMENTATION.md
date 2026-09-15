# Manual Implementation Guide

## Overview

This document contains detailed instructions for the 43 remaining infrastructure, CI/CD, security process, and verification items that cannot be automated through code changes alone.

---

## 1. mTLS Between Services (HIGH-05)

### AWS Certificate Manager + Service Mesh

```bash
# 1. Create private CA in ACM
aws acm-pca create-certificate-authority \
  --certificate-authority-type ROOT \
  --subject '{"CommonName":"azeebo-internal-ca","Organization":"Azeebo"}'

# 2. Issue certificates for each service
for svc in auth-service content-service media-service payment-service wallet-service; do
  aws acm-pca issue-certificate \
    --certificate-authority-arn $CA_ARN \
    --csr file://$svc.csr \
    --template-arn arn:aws:acm-pca:::template/EndEntityCertificate/V1 \
    --validity '{"Value":365,"Type":"YEARS"}'
done

# 3. Configure App Mesh or ECS service connect for mTLS
aws appmesh create-mesh --mesh-name azeebo-mesh
aws appmesh create-virtual-node \
  --mesh-name azeebo-mesh \
  --virtual-node-name auth-service \
  --spec file://auth-vnode-spec.json
```

### Alternative: AWS ECS Service Connect

```json
{
  "ServiceConnect": {
    "enabled": true,
    "Namespace": "azeebo.local",
    "Services": [{
      "PortName": "http",
      "DiscoveryName": "auth-service",
      "TLS": { "Enabled": true }
    }]
  }
}
```

---

## 2. SBOM Generation (TAA §84)

### GitHub Actions Workflow

```yaml
# .github/workflows/sbom.yml
name: SBOM Generation
on:
  release:
    types: [published]

jobs:
  sbom:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Generate SBOM with Syft
        uses: anchore/sbom-action@v0
        with:
          image: ${{ github.repository }}:${{ github.event.release.tag_name }}
          format: spdx-json
          output-file: sbom.spdx.json
      
      - name: Upload SBOM to release
        uses: softprops/action-gh-release@v1
        with:
          files: sbom.spdx.json
```

### Local SBOM Generation

```bash
# Install syft
curl -sSfL https://raw.githubusercontent.com/anchore/syft/main/install.sh | sh

# Generate SBOM for Docker image
syft azeebo-plus:latest -o spdx-json > sbom.spdx.json

# Generate SBOM for source code
syft dir:. -o spdx-json > source-sbom.spdx.json
```

---

## 3. Artefact Signing (TAA §84)

### AWS Signer Setup

```bash
# 1. Create signing profile
aws signer put-signing-profile \
  --profile-name azeebo-signing \
  --platform-id "AWSLambda-SHA384-ECDSA" \
  --signature-validity '{"type":"YEARS","value":1}'

# 2. Sign container images
# In CI/CD pipeline:
aws signer sign-payload \
  --profile-name azeebo-signing \
  --payload-format-type RAW \
  --payload fileb://image-digest.txt \
  --payload-type DockerImageDigest

# 3. Verify signatures
aws signer describe-signing-job --job-id $JOB_ID
```

### Cosign (Alternative)

```bash
# Install cosign
go install github.com/sigstore/cosign/v2/cmd/cosign@latest

# Generate key pair
cosign generate-key-pair

# Sign container
cosign sign --key cosign.key azeebo-plus:latest

# Verify
cosign verify --key cosign.pub azeebo-plus:latest
```

---

## 4. Build Provenance (TAA §84)

### SLSA Provenance Generation

```yaml
# .github/workflows/provenance.yml
name: SLSA Provenance
on:
  push:
    branches: [main]

jobs:
  provenance:
    permissions:
      id-token: write
      contents: read
    uses: slsa-framework/slsa-github-generator/.github/workflows/generator_container_slsa3.yml@v1.9.0
    with:
      image: ${{ github.repository }}
      registry-username: ${{ github.actor }}
    secrets:
      registry-password: ${{ secrets.GITHUB_TOKEN }}
```

### In-Toto Attestation

```bash
# Generate build provenance
in-toto-run \
  --name build \
  --material . \
  --product dist/ \
  -- npm run build

# Sign the attestation
in-toto-sign \
  --functionary-key build-key.pem \
  --metadata-file build.layout
```

---

## 5. Protected Main/Release Branches (TAA §84)

### GitHub Branch Protection Rules

```bash
# Using GitHub CLI
gh api repos/{owner}/{repo}/branches/main/protection \
  --method PUT \
  --field required_status_checks='{"strict":true,"contexts":["ci/test","ci/lint","ci/build"]}' \
  --field enforce_admins=true \
  --field required_pull_request_reviews='{"required_approving_review_count":2,"dismiss_stale_reviews":true,"require_code_owner_reviews":true}' \
  --field restrictions=null

# For release branch
gh api repos/{owner}/{repo}/branches/release/protection \
  --method PUT \
  --field required_status_checks='{"strict":true,"contexts":["ci/test","ci/build","security/scan"]}' \
  --field required_pull_request_reviews='{"required_approving_review_count":2}'
```

### Manual GitHub UI Steps

1. Go to **Settings → Branches**
2. Click **Add rule**
3. Branch name pattern: `main`
4. Enable:
   - ✅ Require pull request reviews before merging (2 approvals)
   - ✅ Require status checks before merging
   - ✅ Require branches to be up to date
   - ✅ Require conversation resolution
   - ✅ Require linear history
   - ✅ Include administrators
5. Repeat for `release` branch

---

## 6. Required Status Checks (TAA §84)

### Configure Status Checks

```bash
# List available checks
gh api repos/{owner}/{repo}/commits/main/check-runs

# Add required checks via branch protection (see above)
# Required checks:
# - ci/test
# - ci/lint  
# - ci/build
# - security/sast
# - security/dependencies
```

---

## 7. Short-lived OIDC/Workload Identity (TAA §84)

### GitHub OIDC with AWS

```yaml
# .github/workflows/deploy.yml
permissions:
  id-token: write
  contents: read

steps:
  - name: Configure AWS Credentials
    uses: aws-actions/configure-aws-credentials@v4
    with:
      role-to-assume: arn:aws:iam::123456789012:role/github-actions-deploy
      aws-region: us-east-1
```

### AWS IAM OIDC Provider

```bash
# Create OIDC provider
aws iam create-open-id-connect-provider \
  --url https://token.actions.githubusercontent.com \
  --thumbprint-list 6938fd4d98bab03faadb97b34396831e3780aea1 \
  --client-id-list sts.amazonaws.com

# Create IAM role for GitHub Actions
cat > trust-policy.json << 'EOF'
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Principal": { "Federated": "arn:aws:iam::ACCOUNT:oidc-provider/token.actions.githubusercontent.com" },
    "Action": "sts:AssumeRoleWithWebIdentity",
    "Condition": {
      "StringEquals": { "token.actions.githubusercontent.com:aud": "sts.amazonaws.com" },
      "StringLike": { "token.actions.githubusercontent.com:sub": "repo:azeebotv/AzeeboPlus:*" }
    }
  }]
}
EOF

aws iam create-role --role-name github-actions-deploy --assume-role-policy-document file://trust-policy.json
```

---

## 8. Critical Vuln Blocks Release (TAA §84)

### Security Gate in CI/CD

```yaml
# .github/workflows/security-gate.yml
name: Security Gate
on:
  pull_request:
    branches: [main, release]

jobs:
  trivy-scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Run Trivy vulnerability scanner
        uses: aquasecurity/trivy-action@master
        with:
          image-ref: ${{ github.repository }}:${{ github.sha }}
          format: 'json'
          output: 'trivy-results.json'
          severity: 'CRITICAL,HIGH'
      
      - name: Check for critical vulnerabilities
        run: |
          CRITICAL=$(cat trivy-results.json | jq '[.Results[]?.Vulnerabilities[]? | select(.Severity == "CRITICAL")] | length')
          if [ "$CRITICAL" -gt 0 ]; then
            echo "::error::Critical vulnerabilities found! Blocking release."
            cat trivy-results.json | jq '.Results[]?.Vulnerabilities[]? | select(.Severity == "CRITICAL") | {PkgName, VulnerabilityID, Title}'
            exit 1
          fi
```

---

## 9. Third-party SDK Security/Privacy Review (TAA §84)

### Review Process Checklist

```markdown
## SDK Security Review Template

### SDK Information
- Name:
- Version:
- License:
- Repository URL:
- Maintainer:

### Security Assessment
- [ ] No known CVEs in current version
- [ ] Active maintenance (last release < 6 months)
- [ ] Security policy documented
- [ ] No telemetry/analytics by default
- [ ] No excessive permissions required

### Privacy Assessment
- [ ] No PII collection
- [ ] No data sent to third parties
- [ ] Data processing location documented
- [ ] GDPR/CCPA compliant

### Code Assessment
- [ ] Bundle size acceptable
- [ ] No native code (or audited)
- [ ] Dependencies audited

### Approval
- Approved by:
- Date:
- Next review:
```

---

## 10. System-level Threat Model (TAA §85)

### STRIDE Analysis Template

```markdown
## Threat Model: [System Name]

### System Boundaries
- Trust boundaries:
- Data flows:
- External dependencies:

### STRIDE Analysis

| Component | Spoofing | Tampering | Repudiation | Info Disclosure | DoS | Elevation |
|-----------|----------|-----------|-------------|-----------------|-----|-----------|
| Auth Service | Medium | Low | Low | High | Medium | High |
| Content API | Low | Medium | Low | Medium | Medium | Medium |
| Payment | High | High | Medium | High | Low | High |
| Media CDN | Low | Low | Low | Medium | High | Low |

### Mitigations
1. [Threat] → [Mitigation] → [Control]
2. ...

### Review Schedule
- Initial: Before M2 launch
- Revisions: On material changes
```

---

## 11. Per-domain Asset/Actor/Trust-boundary Documentation (TAA §85)

### Domain Documentation Template

```markdown
## Domain: [Name]

### Assets
| Asset | Classification | Location | Retention |
|-------|---------------|----------|-----------|
| User PII | Confidential | PostgreSQL | Account lifetime |
| Content | Internal | S3 | Permanent |
| Analytics | Internal | ClickHouse | 30 days |

### Actors
| Actor | Type | Trust Level | Authentication |
|-------|------|-------------|----------------|
| End User | Human | Low | Session + MFA |
| Admin | Human | High | Session + Hardware Key |
| Service | Machine | Medium | mTLS |

### Trust Boundaries
| Boundary | Controls | Monitoring |
|----------|----------|------------|
| Client → API | TLS, Rate Limit, WAF | Access logs |
| API → Service | mTLS, JWT | Audit trail |
| Service → DB | IAM, VPC | Query logs |
```

---

## 12. Abuse Case Documentation (TAA §85)

### Abuse Case Template

```markdown
## Abuse Case: [Name]

### Description
[What is the abuse scenario?]

### Attacker Profile
- Motivation:
- Capability:
- Resources:

### Attack Vector
1. Step 1
2. Step 2
3. Step 3

### Impact
- Confidentiality:
- Integrity:
- Availability:
- Financial:
- Reputation:

### Current Controls
- [ ] [Control 1]
- [ ] [Control 2]

### Recommended Mitigations
1. [Mitigation]
2. [Mitigation]

### Testing
- [ ] Penetration test scenario
- [ ] Automated test case
```

---

## 13. Threat Model Review on Material Changes (TAA §85)

### Review Trigger Criteria

```yaml
# .github/workflows/threat-model-review.yml
name: Threat Model Review
on:
  pull_request:
    paths:
      - 'services/*/src/**'
      - 'packages/security/**'
      - 'packages/auth/**'
      - 'infrastructure/**'

jobs:
  check-threat-model:
    runs-on: ubuntu-latest
    steps:
      - name: Check for threat model update
        run: |
          if git diff --name-only HEAD~1 | grep -qE "^security/|^threat-model/"; then
            echo "Threat model updated ✓"
          else
            echo "::warning::Material changes detected without threat model update"
          fi
```

### Review Checklist

- [ ] New external dependencies added
- [ ] Authentication/authorization changes
- [ ] Data storage modifications
- [ ] API endpoint changes
- [ ] Infrastructure changes
- [ ] Third-party integrations

---

## 14. Penetration Test Findings Mapped to Controls (TAA §85)

### Findings Template

```markdown
## Penetration Test Report

### Test Date: [Date]
### Tester: [Name/Org]
### Scope: [Systems tested]

### Findings

| ID | Severity | Title | CVSS | Status | Control |
|----|----------|-------|------|--------|---------|
| PT-001 | Critical | SQL Injection | 9.8 | Fixed | WAF-001, Input Validation |
| PT-002 | High | XSS | 8.5 | Fixed | CSP, Output Encoding |
| PT-003 | Medium | CSRF | 6.5 | Fixed | CSRF Token |

### Remediation Verification
- [ ] PT-001: Retest passed
- [ ] PT-002: Retest passed
- [ ] PT-003: Retest passed
```

---

## 15. Load Testing Baselines (TAA §58)

### k6 Load Test Scripts

```javascript
// tests/load/auth-service.js
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '2m', target: 100 },   // Ramp up
    { duration: '5m', target: 100 },   // Steady state
    { duration: '2m', target: 200 },   // Peak
    { duration: '5m', target: 200 },   // Sustained peak
    { duration: '2m', target: 0 },     // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'],
    http_req_failed: ['rate<0.01'],
  },
};

export default function () {
  const res = http.post(`${__ENV.API_URL}/auth/login`, JSON.stringify({
    email: `user${Math.floor(Math.random() * 250000)}@test.com`,
    password: 'testpass123',
  }), { headers: { 'Content-Type': 'application/json' } });
  
  check(res, {
    'status is 200': (r) => r.status === 200,
    'response time < 500ms': (r) => r.timings.duration < 500,
  });
  
  sleep(1);
}
```

### Baseline Metrics to Capture

| Metric | Target | Current |
|--------|--------|---------|
| Auth login p95 | <500ms | _Test needed_ |
| Content API p95 | <300ms | _Test needed_ |
| Media upload p95 | <5s | _Test needed_ |
| Search p95 | <200ms | _Test needed_ |
| Concurrent video sessions | 10,000 | _Test needed_ |
| Transactions/minute | 300 | _Test needed_ |

---

## 16. Mobile Verification Checklist

### React Native New Architecture

```bash
# Check in app/build.gradle
cat android/app/build.gradle | grep -i "newArchEnabled"
# Should be: newArchEnabled = true

# Check in ios/Podfile
cat ios/Podfile | grep -i "fabric"
# Should have: :fabric_enabled => true
```

### TLS Pinning Verification

```bash
# Android: Check network_security_config.xml
cat android/app/src/main/res/xml/network_security_config.xml

# iOS: Check Info.plist
cat ios/AzeeboMobile/Info.plist | grep -A5 "NSAppTransportSecurity"
```

### Push Notification Setup

```bash
# iOS: Check entitlements
cat ios/AzeeboMobile/AzeeboMobile.entitlements

# Android: Verify google-services.json exists
ls android/app/google-services.json
```

### App Store Compliance

```bash
# iOS: Check privacy manifest
cat ios/PrivacyInfo.xcprivacy

# Android: Check data safety form in Google Play Console
```

---

## 17. GitHub OIDC Setup

### Complete OIDC Configuration

```bash
# 1. Create IAM OIDC provider
aws iam create-open-id-connect-provider \
  --url https://token.actions.githubusercontent.com \
  --thumbprint-list 6938fd4d98bab03faadb97b34396831e3780aea1 \
  --client-id-list sts.amazonaws.com

# 2. Create deployment role
cat > deploy-role-trust.json << 'EOF'
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Principal": {
      "Federated": "arn:aws:iam::ACCOUNT:oidc-provider/token.actions.githubusercontent.com"
    },
    "Action": "sts:AssumeRoleWithWebIdentity",
    "Condition": {
      "StringEquals": {
        "token.actions.githubusercontent.com:aud": "sts.amazonaws.com"
      },
      "StringLike": {
        "token.actions.githubusercontent.com:sub": "repo:azeebotv/AzeeboPlus:ref:refs/heads/main"
      }
    }
  }]
}
EOF

aws iam create-role \
  --role-name github-actions-deploy \
  --assume-role-policy-document file://deploy-role-trust.json

# 3. Attach policies
aws iam attach-role-policy \
  --role-name github-actions-deploy \
  --policy-arn arn:aws:iam::policy/ECSDeployPolicy
```

---

## 18. Container Signing Setup

### ECR Image Signing

```bash
# 1. Enable image signing in ECR
aws ecr put-image-tag-mutability \
  --repository-name azeebo-plus \
  --image-tag-mutability IMMUTABLE

# 2. Set up scanning
aws ecr put-image-scanning-configuration \
  --repository-name azeebo-plus \
  --image-scanning-configuration scanOnPush=true

# 3. Sign with cosign in CI
cosign sign --key env://COSIGN_KEY $ECR_REGISTRY/azeebo-plus:$TAG
```

---

## 19. Incident Response Playbook

### Severity Levels

| Level | Response Time | Escalation | Examples |
|-------|--------------|------------|----------|
| SEV1 | 15 min | Immediate | Data breach, complete outage |
| SEV2 | 30 min | 30 min | Partial outage, security incident |
| SEV3 | 2 hours | 4 hours | Degraded performance, non-critical bug |
| SEV4 | 24 hours | Next business | Minor issues, cosmetic bugs |

### Communication Template

```markdown
## Incident: [Title]

**Status:** Investigating / Identified / Monitoring / Resolved
**Severity:** SEV[1-4]
**Duration:** [Start time] - [End time]
**Impact:** [User impact description]

### Timeline
- [Time] Issue detected via [monitoring/alert]
- [Time] Investigation started
- [Time] Root cause identified
- [Time] Mitigation deployed
- [Time] Resolution confirmed

### Root Cause
[Description]

### Resolution
[What was done]

### Follow-up Items
- [ ] [Action item 1]
- [ ] [Action item 2]
```

---

## 20. On-Call Rotation Setup

### PagerDuty Configuration

```yaml
# pagerduty-config.yml
schedules:
  primary:
    name: "Azeebo Primary On-Call"
    rotation:
      type: weekly
      users:
        - user1@azeebo.com
        - user2@azeebo.com
        - user3@azeebo.com

escalation_policies:
  default:
    name: "Default Escalation"
    rules:
      - escalation_timeout: 300  # 5 minutes
        targets:
          - type: schedule
            id: primary
      - escalation_timeout: 600  # 10 minutes
        targets:
          - type: user
            id: manager@azeebo.com
```

---

## 21. Capacity Planning Baselines

### AWS Cost Explorer Setup

```bash
# Enable cost allocation tags
aws ce update-cost-allocation-tags \
  --cost-allocation-tags Status=Active Key=Service

# Create budget alerts
aws budgets create-budget \
  --account-id $(aws sts get-caller-identity --query Account --output text) \
  --budget '{
    "BudgetName": "Azeebo Monthly",
    "BudgetLimit": { "Amount": "10000", "Unit": "USD" },
    "TimeUnit": "MONTHLY",
    "BudgetType": "COST"
  }' \
  --notifications-with-subscribers '[{
    "Notification": { "NotificationType": "ACTUAL", "ComparisonOperator": "GREATER_THAN", "Threshold": 80 },
    "Subscribers": [{ "SubscriptionType": "EMAIL", "Address": "finance@azeebo.com" }]
  }]'
```

---

## Summary

| Category | Items | Can Automate | Manual Required |
|----------|-------|--------------|-----------------|
| mTLS | 1 | 0 | 1 |
| SBOM/Signing | 5 | 2 | 3 |
| Branch Protection | 3 | 1 | 2 |
| Threat Modeling | 5 | 1 | 4 |
| Load Testing | 9 | 0 | 9 |
| Mobile Verification | 20 | 0 | 20 |
| **Total** | **43** | **4** | **39** |
