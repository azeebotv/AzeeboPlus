# DNS & SSL/TLS Setup Guide

## Overview
This document outlines DNS and SSL/TLS certificate management for Azeebo+ production deployment.

---

## Domain Names

| Environment | Domain | Purpose |
|-------------|--------|---------|
| Production | azeebo.com | Main web application |
| Production | www.azeebo.com | Redirect to main domain |
| Production | api.azeebo.com | API Gateway |
| Production | admin.azeebo.com | Admin portal |
| Staging | staging.azeebo.com | Staging web application |
| Staging | staging-api.azeebo.com | Staging API Gateway |

---

## DNS Configuration

### DNS Provider Setup
1. **Create hosted zone** (Route53 or similar) for:
   - azeebo.com
   - *.azeebo.com (wildcard for future use)

### DNS Records

```
# Root domain (redirect to www)
azeebo.com          A/AAAA     <Load Balancer IP>
www.azeebo.com      CNAME      azeebo.com  OR  A/AAAA <LB IP>
api.azeebo.com      A/AAAA     <API Gateway Load Balancer>
admin.azeebo.com    A/AAAA     <Admin Portal Load Balancer>

# Email (if applicable)
azeebo.com          MX         10 ASPMX.L.GOOGLE.COM. (or provider)
azeebo.com          TXT        "v=spf1 include:_spf.google.com ~all"
azeebo.com          TXT        "google-site-verification=..."

# Security
_dmarc.azeebo.com   TXT        "v=DMARC1; p=none; rua=mailto:dmarc@azeebo.com"
```

---

## SSL/TLS Certificates

### Certificate Requirements
| Domain | Certificate Type |
|--------|------------------|
| azeebo.com | Wildcard (*.azeebo.com) OR SAN |
| www.azeebo.com | Included in wildcard/SAN |
| api.azeebo.com | Included in wildcard/SAN |
| admin.azeebo.com | Included in wildcard/SAN |

### Certificate Providers
- Let's Encrypt (free, automated, 90-day validity)
- AWS Certificate Manager (if using AWS)
- DigiCert/GlobalSign (paid, EV option available)

### Certificate Management
- **Automated renewal**: Let's Encrypt + Cert-Manager (Kubernetes)
- **Key rotation**: annually (or more frequently if required)
- **Storage**: Kubernetes Secrets (or HashiCorp Vault)
- **No hardcoded certs anywhere**

---

## Kubernetes Cert-Manager Setup

### 1. Install Cert-Manager
```bash
kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.14.5/cert-manager.yaml
```

### 2. Create Let's Encrypt ClusterIssuer
```yaml
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: letsencrypt-prod
spec:
  acme:
    server: https://acme-v02.api.letsencrypt.org/directory
    email: devops@azeebo.com
    privateKeySecretRef:
      name: letsencrypt-prod
    solvers:
    - dns01:
        route53:
          region: us-east-1
      selector:
        dnsZones:
        - "azeebo.com"
```

### 3. Create Certificate
```yaml
apiVersion: cert-manager.io/v1
kind: Certificate
metadata:
  name: azeebo-tls
  namespace: azeebo
spec:
  secretName: azeebo-tls
  issuerRef:
    name: letsencrypt-prod
    kind: ClusterIssuer
  commonName: "azeebo.com"
  dnsNames:
  - "azeebo.com"
  - "www.azeebo.com"
  - "api.azeebo.com"
  - "admin.azeebo.com"
```

---

## SSL/TLS Best Practices

### TLS Configuration
- **TLS versions**: TLS 1.3 only, or TLS 1.2 + TLS 1.3
- **Ciphersuites**: Modern ciphers only (AES-GCM, ChaCha20-Poly1305)
- **HSTS**: enabled (max-age=31536000; includeSubDomains; preload)
- **Certificate Transparency**: enabled
- **OCSP Stapling**: enabled (if supported)

### Security Headers
```
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Content-Security-Policy: default-src 'self'; ... (strict policy)
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: ...
```

---

## Validation & Monitoring

### SSL Certificate Validation
- [ ] Certificates issued correctly by trusted CA
- [ ] No expired certificates
- [ ] Full chain (root + intermediate) included
- [ ] Subject Alternative Names (SAN) include all domains
- [ ] Certificate visible to Let's Encrypt CT logs
- [ ] SSL Labs Test: A+ rating (https://www.ssllabs.com/ssltest/)

### Monitoring & Alerts
- [ ] Certificate expiration alert (30 days, 14 days, 7 days, 1 day)
- [ ] Certificate rotation monitoring
- [ ] HTTPS enforcement monitoring
- [ ] TLS configuration monitoring
- [ ] HSTS preload verification

---

## Go-Live DNS Cutover

### Pre-Cutover Checklist
- [ ] All production infrastructure ready
- [ ] Smoke tests passed on production (using temporary domain)
- [ ] SSL certificates issued and tested
- [ ] TTL lowered to 60 seconds (24-48 hours before cutover)
- [ ] Stakeholders notified of cutover window
- [ ] Monitoring alerts enabled
- [ ] Rollback plan ready

### Cutover Steps
1. **T-1h**: Final verification
2. **T-0m**: Update DNS records
3. **T+5m**: Verify DNS propagation (check multiple regions/ISPs)
4. **T+15m**: Verify HTTPS works on all domains
5. **T+30m**: Run full smoke tests
6. **T+1h**: Monitor for issues, update TTL to normal (3600s) after 48h

### Rollback
- If issues, revert DNS to previous state
- Wait for TTL expiry
- Verify traffic returns to old infrastructure

---

## Sign-Off
| Role | Name | Signature | Date |
|------|------|-----------|------|
| DevOps Lead | | | |
| Engineering Lead | | | |
| CTO | | | |

