/**
 * Unit tests for the pre-commit hook secret detection (scripts/pre-commit-hook.sh).
 *
 * Each test spins up a minimal temp git repo, stages files with known secret
 * patterns, runs the real hook script, and asserts on exit code + output.
 *
 * Run: node --test scripts/__tests__/pre-commit-secrets.test.mjs
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  mkdtempSync,
  mkdirSync,
  writeFileSync,
  chmodSync,
  cpSync,
  rmSync,
} from 'node:fs';
import { execSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const HOOK_SRC = path.join(__dirname, '..', 'pre-commit-hook.sh');
const ALLOWLIST_SRC = path.join(
  __dirname,
  '..',
  '..',
  '.github',
  'ci-test-secret-allowlist'
);

/**
 * Create a temp git repo with the pre-commit hook and allowlist installed.
 * Returns { root, hookPath } — caller should rmSync(root) in t.after().
 */
function makeRepo() {
  const root = mkdtempSync(path.join(tmpdir(), 'pre-commit-test-'));
  execSync('git init', { cwd: root, stdio: 'ignore' });
  execSync('git config user.email "test@test.com"', { cwd: root, stdio: 'ignore' });
  execSync('git config user.name "Test"', { cwd: root, stdio: 'ignore' });

  // Install the hook
  mkdirSync(path.join(root, '.git', 'hooks'), { recursive: true });
  const hookPath = path.join(root, '.git', 'hooks', 'pre-commit');
  cpSync(HOOK_SRC, hookPath);
  chmodSync(hookPath, 0o755);

  // Install the allowlist (copy from real repo if it exists)
  mkdirSync(path.join(root, '.github'), { recursive: true });
  try {
    cpSync(ALLOWLIST_SRC, path.join(root, '.github', 'ci-test-secret-allowlist'));
  } catch {
    // Allowlist doesn't exist yet — write a minimal one for testing
    writeFileSync(
      path.join(root, '.github', 'ci-test-secret-allowlist'),
      '# CI test secret allowlist\nsmoke_\nci-flagchain\n'
    );
  }

  return { root, hookPath };
}

/** Stage a file and run the hook. Returns { exitCode, stdout }. */
function runHook(root, filename, content) {
  const dir = path.dirname(path.join(root, filename));
  mkdirSync(dir, { recursive: true });
  writeFileSync(path.join(root, filename), content);
  execSync('git add ' + filename, { cwd: root, stdio: 'ignore' });

  const stdout = execSync('bash .git/hooks/pre-commit', {
    cwd: root,
    encoding: 'utf8',
    stdio: ['pipe', 'pipe', 'pipe'],
  });
  return { exitCode: 0, stdout: stdout || '' };
}

