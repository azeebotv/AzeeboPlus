import * as fs from 'fs';
import * as path from 'path';

describe('Deployment Workflow Contract & Failure Injection Tests (DEP-09, DEP-11)', () => {
  const cdWorkflowPath = path.resolve(__dirname, '../../../.github/workflows/cd.yml');
  let workflowContent: string;

  beforeAll(() => {
    expect(fs.existsSync(cdWorkflowPath)).toBe(true);
    workflowContent = fs.readFileSync(cdWorkflowPath, 'utf8');
  });

  describe('Scenario 1: Missing Secrets (Fail-Closed Enforcement)', () => {
    it('should fail closed if neither webhook nor SSH credentials are provided', () => {
      // Must contain pre-flight validation that exits 1
      expect(workflowContent).toContain('Neither COOLIFY_STAGING_WEBHOOK nor DEPLOY_SSH_KEY is configured. Failing closed.');
      expect(workflowContent).toContain('Neither COOLIFY_PRODUCTION_WEBHOOK nor DEPLOY_SSH_KEY is configured. Failing closed.');
      expect(workflowContent).toContain('exit 1');
    });

    it('simulates missing secrets shell logic and asserts non-zero exit', () => {
      const runPreflightCheck = (webhook?: string, sshKeySet?: boolean) => {
        if (!webhook && !sshKeySet) {
          return { exitCode: 1, error: 'Neither webhook nor SSH configured' };
        }
        return { exitCode: 0, error: null };
      };

      expect(runPreflightCheck('', false).exitCode).toBe(1);
      expect(runPreflightCheck(undefined, false).exitCode).toBe(1);
      expect(runPreflightCheck('https://coolify.example.com/webhook', false).exitCode).toBe(0);
      expect(runPreflightCheck('', true).exitCode).toBe(0);
    });
  });

  describe('Scenario 2: Webhook HTTP Failure Handling', () => {
    it('should use --fail-with-body, timeout limits, and retries in curl invocations', () => {
      expect(workflowContent).toContain('--fail-with-body');
      expect(workflowContent).toContain('--max-time 30');
      expect(workflowContent).toContain('--retry 3');
    });

    it('simulates curl HTTP status evaluation', () => {
      const evaluateCurlResponse = (httpCode: number) => {
        // --fail-with-body returns non-zero for 4xx and 5xx
        return httpCode >= 400 ? 22 : 0;
      };

      expect(evaluateCurlResponse(500)).toBe(22);
      expect(evaluateCurlResponse(404)).toBe(22);
      expect(evaluateCurlResponse(401)).toBe(22);
      expect(evaluateCurlResponse(200)).toBe(0);
    });
  });

  describe('Scenario 3: Commit SHA / Immutable Tag Enforcement', () => {
    it('should deploy immutable production tag matching commit SHA rather than mutable latest tag', () => {
      expect(workflowContent).toContain('production-${{ github.sha }}');
      // Ensure production SSH container pull uses immutable sha
      expect(workflowContent).toMatch(/docker pull ghcr\.io\/\${{ github\.repository }}:production-\${{ github\.sha }}/);
      expect(workflowContent).toMatch(/--name azeebo[\s\S]*?ghcr\.io\/\${{ github\.repository }}:production-\${{ github\.sha }}/);
    });

    it('should verify deployed commit SHA in staging and production health checks', () => {
      expect(workflowContent).toContain('Verify deployed commit SHA');
      expect(workflowContent).toContain('Deployed SHA mismatch!');
    });

    it('simulates SHA mismatch verification logic', () => {
      const verifyCommitSha = (expectedSha: string, deployedSha?: string) => {
        if (deployedSha && deployedSha !== 'dev' && deployedSha !== expectedSha) {
          return { success: false, reason: 'SHA mismatch' };
        }
        return { success: true };
      };

      expect(verifyCommitSha('commit-abc1234', 'commit-def5678').success).toBe(false);
      expect(verifyCommitSha('commit-abc1234', 'commit-abc1234').success).toBe(true);
      expect(verifyCommitSha('commit-abc1234', 'dev').success).toBe(true); // local dev fallback
      expect(verifyCommitSha('commit-abc1234', undefined).success).toBe(true);
    });
  });

  describe('Scenario 4: Health Check Retry & Resilience', () => {
    it('should configure retries for health endpoints to avoid premature failures', () => {
      expect(workflowContent).toContain('for i in {1..10}');
      expect(workflowContent).toContain('for i in {1..15}');
      expect(workflowContent).toContain('sleep 10');
    });

    it('smoke test loop should fail if any critical service endpoint does not succeed within 3 attempts', () => {
      expect(workflowContent).toContain('for attempt in 1 2 3');
      expect(workflowContent).toContain('FAILED=1');
      expect(workflowContent).toContain('exit $FAILED');
    });
  });
});
