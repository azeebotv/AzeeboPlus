# Manual Implementation Guide — Infrastructure Items

> 20 items requiring manual AWS/GitHub/vendor setup.
> Each section includes: what to do, why, step-by-step commands, verification, and cost estimate.

---

## Table of Contents

1. [S-013: Penetration Testing](#s-013)
2. [S-014: Bug Bounty Program](#s-014)
3. [API-009: API Playground](#api-009)
4. [DB-008: Read Replicas](#db-008)
5. [ARCH-003: Service Mesh](#arch-003)
6. [ARCH-005: Service Discovery](#arch-005)
7. [ARCH-006: Chaos Engineering](#arch-006)
8. [INF-001: Staging Environment](#inf-001)
9. [INF-007: Blue-Green Deployments](#inf-007)
10. [INF-008: Feature Flag Infrastructure](#inf-008)
11. [INF-009: Infrastructure Cost Optimization](#inf-009)
12. [AN-007: Session Recordings](#an-007)
13. [AN-008: Heatmaps](#an-008)
14. [AN-009: Custom Dashboards](#an-009)
15. [PRIV-005: DPIA](#priv-005)
16. [PRIV-009: Privacy Training](#priv-009)
17. [REL-003: Chaos Engineering](#rel-003)
18. [REL-006: Game Day Exercises](#rel-006)
19. [OBS-006: Synthetic Monitoring](#obs-006)
20. [OBS-007: Real User Monitoring](#obs-007)

---

<a id="s-013"></a>
## 1. S-013 — Penetration Testing

**What:** Schedule a professional penetration test of the Azeebo+ platform.
**Why:** Code review finds logic flaws; pen testing finds exploitable vulnerabilities a real attacker would use.
**Effort:** 2–4 weeks calendar time (1–2 weeks for vendor, 1–2 weeks for testing).

### Steps

1. **Select a vendor** (pick one):
   - [Cobalt.io](https://cobalt.io) — good for SaaS, starts ~$10k/test
   - [HackTheBox](https://www.hackthebox.com/business) — emerging option
   - [Intigriti](https://intigriti.com) — competitive pricing
   - [Bugcrowd](https://bugcrowd.com) — can combine with pen test + bug bounty

2. **Prepare scope document** — share this with the vendor:
   ```
   In-scope:
     - Web app: azeeboplus.com (all routes)
     - API Gateway: api.azeeboplus.com
     - All 28 microservices (internal endpoints)
     - Mobile apps (iOS/Android)
     - Authentication & authorization
     - Payment flows (Paystack/Flutterwave)
     - File upload/download
     - WebSocket connections

   Out-of-scope:
     - DDoS testing
     - Social engineering of employees
     - Physical security
   ```

3. **Set up a staging clone** for the pen test (see INF-001):
   ```bash
   # Point vendor to staging.azeeboplus.com
   # Provide test accounts with different roles
   ```

4. **Run the pen test** — vendor will:
   - Reconnaissance and mapping
   - Vulnerability scanning (automated)
   - Manual exploitation attempts
   - Privilege escalation attempts
   - Report with CVSS scores

5. **Remediate findings** — prioritize by severity:
   - Critical: Fix within 48 hours
   - High: Fix within 1 week
   - Medium: Fix within 2 weeks
   - Low: Fix within 1 month

### Verification
- Vendor delivers a report with CVSS-scored findings
- All Critical/High findings are remediated and retested
- Retest report shows clean

### Cost
- One-time: $10,000–$30,000 depending on scope and vendor

---

<a id="s-014"></a>
## 2. S-014 — Bug Bounty Program

**What:** Launch a public bug bounty program so security researchers can report vulnerabilities.
**Why:** Continuous testing beyond the one-time pen test; leverages the global security community.
**Effort:** 2–4 weeks to set up, then ongoing.

### Steps

1. **Choose a platform:**
   - [HackerOne](https://hackerone.com) — industry standard
   - [Bugcrowd](https://bugcrowd.com) — strong Nigerian/AFR community
   - Self-hosted (not recommended for first program)

2. **Create your program page:**
   ```
   Program name: Azeebo+ Bug Bounty
   Policy URL: https://azeeboplus.com/security
   Scope: *.azeeboplus.com, api.azeeboplus.com
   Exclusions: DDoS, social engineering, physical

   Bounty table:
     Critical (RCE, SQLi, auth bypass): $500–$2,000
     High (XSS, SSRF, IDOR): $200–$500
     Medium (CSRF, info disclosure): $50–$200
     Low (missing headers, minor issues): $25–$50
   ```

3. **Write a responsible disclosure policy:**
   ```markdown
   # Security Policy

   ## Reporting a Vulnerability
   Email: security@azeeboplus.com
   Or submit via HackerOne: [link]

   ## What to include
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (optional)

   ## What to expect
   - Acknowledgement within 48 hours
   - Status update within 7 days
   - Bounty within 30 days of validation

   ## Safe harbor
   We will not pursue legal action against researchers who:
   - Make a good faith effort to avoid privacy violations
   - Only interact with accounts you own
   - Report vulnerabilities promptly
   ```

4. **Deploy the policy page** at `https://azeeboplus.com/security`

5. **Set up a triage process:**
   - Designate 1–2 engineers for initial triage
   - SLA: Acknowledge in 48h, triage in 7 days

### Verification
- Program page is live on HackerOne/Bugcrowd
- At least 1 report received and triaged within first month

### Cost
- Platform fee: $0–$500/month + bounty payouts ($25–$2,000 per report)

---

<a id="api-009"></a>
## 3. API-009 — API Playground

**What:** Create an interactive API testing interface for developers.
**Why:** Enables frontend developers and partners to test API endpoints without writing code.
**Effort:** 1–2 weeks.

### Steps

1. **Option A — Swagger UI (quickest):**
   ```bash
   # Already have @nestjs/swagger in most services
   # Enable in each service's main.ts:

   # In src/main.ts:
   import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

   const config = new DocumentBuilder()
     .setTitle('Azeebo+ API')
     .setDescription('Azeebo+ microservices API documentation')
     .setVersion('1.0')
     .addBearerAuth()
     .build();

   const document = SwaggerModule.createDocument(app, config);
   SwaggerModule.setup('docs', app, document);
   ```

2. **Option B — Scalar (modern UI):**
   ```bash
   npm install @scalar/nestjs-api-reference
   # In main.ts:
   import ApiReference from '@scalar/nestjs-api-reference';
   app.use('/docs', ApiReference({ content: document }));
   ```

3. **Option C — Hoppscotch (self-hosted):**
   ```bash
   # Deploy Hoppscotch for a Postman-like experience
   docker run -d -p 3000:3000 hoppscotch/hoppscotch
   # Configure collection for Azeebo+ API
   ```

4. **Deploy at** `https://api.azeeboplus.com/docs` or `https://playground.azeeboplus.com`

### Verification
- Swagger UI loads at `/docs` endpoint
- All endpoints are listed with request/response schemas
- "Try it out" button works for authenticated endpoints

### Cost
- Free (Swagger UI is open-source)

---

<a id="db-008"></a>
## 4. DB-008 — Configure Read Replicas

**What:** Set up PostgreSQL streaming replication for read-heavy workloads.
**Why:** Offload search, analytics, and list queries from the primary database.
**Effort:** 1–2 days.

### Steps (AWS RDS)

1. **Create a read replica:**
   ```bash
   # Via AWS CLI
   aws rds create-db-instance-read-replica \
     --db-instance-identifier azeebo-replica-1 \
     --source-db-instance-identifier azeebo-primary \
     --db-instance-class db.r6g.large \
     --region af-south-1 \
     --publicly-accessible false
   ```

2. **Configure connection in Prisma:**
   ```prisma
   // prisma/schema.prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")       // Primary (read-write)
     // url  = env("DATABASE_READ_URL")    // Replica (read-only)
   }
   ```

3. **Add read replica routing:**
   ```typescript
   // packages/shared-services/src/database/replica.config.ts
   export const REPLICA_CONFIG = {
     primary: process.env.DATABASE_URL,
     replica: process.env.DATABASE_READ_URL,
     // Use replica for:
     // - GET list endpoints
     // - Search queries
     // - Analytics/reporting
     // - Dashboard data
   };
   ```

4. **Update PrismaClient to use replica for reads:**
   ```typescript
   const replicaPrisma = new PrismaClient({
     datasources: { db: { url: process.env.DATABASE_READ_URL } },
   });
   ```

### Verification
```bash
# Check replica lag
aws rds describe-db-instances \
  --db-instance-identifier azeebo-replica-1 \
  --query 'DBInstances[0].StatusInfos'

# Should show ReplicaLag < 1 second
```

### Cost
- ~$200–$500/month for a db.r6g.large replica

---

<a id="arch-003"></a>
## 5. ARCH-003 — Service Mesh

**What:** Deploy Istio or Linkerd for service-to-service communication.
**Why:** Provides mTLS, traffic management, observability, and policies without code changes.
**Effort:** 2–4 weeks.

### Steps (Istio on ECS — using App Mesh)

1. **Install AWS App Mesh Controller:**
   ```bash
   # If using EKS
   helm repo add eks https://aws.github.io/eks-charts
   helm install appmesh-controller eks/appmesh-controller \
     --namespace appmesh-system \
     --create-namespace \
     --set region=af-south-1 \
     --set mesh.name=azeebo-mesh
   ```

2. **Alternative — Linkerd (simpler):**
   ```bash
   # On any Kubernetes cluster
   curl -fsL https://run.linkerd.io/install | sh
   linkerd install --crds | kubectl apply -f -
   linkerd install | kubectl apply -f -

   # Inject sidecar into services
   kubectl get deploy -n azeebo -o yaml | linkerd inject - | kubectl apply -f -
   ```

3. **Configure mTLS:**
   ```yaml
   # linkerd-mesh-policy.yaml
   apiVersion: policy.linkerd.io/v1beta1
   kind: Server
   metadata:
     name: azeebo-server
     namespace: azeebo
   spec:
     port: 3013
     selector:
       matchLabels:
         app: api-gateway
   ```

4. **For ECS (without Kubernetes):**
   - Use **AWS Cloud Map** for service discovery (see ARCH-005)
   - Use **AWS ALB** for traffic management
   - Use **App Mesh** for sidecar proxy (Envoy)

### Verification
```bash
# Check mTLS is active
linkerd viz check
linkerd viz stat deploy -n azeebo
# All services should show ✅ mTLS
```

### Cost
- Free (Linkerd) or ~$100–$300/month (Istio on EKS)

---

<a id="arch-005"></a>
## 6. ARCH-005 — Service Discovery

**What:** Implement dynamic service discovery so services can find each other without hardcoded URLs.
**Why:** Currently services use environment variables for URLs; discovery enables dynamic scaling and failover.
**Effort:** 1–2 weeks.

### Steps (AWS Cloud Map)

1. **Create a private DNS namespace:**
   ```bash
   aws cloudmap create-private-dns-namespace \
     --name azeebo.local \
     --vpc vpc-xxxxxxxx \
     --region af-south-1
   ```

2. **Register services:**
   ```bash
   # Register API Gateway
   aws cloudmap create-service \
     --name api-gateway \
     --namespace-id ns-xxxxxxxx

   # Register each microservice
   for svc in auth content media payment wallet user search reality creator; do
     aws cloudmap create-service \
       --name ${svc}-service \
       --namespace-id ns-xxxxxxxx
   done
   ```

3. **Update service URLs:**
   ```typescript
   // Instead of: http://auth-service:3001
   // Use: http://auth-service.azeebo.local:3001
   ```

4. **Health check registration:**
   ```bash
   # Register instances with health checks
   aws cloudmap register-instance \
     --service-id svc-xxxxxxxx \
     --instance-id i-001 \
     --attributes AWS_INSTANCE_IPV4=10.0.1.10,AWS_INSTANCE_PORT=3001
   ```

### Alternative — Consul:
```bash
# Install Consul
brew install consul
consul agent -dev

# Register services via API
curl -X PUT http://localhost:8500/v1/agent/service/register -d '{
  "Name": "auth-service",
  "Port": 3001,
  "Check": { "HTTP": "http://localhost:3001/health", "Interval": "10s" }
}'
```

### Verification
```bash
# Discover services
aws cloudmap discover-instances \
  --namespace-name azeebo.local \
  --service-name auth-service

# Should return IP and port
```

### Cost
- Free (Cloud Map) or free (Consul open-source)

---

<a id="arch-006"></a>
## 7. ARCH-006 — Chaos Engineering

**What:** Systematically inject failures to test resilience.
**Why:** Find weaknesses before production incidents do.
**Effort:** 2–4 weeks.

### Steps

1. **Choose a tool:**
   - [Gremlin](https://gremlin.com) — managed, easiest ($0 free tier)
   - [Chaos Monkey](https://netflix.github.io/chaosmonkey/) — Netflix's tool
   - [Litmus](https://litmuschaos.io) — Kubernetes-native, free

2. **Start with game days (low risk):**
   ```bash
   # Kill a single service instance
   docker stop azeebo-content-service

   # Simulate network latency
   tc qdisc add dev eth0 root netem delay 200ms 50ms

   # Fill disk
   dd if=/dev/zero of=/tmp/fill bs=1M count=1024
   ```

3. **Define chaos experiments:**
   ```
   Experiment 1: Kill auth-service
   Expected: Other services return 503, circuit breaker opens
   Rollback: Restart service

   Experiment 2: Add 500ms latency to Redis
   Expected: Cache misses increase, fallback to DB
   Rollback: Remove latency rule

   Experiment 3: Fill primary database disk to 90%
   Expected: Alerts fire, writes fail gracefully
   Rollback: Remove fill file
   ```

4. **Run experiments in staging first, then production:**
   ```bash
   # Gremlin example
   gremlin attack network --host auth-service --duration 60s --latency 500ms
   gremlin attack process --host content-service --signal SIGKILL
   gremlin attack cpu --host payment-service --length 60s --load 90
   ```

### Verification
- All experiments documented with hypothesis and result
- No production incidents caused by chaos tests
- Runbooks updated based on findings

### Cost
- Free (Litmus, Chaos Monkey) or $0–$500/month (Gremlin free tier)

---

<a id="inf-001"></a>
## 8. INF-001 — Set Up Staging Environment

**What:** Deploy a full staging environment mirroring production.
**Why:** Test changes safely before production; run integration tests against real infrastructure.
**Effort:** 1–2 weeks.

### Steps

1. **Create a separate Coolify project:**
   ```
   Project name: azeebo-staging
   Environment: staging
   ```

2. **Deploy with staging config:**
   ```bash
   # Use the existing staging.env
   cp deploy/staging.env .env.staging

   # Deploy via Coolify
   # 1. Create new Docker Compose project
   # 2. Point to docker-compose.all-in-one.yml
   # 3. Add environment variables from staging.env
   # 4. Deploy
   ```

3. **Set up separate database:**
   ```bash
   # Create staging database
   createdb azeebo_staging

   # Run migrations
   cd packages/shared-services
   DATABASE_URL=postgresql://azeebo_staging:password@localhost:5432/azeebo_staging \
     npx prisma migrate deploy
   ```

4. **Configure DNS:**
   ```
   staging.azeeboplus.com  →  staging server IP
   api-staging.azeeboplus.com  →  staging server IP
   ```

5. **Seed test data:**
   ```bash
   # Run seed scripts against staging
   cd services/core/auth-service
   DATABASE_URL=$STAGING_DB_URL npx prisma db seed
   ```

6. **Set up CI/CD for staging:**
   ```yaml
   # In .github/workflows/cd.yml — add staging branch trigger
   on:
     push:
       branches: [staging]
   jobs:
     deploy-staging:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v4
         - run: docker build -t ghcr.io/azeebotv/azeebo:staging .
         - run: docker push ghcr.io/azeebotv/azeebo:staging
         # Trigger Coolify redeploy via webhook
   ```

### Verification
```bash
# Staging is accessible
curl -I https://staging.azeeboplus.com
# Should return 200 OK

# API works
curl https://api-staging.azeeboplus.com/health
# Should return healthy
```

### Cost
- ~$200–$400/month for a staging server (half-size of production)

---

<a id="inf-007"></a>
## 9. INF-007 — Blue-Green Deployments

**What:** Deploy new versions alongside old ones, then switch traffic.
**Why:** Zero-downtime deployments with instant rollback.
**Effort:** 1–2 weeks.

### Steps (Using Coolify)

1. **Configure in Coolify:**
   ```
   Project Settings → Deployment Strategy → Blue-Green
   # Coolify natively supports blue-green deployments
   # New container starts on a different port
   # Traffic switches only after health check passes
   ```

2. **Manual blue-green with Docker Compose:**
   ```yaml
   # docker-compose.blue-green.yml
   services:
     azeebo-blue:
       image: ghcr.io/azeebotv/azeebo:stable
       ports: ["3013:3013", "4000:4000"]
       labels:
         - "azeebo.color=blue"

     azeebo-green:
       image: ghcr.io/azeebotv/azeebo:latest
       ports: ["3014:3013", "4001:4000"]
       labels:
         - "azeebo.color=green"
       profiles: ["green"]  # Only starts when activated
   ```

3. **Nginx traffic switch:**
   ```nginx
   # /etc/nginx/conf.d/azeebo.conf
   upstream backend {
     # Blue (current)
     server 127.0.0.1:3013;
     # server 127.0.0.1:3014;  # Green (standby) — uncomment to switch
   }
   ```

4. **Rollback script:**
   ```bash
   #!/bin/bash
   # deploy/rollback.sh
   echo "Rolling back to previous version..."
   docker-compose -f docker-compose.blue-green.yml up -d azeebo-blue
   # Update nginx to point to blue
   sed -i 's/server 127.0.0.1:3014/server 127.0.0.1:3013/' /etc/nginx/conf.d/azeebo.conf
   nginx -s reload
   echo "Rollback complete"
   ```

### Verification
```bash
# Deploy new version
docker-compose -f docker-compose.blue-green.yml up -d azeebo-green

# Verify green is healthy
curl http://localhost:3014/health

# Switch traffic
# Verify old version still works for rollback
```

### Cost
- Requires 2x resources during deployment (already accounted for in sizing)

---

<a id="inf-008"></a>
## 10. INF-008 — Feature Flag Infrastructure

**What:** Deploy a feature flag system for gradual rollouts and A/B testing.
**Why:** Decouple deployment from release; enable trunk-based development.
**Effort:** 1–2 weeks.

### Steps

1. **Option A — Unleash (self-hosted, free):**
   ```bash
   # Deploy Unleash via Docker
   docker run -d \
     --name unleash \
     -p 4242:4242 \
     -e DATABASE_URL=postgres://user:pass@db/unleash \
     unleashorg/unleash-server

   # Access at http://localhost:4242
   # Default: admin/unleash4all
   ```

2. **Option B — LaunchDarkly (managed, paid):**
   ```bash
   # Install SDK
   npm install launchdarkly-node-server-sdk

   # Initialize
   import { init } from 'launchdarkly-node-server-sdk';
   const ldClient = init(process.env.LD_SDK_KEY);
   await ldClient.waitForInitialization();
   ```

3. **Option C — ConfigCat (free tier):**
   ```bash
   npm install configcat-js
   import * as configcat from 'configcat-js';
   const client = configcat.getClient('YOUR.SDK.KEY');
   ```

4. **Add flags to the app:**
   ```typescript
   // Feature flags for Azeebo+
   const FEATURE_FLAGS = {
     'new-reality-voting-ui': false,  // Gradual rollout
     'dark-mode': true,
     'premium-monetization': true,
     'chat-widget': false,            // Not yet launched
     'payment-v2': false,             // Testing
   };

   // In component
   if (await featureFlag.isEnabled('chat-widget')) {
     return <ChatWidget />;
   }
   ```

5. **Integrate with existing AB testing:**
   ```typescript
   // packages/shared-services/src/experimentation/ab-testing.ts
   // Already created — connect to Unleash/LD for real data
   ```

### Verification
```bash
# Feature flag system is accessible
curl http://localhost:4242/api/admin/features
# Returns list of feature flags

# SDK can read flags
curl http://localhost:4242/api/client/features
```

### Cost
- Free (Unleash self-hosted) or $0–$120/month (LaunchDarkly free tier)

---

<a id="inf-009"></a>
## 11. INF-009 — Infrastructure Cost Optimization

**What:** Right-size instances, use spot instances, and optimize resource utilization.
**Why:** Reduce AWS bill by 20–40% without sacrificing performance.
**Effort:** 1–2 weeks.

### Steps

1. **Audit current spend:**
   ```bash
   # Install AWS Cost Explorer CLI
   aws ce get-cost-and-usage \
     --time-period Start=2026-07-01,End=2026-08-01 \
     --granularity MONTHLY \
     --metrics "BlendedCost" \
     --group-by Type=DIMENSION,Key=SERVICE
   ```

2. **Right-size instances:**
   ```bash
   # Check CPU/memory utilization
   aws cloudwatch get-metric-statistics \
     --namespace AWS/EC2 \
     --metric-name CPUUtilization \
     --dimensions Name=InstanceId,Value=i-xxxxx \
     --start-time 2026-08-01T00:00:00Z \
     --end-time 2026-08-22T00:00:00Z \
     --period 86400 \
     --statistics Average

   # If avg < 30% → downsize
   # If avg > 70% → upsize
   ```

3. **Use spot instances for non-critical workloads:**
   ```bash
   # ECS service with spot capacity
   aws ecs create-service \
     --cluster azeebo \
     --service-name knowledge-service \
     --capacity-provider-strategy \
       capacityProvider=FARGATE_SPOT,weight=1
   ```

4. **Enable Savings Plans:**
   ```bash
   # Compute Savings Plan (1-year, no upfront)
   aws savingsplans describe-savings-plans-offering \
     --offering-type Ec2Instance \
     --product-type EC2 \
     --payment-option NO_UPFRONT
   ```

5. **Set up cost alerts (already configured in cost-monitoring.ts):**
   ```bash
   # Create budget via CLI
   aws budgets create-budget \
     --account-id $(aws sts get-caller-identity --query Account --output text) \
     --budget '{
       "BudgetName": "monthly-infrastructure",
       "BudgetLimit": { "Amount": "5000", "Unit": "USD" },
       "TimeUnit": "MONTHLY",
       "BudgetType": "COST"
     }'
   ```

### Verification
```bash
# Check current month's spend vs budget
aws ce get-cost-and-usage \
  --time-period Start=2026-08-01,End=2026-08-22 \
  --granularity MONTHLY \
  --metrics "BlendedCost"
```

### Cost
- Saves $500–$2,000/month

---

<a id="an-007"></a>
## 12. AN-007 — Session Recordings

**What:** Record user sessions for UX analysis and debugging.
**Why:** See exactly what users do, where they get stuck, and how they navigate.
**Effort:** 1 day.

### Steps

1. **Choose a tool:**
   - [Hotjar](https://hotjar.com) — free up to 35 sessions/day
   - [FullStory](https://fullstory.com) — enterprise, $300+/month
   - [PostHog](https://posthog.com) — open-source, self-hostable

2. **Install PostHog (self-hosted, free):**
   ```bash
   docker run -d \
     --name posthog \
     -p 8000:8000 \
     -e DATABASE_URL=postgres://user:pass@db/posthog \
     -e REDIS_URL=redis://redis:6379 \
     posthog/posthog

   # Access at http://localhost:8000
   ```

3. **Add to web app:**
   ```html
   <!-- In app/layout.tsx -->
   <Script
     src="https://us.i.posthog.com/static/array.js"
     strategy="afterInteractive"
   />
   <script dangerouslySetInnerHTML={{ __html: `
     window.posthog = window.posthog || [];
     posthog.init('YOUR_PROJECT_KEY', {
       api_host: 'https://analytics.azeeboplus.com',
       session_recording: { maskTextSelector: '.sensitive' }
     });
   `}} />
   ```

4. **Mask sensitive data:**
   ```css
   /* Mask password fields, payment info */
   .sensitive { posthog-mask-text; }
   ```

### Verification
- Record a test session
- Play it back in the PostHog/Hotjar dashboard
- Verify sensitive fields are masked

### Cost
- Free (PostHog self-hosted, Hotjar free tier)

---

<a id="an-008"></a>
## 13. AN-008 — Heatmaps

**What:** Visualize where users click, scroll, and move on each page.
**Why:** Identify UX friction points and optimize conversion.
**Effort:** 1 day.

### Steps

1. **Using Hotjar (includes heatmaps):**
   ```bash
   # Add Hotjar tracking code
   <script>
     (function(h,o,t,j,a,r){
       h.hj=h.hj||function(){(h.hj.q=h.hj.q||[]).push(arguments)};
       h._hjSettings={hjid:YOUR_ID,hjsv:6};
       a=o.getElementsByTagName('head')[0];
       r=o.createElement('script');r.async=1;
       r.src=t+h._hjSettings.hjid+j+h._hjSettings.hjsv;
       a.appendChild(r);
     })(window,document,'https://static.hotjar.com/c/hotjar-','.js?sv=');
   </script>
   ```

2. **Using PostHog:**
   ```typescript
   // PostHog includes heatmaps via toolbar
   // Enable in project settings → Toolbar
   ```

3. **Key pages to track:**
   - Homepage (above-fold engagement)
   - Registration flow (drop-off points)
   - Browse page (content discovery patterns)
   - Payment page (conversion friction)
   - Voting page (engagement patterns)

### Verification
- Heatmap overlay visible on key pages
- Click/scroll data appears in dashboard within 24 hours

### Cost
- Free (Hotjar free tier, PostHog)

---

<a id="an-009"></a>
## 14. AN-009 — Custom Dashboards

**What:** Build dashboards for business metrics in Grafana or Looker.
**Why:** Real-time visibility into KPIs without querying the database.
**Effort:** 2–3 weeks.

### Steps

1. **Deploy Grafana:**
   ```bash
   docker run -d \
     --name grafana \
     -p 3000:3000 \
     -e GF_SECURITY_ADMIN_PASSWORD=admin \
     grafana/grafana

   # Access at http://localhost:3000
   ```

2. **Connect to PostgreSQL:**
   ```
   Grafana → Data Sources → Add → PostgreSQL
   Host: db.azeebo.local:5432
   Database: azeebo
   User: grafana_readonly
   ```

3. **Create dashboards:**
   ```json
   // Dashboard: Business KPIs
   {
     "panels": [
       { "title": "Daily Active Users", "query": "SELECT date(created_at), COUNT(DISTINCT user_id) FROM sessions GROUP BY 1" },
       { "title": "Revenue (NGN)", "query": "SELECT date(created_at), SUM(amount) FROM payments WHERE status='success' GROUP BY 1" },
       { "title": "New Signups", "query": "SELECT date(created_at), COUNT(*) FROM users GROUP BY 1" },
       { "title": "Subscription Conversion", "query": "SELECT COUNT(CASE WHEN plan!='free' THEN 1 END) * 100.0 / COUNT(*) FROM users" }
     ]
   }
   ```

4. **Import pre-built dashboards:**
   ```bash
   # Import Kubernetes/Docker dashboards
   grafana-cli plugins install grafana-piechart-panel
   # Import dashboard ID 315 (Docker) from grafana.com
   ```

### Verification
- Grafana accessible at `https://grafana.azeeboplus.com`
- At least 3 dashboards with real data
- Alerts configured for anomalies

### Cost
- Free (Grafana open-source)

---

<a id="priv-005"></a>
## 15. PRIV-005 — Data Protection Impact Assessment (DPIA)

**What:** Formally assess privacy risks of data processing activities.
**Why:** Required under GDPR Article 35 for high-risk processing; good practice for NDPR compliance.
**Effort:** 2–4 weeks.

### Steps

1. **Download a DPIA template:**
   - [ICO DPIA template](https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/accountability-and-governance/impact-assessments-ria/dpia-template/) (UK)
   - [CNIL DPIA tool](https://www.cnil.fr/en/open-source-pia-software-helps-carry-out-data-protection-impact-assessment) (France, open-source)

2. **Assess each processing activity:**
   ```
   Activity: User Registration
   Data collected: Name, email, password, phone
   Purpose: Account creation and authentication
   Legal basis: Contract performance (GDPR Art. 6(1)(b))
   Retention: Until account deletion + 30 days
   Risks: Unauthorized access, data breach
   Mitigations: Encryption at rest/transit, RBAC, audit logging

   Activity: Reality Voting
   Data collected: Vote choices, wallet balance, IP address
   Purpose: Entertainment engagement
   Legal basis: Consent (GDPR Art. 6(1)(a))
   Retention: 2 years for audit trail
   Risks: Manipulation, financial fraud
   Mitigations: Rate limiting, fraud detection, idempotency keys
   ```

3. **Consult with legal counsel** (recommended):
   - Local Nigerian lawyer familiar with NDPR
   - EU lawyer if serving EU users

4. **Publish summary:**
   ```
   # DPIA Summary — Azeebo+
   Date: August 2026
   DPO: dpo@azeeboplus.com
   
   High-risk processing:
   1. Payment processing (PCI DSS scope)
   2. Minor user data (if under 18)
   3. Profiling/recommendation engine
   
   All risks rated LOW after mitigations.
   ```

### Verification
- DPIA document completed and signed by DPO
- All high-risk processing assessed
- Mitigations implemented and verified

### Cost
- $0 (internal) or $2,000–$5,000 (with legal counsel)

---

<a id="priv-009"></a>
## 16. PRIV-009 — Privacy Training

**What:** Train the team on privacy best practices and data protection obligations.
**Why:** People are the weakest link in data protection; training reduces human error.
**Effort:** 1–2 days.

### Steps

1. **Create training curriculum:**
   ```
   Module 1: Data Protection Principles (30 min)
   - Lawfulness, fairness, transparency
   - Purpose limitation
   - Data minimization
   - Accuracy
   - Storage limitation
   - Integrity and confidentiality

   Module 2: Your Role (30 min)
   - What data do we collect?
   - Who has access?
   - How to handle data subject requests
   - Reporting data breaches

   Module 3: Secure Coding (1 hour)
   - OWASP Top 10
   - Input validation
   - SQL injection prevention
   - XSS prevention
   - Secure authentication

   Module 4: Incident Response (30 min)
   - How to recognize a breach
   - Who to notify (within 72 hours)
   - Evidence preservation
   ```

2. **Schedule quarterly training:**
   ```bash
   # Create training events in calendar
   Q3 2026: Privacy fundamentals + OWASP Top 10
   Q4 2026: Data subject requests + incident response
   Q1 2027: Secure coding practices
   Q2 2027: Annual refresher + new threats
   ```

3. **Create a privacy handbook:**
   ```markdown
   # Azeebo+ Privacy Handbook
   
   ## Data Classification
   - Public: Content titles, creator names
   - Internal: Analytics, aggregated metrics
   - Confidential: User PII, payment data
   - Restricted: Passwords, tokens, secrets
   
   ## Handling Rules
   - Never commit secrets to Git
   - Never log PII in production
   - Always encrypt data at rest
   - Use parameterized queries only
   ```

### Verification
- All team members complete training
- Training completion tracked in HR system
- Quiz scores > 80%

### Cost
- $0 (internal) or $500–$2,000 (online course licenses)

---

<a id="rel-003"></a>
## 17. REL-003 — Chaos Engineering (Reliability)

**What:** See ARCH-006 above — this is the reliability-focused subset.
**Why:** Specifically tests failover, retry, and circuit breaker behavior.
**Effort:** 1–2 weeks.

### Steps

1. **Test circuit breakers:**
   ```bash
   # Block all traffic to auth-service
   iptables -A INPUT -p tcp --dport 3001 -j DROP
   
   # Verify circuit breaker opens
   # Other services should return 503, not hang
   
   # Restore traffic
   iptables -D INPUT -p tcp --dport 3001 -j DROP
   ```

2. **Test retry budgets:**
   ```bash
   # Add 500ms latency to payment service
   tc qdisc add dev eth0 root netem delay 500ms
   
   # Verify retry budget is respected
   # Should NOT retry more than configured max
   ```

3. **Test fallback behavior:**
   ```bash
   # Stop Redis
   docker stop redis
   
   # Verify services fall back to database
   # Check logs for "fallback" messages
   ```

### Verification
- Circuit breaker opens/closes correctly
- Retry budget prevents retry storms
- Fallbacks activate within 5 seconds

### Cost
- Free

---

<a id="rel-006"></a>
## 18. REL-006 — Game Day Exercises

**What:** Simulate production failures with the full team responding.
**Why:** Practice incident response so the real thing goes smoothly.
**Effort:** 1 day per exercise.

### Steps

1. **Plan a game day:**
   ```
   Exercise: "Database Failover"
   Scenario: Primary PostgreSQL goes down
   Participants: All on-call engineers
   Duration: 2 hours
   Objectives:
     - Detect the failure within 5 minutes
     - Failover to replica within 15 minutes
     - Communicate status to stakeholders
     - Restore full service within 30 minutes
   ```

2. **Run the exercise:**
   ```bash
   # Simulate database failure
   docker stop postgres-primary
   
   # Teams respond using runbooks
   # Monitor detection time, resolution time
   ```

3. **Debrief:**
   ```
   What went well:
   - Alert fired within 30 seconds
   - Failover script worked on first try
   
   What needs improvement:
   - Runbook was outdated (wrong port)
   - No Slack notification sent
   - Took 12 minutes to find the failover script
   ```

4. **Schedule quarterly game days:**
   - Q3: Database failover
   - Q4: Redis cache failure
   - Q1: API Gateway crash
   - Q2: Payment provider outage

### Verification
- Game day completed with documented results
- Action items from debrief are tracked and completed
- Runbooks updated

### Cost
- $0 (internal time)

---

<a id="obs-006"></a>
## 19. OBS-006 — Synthetic Monitoring

**What:** Run automated checks from external locations to verify uptime.
**Why:** Detect outages before users report them; verify global availability.
**Effort:** 1 day.

### Steps

1. **Choose a tool:**
   - [UptimeRobot](https://uptimerobot.com) — free, 50 monitors
   - [Pingdom](https://pingdom.com) — paid, $15+/month
   - [Checkly](https://checklyhq.com) — developer-focused, free tier

2. **Configure monitors:**
   ```
   Monitor 1: Homepage
   URL: https://azeeboplus.com
   Check interval: 1 minute
   Alert: email + Slack
   
   Monitor 2: API Health
   URL: https://api.azeeboplus.com/health
   Check interval: 30 seconds
   Expected: 200 OK with {"status":"healthy"}
   
   Monitor 3: Login Flow
   Type: Multi-step
   Steps:
     1. GET /auth/login → 200
     2. POST /auth/login → 302 redirect
   ```

3. **Set up multi-region checks:**
   ```
   Regions:
     - Lagos, Nigeria (primary)
     - London, UK (EU)
     - New York, US (Americas)
     - Mumbai, India (Asia)
   ```

4. **Configure alerting:**
   ```yaml
   # Alert rules
   - name: downtime
     condition: 2 consecutive failures
     notify: [slack:#incidents, email:oncall@azeeboplus.com]
   
   - name: slow_response
     condition: response_time > 5000ms
     notify: [slack:#performance]
   ```

### Verification
- All monitors active and passing
- Test alert by temporarily failing a monitor
- Verify notification arrives in Slack/email

### Cost
- Free (UptimeRobot) or $15–$50/month (Pingdom)

---

<a id="obs-007"></a>
## 20. OBS-007 — Real User Monitoring (RUM)

**What:** Capture actual user performance metrics (LCP, FID, CLS) from real browsers.
**Why:** Synthetic checks test from one location; RUM shows what real users experience.
**Effort:** 1–2 days.

### Steps

1. **Using Web Vitals library (free):**
   ```bash
   npm install web-vitals
   ```

   ```typescript
   // apps/web/src/lib/rum.ts
   import { onLCP, onFID, onCLS, onFCP, onTTFB } from 'web-vitals';

   function sendToAnalytics(metric: { name: string; value: number; id: string }) {
     // Send to your analytics endpoint
     fetch('/api/v1/analytics/web-vitals', {
       method: 'POST',
       body: JSON.stringify({
         name: metric.name,
         value: metric.value,
         id: metric.id,
         url: window.location.href,
         userAgent: navigator.userAgent,
       }),
       keepalive: true,
     });
   }

   onLCP(sendToAnalytics);
   onFID(sendToAnalytics);
   onCLS(sendToAnalytics);
   onFCP(sendToAnalytics);
   onTTFB(sendToAnalytics);
   ```

2. **Using PostHog (already set up in AN-007):**
   ```typescript
   // PostHog automatically captures performance metrics
   // Enable in Project Settings → Performance
   ```

3. **Visualize in Grafana:**
   ```sql
   -- Dashboard panel: Core Web Vitals
   SELECT
     date_trunc('hour', created_at) AS time,
     AVG(CASE WHEN name='LCP' THEN value END) AS lcp,
     AVG(CASE WHEN name='FID' THEN value END) AS fid,
     AVG(CASE WHEN name='CLS' THEN value END) AS cls
   FROM web_vitals
   WHERE created_at > NOW() - INTERVAL '7 days'
   GROUP BY 1 ORDER BY 1
   ```

4. **Set performance budgets:**
   ```typescript
   const PERFORMANCE_BUDGETS = {
     LCP: { good: 2500, poor: 4000 },  // ms
     FID: { good: 100, poor: 300 },     // ms
     CLS: { good: 0.1, poor: 0.25 },
   };

   // Alert if metrics degrade
   ```

### Verification
- Web Vitals data appears in analytics within 24 hours
- Dashboard shows LCP, FID, CLS trends
- Alerts fire when metrics exceed thresholds

### Cost
- Free (web-vitals library + your own analytics endpoint)

---

## Summary

| # | Item | Tool | Cost | Effort | Priority |
|---|------|------|------|--------|----------|
| 1 | S-013: Pen Testing | Cobalt/HackerOne | $10k–$30k | 2–4 weeks | P0 |
| 2 | S-014: Bug Bounty | HackerOne/Bugcrowd | $0–$500/mo | 2–4 weeks | P1 |
| 3 | API-009: Playground | Swagger UI | Free | 1–2 weeks | P1 |
| 4 | DB-008: Read Replicas | AWS RDS | $200–$500/mo | 1–2 days | P0 |
| 5 | ARCH-003: Service Mesh | Linkerd/Istio | Free–$300/mo | 2–4 weeks | P2 |
| 6 | ARCH-005: Discovery | Cloud Map/Consul | Free | 1–2 weeks | P1 |
| 7 | ARCH-006: Chaos Eng | Gremlin/Litmus | Free–$500/mo | 2–4 weeks | P2 |
| 8 | INF-001: Staging | Coolify | $200–$400/mo | 1–2 weeks | P0 |
| 9 | INF-007: Blue-Green | Coolify/Nginx | Free | 1–2 weeks | P1 |
| 10 | INF-008: Feature Flags | Unleash/LD | Free–$120/mo | 1–2 weeks | P1 |
| 11 | INF-009: Cost Opt | AWS Savings Plans | Saves $500–$2k/mo | 1–2 weeks | P0 |
| 12 | AN-007: Session Rec | PostHog/Hotjar | Free | 1 day | P1 |
| 13 | AN-008: Heatmaps | Hotjar/PostHog | Free | 1 day | P1 |
| 14 | AN-009: Dashboards | Grafana | Free | 2–3 weeks | P1 |
| 15 | PRIV-005: DPIA | ICO template | $0–$5k | 2–4 weeks | P0 |
| 16 | PRIV-009: Training | Internal | $0–$2k | 1–2 days | P1 |
| 17 | REL-003: Chaos (Reliability) | Litmus | Free | 1–2 weeks | P2 |
| 18 | REL-006: Game Day | Internal | Free | 1 day/quarter | P1 |
| 19 | OBS-006: Synthetic | UptimeRobot | Free | 1 day | P0 |
| 20 | OBS-007: RUM | web-vitals | Free | 1–2 days | P1 |

### Recommended Execution Order

**Week 1–2 (P0):**
1. INF-001: Set up staging environment
2. DB-008: Configure read replicas
3. INF-009: Cost optimization
4. S-013: Schedule pen test
5. PRIV-005: Complete DPIA
6. OBS-006: Set up synthetic monitoring

**Week 3–4 (P1):**
7. API-009: Deploy API playground
8. INF-007: Blue-green deployments
9. INF-008: Feature flag infrastructure
10. AN-007/008: Session recordings + heatmaps
11. OBS-007: Real user monitoring
12. S-014: Launch bug bounty

**Week 5–8 (P1–P2):**
13. ARCH-005: Service discovery
14. AN-009: Custom dashboards
15. PRIV-009: Privacy training
16. REL-006: First game day

**Week 9–12 (P2):**
17. ARCH-003: Service mesh
18. ARCH-006/REL-003: Chaos engineering

---

*Generated by Buffy (Codebuff AI Agent) — August 22, 2026*