/** Like runHook but catches non-zero exit codes. */
function runHookSafe(root, filename, content) {
  const dir = path.dirname(path.join(root, filename));
  mkdirSync(dir, { recursive: true });
  writeFileSync(path.join(root, filename), content);
  execSync('git add ' + filename, { cwd: root, stdio: 'ignore' });

  try {
    const stdout = execSync('bash .git/hooks/pre-commit', {
      cwd: root,
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    return { exitCode: 0, stdout: stdout || '' };
  } catch (err) {
    // execSync throws on non-zero exit; err.stdout is a Buffer
    return {
      exitCode: err.status || 1,
      stdout: err.stdout ? String(err.stdout) : '',
      stderr: err.stderr ? String(err.stderr) : '',
    };
  }
}

// ── CI-only test secrets (should PASS) ────────────────────────────────────────

test('smoke_* prefixed JWT_ACCESS_SECRET is allowed', (t) => {
  const { root } = makeRepo();
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const result = runHook(root, 'docker-test.yml', `-e JWT_ACCESS_SECRET=smoke_jwt_access_secret_0123456789abcdef\n`);
  assert.equal(result.exitCode, 0, result.stdout);
  assert.match(result.stdout, /No hardcoded secrets detected/);
});

test('smoke_* prefixed JWT_REFRESH_SECRET is allowed', (t) => {
  const { root } = makeRepo();
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const result = runHook(root, 'docker-test.yml', `-e JWT_REFRESH_SECRET=smoke_jwt_refresh_secret_abcdef\n`);
  assert.equal(result.exitCode, 0, result.stdout);
  assert.match(result.stdout, /No hardcoded secrets detected/);
});

test('ci-flagchain prefixed secret is allowed', (t) => {
  const { root } = makeRepo();
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const result = runHook(root, 'workflow.yml', `JWT_SECRET: 'ci-flagchain-jwt-secret-0123456789abcdef0123456789abcdef'\n`);
  assert.equal(result.exitCode, 0, result.stdout);
  assert.match(result.stdout, /No hardcoded secrets detected/);
});

test('smoke_gateway_secret is allowed', (t) => {
  const { root } = makeRepo();
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const result = runHook(root, 'docker-test.yml', `-e GATEWAY_SECRET=smoke_gateway_secret\n`);
  assert.equal(result.exitCode, 0, result.stdout);
  assert.match(result.stdout, /No hardcoded secrets detected/);
});

// ── Real secrets (should FAIL) ────────────────────────────────────────────────

test('long random JWT_ACCESS_SECRET is flagged', (t) => {
  const { root } = makeRepo();
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const result = runHookSafe(root, '.env', `JWT_ACCESS_SECRET=aB3dE5fG7hI9jK1lM3nO5pQ7rS9tU1vW3xY5zA7bC9dE\n`);
  assert.equal(result.exitCode, 1);
  assert.match(result.stdout, /Hardcoded JWT_ACCESS_SECRET found/);
});

test('long random JWT_REFRESH_SECRET is flagged', (t) => {
  const { root } = makeRepo();
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const result = runHookSafe(root, 'config.ts', `JWT_REFRESH_SECRET=xY9zW8vU7tS6rQ5pO4nM3lK2jI1hG0fE9dC8bA7aB6cD\n`);
  assert.equal(result.exitCode, 1);
  assert.match(result.stdout, /Hardcoded JWT_REFRESH_SECRET found/);
});

test('long random GATEWAY_SECRET is flagged', (t) => {
  const { root } = makeRepo();
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const result = runHookSafe(root, 'deploy.sh', `GATEWAY_SECRET=aAbBcCdD0123456789012345678901234567890ab\n`);
  assert.equal(result.exitCode, 1);
  assert.match(result.stdout, /Hardcoded GATEWAY_SECRET found/);
});

test('Paystack secret key is flagged', (t) => {
  const { root } = makeRepo();
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const result = runHookSafe(root, '.env', `PAYSTACK_SECRET_KEY=sk_live_aBcDeFgHiJkLmNoPqRsTuVwXyZ0123456789\n`);
  assert.equal(result.exitCode, 1);
  assert.match(result.stdout, /Hardcoded PAYSTACK_SECRET_KEY found/);
});

test('Flutterwave secret key is flagged', (t) => {
  const { root } = makeRepo();
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const result = runHookSafe(root, 'config.yml', `FLUTTERWAVE_SECRET_KEY=FLWSECK-aBcDeFgHiJkLmNoPqRsTuVwXyZ0123456789\n`);
  assert.equal(result.exitCode, 1);
  assert.match(result.stdout, /Hardcoded FLUTTERWAVE_SECRET_KEY found/);
});

test('Twilio auth token is flagged', (t) => {
  const { root } = makeRepo();
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const result = runHookSafe(root, '.env', `TWILIO_AUTH_TOKEN=abcdef0123456789abcdef0123456789\n`);
  assert.equal(result.exitCode, 1);
  assert.match(result.stdout, /Hardcoded TWILIO_AUTH_TOKEN found/);
});

test('private key block is flagged', (t) => {
  const { root } = makeRepo();
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const result = runHookSafe(root, 'cert.pem', `-----BEGIN RSA PRIVATE KEY-----\nMIIEpAIBAAKCAQEA...\n`);
  assert.equal(result.exitCode, 1);
  assert.match(result.stdout, /Private key found/);
});

// ── Env var references (should PASS) ──────────────────────────────────────────

test('env var reference ${{ secrets.X }} is allowed', (t) => {
  const { root } = makeRepo();
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const result = runHook(root, 'workflow.yml', `JWT_ACCESS_SECRET: \${{ secrets.JWT_ACCESS_SECRET }}\n`);
  assert.equal(result.exitCode, 0, result.stdout);
  assert.match(result.stdout, /No hardcoded secrets detected/);
});

test('env var reference ${VAR} is allowed', (t) => {
  const { root } = makeRepo();
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const result = runHook(root, 'deploy.sh', `JWT_ACCESS_SECRET=\${JWT_ACCESS}\n`);
  assert.equal(result.exitCode, 0, result.stdout);
  assert.match(result.stdout, /No hardcoded secrets detected/);
});

test('command substitution $(openssl rand) is allowed', (t) => {
  const { root } = makeRepo();
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const result = runHook(root, 'gen.sh', `JWT_ACCESS_SECRET=$(openssl rand -hex 32)\n`);
  assert.equal(result.exitCode, 0, result.stdout);
  assert.match(result.stdout, /No hardcoded secrets detected/);
});

// ── Placeholder values (should PASS) ─────────────────────────────────────────

test('placeholder <generate-random-secret> is allowed', (t) => {
  const { root } = makeRepo();
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const result = runHook(root, '.env.example', `JWT_ACCESS_SECRET=<generate-random-secret>\n`);
  assert.equal(result.exitCode, 0, result.stdout);
  assert.match(result.stdout, /No hardcoded secrets detected/);
});

test('placeholder "your-xxx-here" is allowed', (t) => {
  const { root } = makeRepo();
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const result = runHook(root, '.env', `JWT_ACCESS_SECRET=your-access-secret-here\n`);
  assert.equal(result.exitCode, 0, result.stdout);
  assert.match(result.stdout, /No hardcoded secrets detected/);
});

// ── Comment lines (should PASS) ───────────────────────────────────────────────

test('commented-out secrets are not flagged', (t) => {
  const { root } = makeRepo();
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const result = runHook(root, '.env', `# JWT_ACCESS_SECRET=aB3dE5fG7hI9jK1lM3nO5pQ7rS9tU1vW3xY5zA7bC9dE\n`);
  assert.equal(result.exitCode, 0, result.stdout);
  assert.match(result.stdout, /No hardcoded secrets detected/);
});

// ── Allowlist customization ───────────────────────────────────────────────────

test('custom allowlist pattern is respected', (t) => {
  const { root } = makeRepo();
  t.after(() => rmSync(root, { recursive: true, force: true }));

  // Add a custom pattern to the allowlist
  writeFileSync(
    path.join(root, '.github', 'ci-test-secret-allowlist'),
    '# CI test secrets\nsmoke_\nci-flagchain\nmy-company-test-\n'
  );

  const result = runHook(root, 'test.yml', `JWT_ACCESS_SECRET=my-company-test-secret-abc123def456\n`);
  assert.equal(result.exitCode, 0, result.stdout);
  assert.match(result.stdout, /No hardcoded secrets detected/);
});

test('removing allowlist pattern makes it fail again', (t) => {
  const { root } = makeRepo();
  t.after(() => rmSync(root, { recursive: true, force: true }));

  // Write an empty allowlist (no patterns)
  writeFileSync(
    path.join(root, '.github', 'ci-test-secret-allowlist'),
    '# empty allowlist\n'
  );

  const result = runHookSafe(root, 'test.yml', `JWT_ACCESS_SECRET=smoke_test_abc123def456ghi789\n`);
  assert.equal(result.exitCode, 1);
  assert.match(result.stdout, /Hardcoded JWT_ACCESS_SECRET found/);
});

// ── SKIP_FILES patterns ──────────────────────────────────────────────────────

test('.env.example file is always skipped', (t) => {
  const { root } = makeRepo();
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const result = runHook(root, '.env.example', `JWT_ACCESS_SECRET=aB3dE5fG7hI9jK1lM3nO5pQ7rS9tU1vW3xY5zA7bC9dE\n`);
  assert.equal(result.exitCode, 0, result.stdout);
  assert.match(result.stdout, /No hardcoded secrets detected/);
});

test('markdown files are always skipped', (t) => {
  const { root } = makeRepo();
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const result = runHook(root, 'README.md', `JWT_ACCESS_SECRET=aB3dE5fG7hI9jK1lM3nO5pQ7rS9tU1vW3xY5zA7bC9dE\n`);
  assert.equal(result.exitCode, 0, result.stdout);
  assert.match(result.stdout, /No hardcoded secrets detected/);
});

// ── Mixed content ────────────────────────────────────────────────────────────

test('CI test secret + real secret in same file: only real one is flagged', (t) => {
  const { root } = makeRepo();
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const content = [
    `-e JWT_ACCESS_SECRET=smoke_jwt_access_secret_abcdef1234567890\n`,
    `JWT_ACCESS_SECRET=aB3dE5fG7hI9jK1lM3nO5pQ7rS9tU1vW3xY5zA7bC9dE\n`,
  ].join('');
  const result = runHookSafe(root, 'mixed.yml', content);
  assert.equal(result.exitCode, 1);
  // The smoke one should NOT be flagged
  assert.doesNotMatch(result.stdout, /smoke_jwt_access_secret/);
  // The real one SHOULD be flagged
  assert.match(result.stdout, /Hardcoded JWT_ACCESS_SECRET found/);
});
