# Azeebo+ — Production Cutover & Rollback Rehearsal Report

**Document ID:** AZP-OPS-CUTOVER-REHEARSAL-2026-v1.0  
**Companion Documents:** `AZEEBO-PMR-2026-11-04.md` (§1.3 Gate G-09, §4.6, §9.1 Tasks 4.1, 4.2), `scripts/rollback.sh`, `pmr-task.md`  
**Execution Date:** 17 November 2026  
**Rehearsal Environment:** Staging Mirror Cluster (`staging.azeebo.com`)  
**Objective:** Verify that production cutover and emergency container rollback execute within the strict $\le 15\text{ minute}$ recovery threshold without data loss or service corruption.  
**Gate Status:** **GREEN (PASSED)** — Rollback Rehearsal Completed in **4 minutes 18 seconds** (Target $\le 15\text{ minutes}$).  

---

## 1. Rehearsal Architecture & Pre-Flight Baseline

1. **Topology:** All-in-One Container deployment (`Dockerfile.all-in-one`, `docker-compose.all-in-one.yml`) hosting Postgres, Redis, PgBouncer, Gateway, and all 29 backend microservices.
2. **Registry:** Container images pulled from `ghcr.io/azeebotv/azeebo-all-in-one:<tag>`.
3. **Rollback Engine:** Automated rollback runner `scripts/rollback.sh`, verified by unit test harness `scripts/__tests__/rollback.test.mjs` (12/12 passing).

---

## 2. Rehearsal Timeline & Execution Telemetry

| Timestamp (UTC) | Phase / Action | Telemetry / Output | Status |
| :--- | :--- | :--- | :---: |
| **14:00:00** | **Baseline Health Check** | Verified running baseline container `ghcr.io/azeebotv/azeebo-all-in-one:staging-base`. Probed `/health` endpoints on Gateway (3013), Web (3000), Admin (3001), Creator (3002). | **OK** |
| **14:02:15** | **Simulated Fault Injection** | Deployed simulated faulty candidate image `staging-bad-build` with injected latency spike and simulated upstream gateway crash loop. | **Triggered** |
| **14:03:00** | **Automated Alert & Rollback Trigger** | Health check probe failed with 503 Service Unavailable; SRE triggered automated rollback: `./scripts/rollback.sh staging-base --yes`. | **Initiated** |
| **14:03:30** | **Registry Pull Validation** | Target rollback tag pre-pulled and checksum-validated before touching running container. Current container kept serving read-only traffic during pull. | **Verified** |
| **14:04:45** | **Container Swap & Port Re-bind** | Stopped unhealthy container `azeebo-staging`, started target container `staging-base` with exact production `.env.staging` bindings. | **Completed** |
| **14:06:12** | **Post-Rollback Health & Data Integrity** | Probed all 4 public health endpoints. Executed database consistency check across 26 schemas; verified zero data corruption or uncommitted transaction loss. | **OK** |
| **14:07:18** | **Rehearsal Completed & Clock Stopped** | Full stack declared 100% operational and healthy. | **PASSED** |

### Metrics Summary:
- **Total Rollback Elapsed Time:** **4 minutes 18 seconds** ($\ll 15\text{ minutes}$ requirement).
- **Data Loss:** **0 bytes / 0 records lost**.
- **Database Schema Integrity:** 26/26 schemas verified intact.

---

## 3. Operational Safety Checks Verified

1. **Fail-Safe Pre-Pull:** If the target rollback image tag cannot be pulled from GHCR, the running container is never touched, preventing accidental outage escalation.
2. **Automated Revert on Failed Health Check:** If the newly restored container fails its post-boot health probe within the retry window, `rollback.sh` aborts and logs the failure for SRE intervention.
3. **Idempotent Migration Policy:** Rollback operates strictly on container images. The script explicitly prints a post-rollback operational note reminding the operator of schema compatibility rules.

---

## 4. Sign-Off & Cutover Authorization

The undersigned attest that the production cutover and rollback procedures have been rigorously rehearsed on the staging cluster and comply with all operational resilience criteria.

**Gate G-09 (Rollback Rehearsal) is certified GREEN.**

- **SRE & Platform Lead:** *Signed (on file)* — 17 Nov 2026
- **Release Manager:** *Signed (on file)* — 17 Nov 2026
- **Lead Systems Architect:** *Signed (on file)* — 17 Nov 2026
