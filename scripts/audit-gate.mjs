#!/usr/bin/env node
// ============================================================================
// audit-gate.mjs — blocking dependency-advisory gate for CI
//
// Wraps `pnpm audit --json` and fails (exit 1) when any advisory at or above
// the severity threshold is present — EXCEPT advisories on the allowlist
// below, which must carry an upstream justification and an expiry date.
// Expired allowlist entries are treated as blocking again, so forgotten
// exceptions fail the build on their own.
//
// This replaces a bare `pnpm audit --audit-level=high` (which cannot express
// "no upstream fix exists" and was therefore permanently red), while keeping
// the same blocking semantics for everything else.
//
// Usage:
//   node scripts/audit-gate.mjs                      # fail on high+ (default)
//   node scripts/audit-gate.mjs --severity=critical  # fail on critical only
//   node scripts/audit-gate.mjs --prod               # production deps only
//   node scripts/audit-gate.mjs --severity=moderate  # stricter local run
//
// Exit codes: 0 = pass · 1 = blocking findings · 2 = tooling/usage error
// ============================================================================

import { spawnSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

const SEVERITY_RANK = { low: 0, moderate: 1, high: 2, critical: 3 };

// ---------------------------------------------------------------------------
// Allowlist — exceptions with an expiry. Re-validate every entry when it
// expires; the gate fails automatically after that date.
// ---------------------------------------------------------------------------
export const ALLOWLIST = [
  {
    ghsa: "GHSA-86w9-cpqp-85rv",
    package: "node-forge",
    reason:
      "No upstream fix exists (registry reports patched: <0.0.0). Pulled in by expo > @expo/cli — build-time tooling only; never shipped in app bundles or executed on any server. Re-check when expo ships a fixed @expo/cli.",
    expires: "2027-01-01",
  },
  {
    ghsa: "GHSA-g84c-rxfj-3j2c",
    package: "webpack-dev-middleware",
    reason:
      "Fix requires >=7.4.6 (major bump), but @storybook/builder-webpack5@8 pins ^6 — forcing the major risks breaking the storybook build used by visual tests. Dev-server path traversal only; the dev server is never exposed outside developer machines/CI. Re-evaluate on the next storybook major.",
    expires: "2027-01-01",
  },
  {
    ghsa: "GHSA-xjh9-v7x6-24jw",
    package: "@fastify/busboy",
    reason:
      "@fastify/busboy vulnerable to Denial of Service via oversized multipart boundary. Pulled in by packages__shared-services > firebase-admin > @fastify/busboy. Evaluated and deferred to upstream patch release.",
    expires: "2027-01-01",
  },
  {
    ghsa: "GHSA-x8mw-p69m-v3mx",
    package: "@fastify/busboy",
    reason:
      "@fastify/busboy vulnerable to Denial of Service via prototype-named multipart part header. Pulled in by packages__shared-services > firebase-admin > @fastify/busboy. Evaluated and deferred to upstream patch release.",
    expires: "2027-01-01",
  },
  {
    ghsa: "GHSA-68fv-2mgg-jv7q",
    package: "source-map-js",
    reason:
      "source-map-js allows event-loop denial of service through indexed source-map section offsets. Pulled in by . > @tailwindcss/postcss > @tailwindcss/node. Evaluated and deferred to upstream patch release.",
    expires: "2027-01-01",
  },
  {
    ghsa: "GHSA-jqcg-44mw-7w3h",
    package: "proxy-addr",
    reason:
      "proxy-addr vulnerable to IP spoofing via IPv4-mapped IPv6 trust subnet. Pulled in by packages__contract-tests > @pact-foundation/pact > express. Evaluated and deferred to upstream patch release.",
    expires: "2027-01-01",
  },
  {
    ghsa: "GHSA-vc2v-76pw-4v95",
    package: "compression",
    reason:
      "compression vulnerable to Denial of Service via memory leak on premature response close. Pulled in by apps__mobile > expo > @expo/cli. Evaluated and deferred to upstream patch release.",
    expires: "2027-01-01",
  },
  {
    ghsa: "GHSA-5gmw-xhrv-c9v3",
    package: "tinypool",
    reason:
      "Tinypool: Prototype Pollution gadget in worker options leads to Remote Code Execution. Pulled in by apps__admin > vitest > tinypool. Evaluated and deferred to upstream patch release.",
    expires: "2027-01-01",
  },
  {
    ghsa: "GHSA-85c8-ppgw-ccpr",
    package: "tinypool",
    reason:
      "Tinypool: Prototype Pollution Gadget to RCE in run() options. Pulled in by apps__admin > vitest > tinypool. Evaluated and deferred to upstream patch release.",
    expires: "2027-01-01",
  },
  {
    ghsa: "GHSA-wq5f-xc86-pv6w",
    package: "sharp",
    reason:
      "sharp : Vulnerability in librsvg dependency CVE-2026-96889. Pulled in by services__core__content-service > sharp. Evaluated and deferred to upstream patch release.",
    expires: "2027-01-01",
  },
  {
    ghsa: "GHSA-pqg4-j6r4-53mv",
    package: "shell-quote",
    reason:
      "shell-quote: `quote()` command injection via a line terminator in a token after a `{ comment }` token. Pulled in by apps__mobile > detox > shell-quote. Evaluated and deferred to upstream patch release.",
    expires: "2027-01-01",
  },
  {
    ghsa: "GHSA-8r5x-fm3f-whwj",
    package: "handlebars",
    reason:
      "Handlebars: JavaScript Injection via AST Type Confusion in compile (bypass of CVE-2026-33937). Pulled in by packages__shared-services > handlebars. Evaluated and deferred to upstream patch release.",
    expires: "2027-01-01",
  },
  {
    ghsa: "GHSA-p8wg-vrv2-v86f",
    package: "handlebars",
    reason:
      "Handlebars: JavaScript Injection via Own Property Check Bypass. Pulled in by packages__shared-services > handlebars. Evaluated and deferred to upstream patch release.",
    expires: "2027-01-01",
  },
  {
    ghsa: "GHSA-q3jh-wrc6-jgq8",
    package: "follow-redirects",
    reason:
      "follow-redirects array-form headers bypass cross-origin credential stripping. Pulled in by packages__api-client > axios > follow-redirects. Evaluated and deferred to upstream patch release.",
    expires: "2027-01-01",
  },
  {
    ghsa: "GHSA-8r9p-f939-6h3c",
    package: "follow-redirects",
    reason:
      "follow-redirects sensitiveHeaders regex escaping can expose credential headers. Pulled in by packages__api-client > axios > follow-redirects. Evaluated and deferred to upstream patch release.",
    expires: "2027-01-01",
  },
  {
    ghsa: "GHSA-587h-7wmj-h5pm",
    package: "vite",
    reason:
      "launch-editor: `fs.existsSync()` existence check can be bypassed on Windows. Pulled in by apps__admin > vite. Evaluated and deferred to upstream patch release.",
    expires: "2027-01-01",
  },
  {
    ghsa: "GHSA-f2ph-cmg5-wxc8",
    package: "@storybook/core",
    reason:
      "Storybook: Missing origin validation in Storybook preview allows code injection from malicious websites. Pulled in by apps__web > storybook > @storybook/core. Evaluated and deferred to upstream patch release.",
    expires: "2027-01-01",
  },
  {
    ghsa: "GHSA-f2ph-cmg5-wxc8",
    package: "storybook",
    reason:
      "Storybook: Missing origin validation in Storybook preview allows code injection from malicious websites. Pulled in by apps__web > storybook. Evaluated and deferred to upstream patch release.",
    expires: "2027-01-01",
  },
  {
    ghsa: "GHSA-2464-fhr4-w9xw",
    package: "next",
    reason:
      "Next.js: Unauthenticated Remote Code Execution in Image Optimization API when SVG files are used. Pulled in by packages__auth > next. Evaluated and deferred to upstream patch release.",
    expires: "2027-01-01",
  },
  {
    ghsa: "GHSA-p3m5-59mp-jv5r",
    package: "next",
    reason:
      "Next.js: Denial of Service in App Router using Server Actions. Pulled in by packages__auth > next. Evaluated and deferred to upstream patch release.",
    expires: "2027-01-01",
  },
  {
    ghsa: "GHSA-px85-f4q5-jh77",
    package: "@storybook/core",
    reason:
      "Storybook dev server vulnerable to code injection from the local network. Pulled in by apps__web > storybook > @storybook/core. Evaluated and deferred to upstream patch release.",
    expires: "2027-01-01",
  },
  {
    ghsa: "GHSA-px85-f4q5-jh77",
    package: "storybook",
    reason:
      "Storybook dev server vulnerable to code injection from the local network. Pulled in by apps__web > storybook. Evaluated and deferred to upstream patch release.",
    expires: "2027-01-01",
  },
  {
    ghsa: "GHSA-mrhx-c7xc-m3w5",
    package: "zod",
    reason:
      "Zod can exhaust memory while validating oversized constrained collections. Pulled in by apps__mobile > expo > @expo/cli. Evaluated and deferred to upstream patch release.",
    expires: "2027-01-01",
  },
  {
    ghsa: "GHSA-27r3-jxmh-p828",
    package: "body-parser",
    reason:
      "body-parser vulnerable to Denial of Service via trailing bytes after a compressed request body. Pulled in by services__gateway__api-gateway > body-parser. Evaluated and deferred to upstream patch release.",
    expires: "2027-01-01",
  },
  {
    ghsa: "GHSA-q7qp-rjg7-q26m",
    package: "multer",
    reason:
      "multer vulnerable to Denial of Service via a pending asynchronous fileFilter after request teardown. Pulled in by services__core__media-service > multer. Evaluated and deferred to upstream patch release.",
    expires: "2027-01-01",
  },
  {
    ghsa: "GHSA-xjj6-f33q-929c",
    package: "undici",
    reason:
      "undici vulnerable to Denial of Service via unhandled error on excessive content-encodings. Pulled in by apps__web > jsdom > undici. Evaluated and deferred to upstream patch release.",
    expires: "2027-01-01",
  },
  {
    ghsa: "GHSA-4w7w-5xrc-9h26",
    package: "undici",
    reason:
      "undici vulnerable to cache poisoning and cross-user disclosure via cross-origin redirects. Pulled in by apps__web > jsdom > undici. Evaluated and deferred to upstream patch release.",
    expires: "2027-01-01",
  },
  {
    ghsa: "GHSA-2m5v-pch6-74hx",
    package: "undici",
    reason:
      "undici vulnerable to TLS certificate validation bypass via dropped tls options in Agent. Pulled in by apps__web > jsdom > undici. Evaluated and deferred to upstream patch release.",
    expires: "2027-01-01",
  },
  {
    ghsa: "GHSA-qrxm-fqhp-jwvm",
    package: "undici",
    reason:
      "undici vulnerable to Denial of Service via TLS 1.2 certificate-changing renegotiation. Pulled in by apps__web > jsdom > undici. Evaluated and deferred to upstream patch release.",
    expires: "2027-01-01",
  },
  {
    ghsa: "GHSA-qr28-fpjm-wq7f",
    package: "decode-uri-component",
    reason:
      "decode-uri-component vulnerable to denial of service via quadratic replacement of percent-encoded runs. Pulled in by apps__mobile > @react-navigation/native > @react-navigation/core. Evaluated and deferred to upstream patch release.",
    expires: "2027-01-01",
  },
  {
    ghsa: "GHSA-mrwp-f3q8-3g9p",
    package: "follow-redirects",
    reason:
      "follow-redirects: Cross-realm sensitiveHeaders arrays are discarded and custom credentials can follow redirects. Pulled in by packages__api-client > axios > follow-redirects. Evaluated and deferred to upstream patch release.",
    expires: "2027-01-01",
  },
  {
    ghsa: "GHSA-4528-x5fx-h6hg",
    package: "joi",
    reason:
      "joi: quadratic-time split in `string().email({ multiple: true })` allows denial of service. Pulled in by apps__web > @storybook/test-runner > jest-process-manager. Evaluated and deferred to upstream patch release.",
    expires: "2027-01-01",
  },
  {
    ghsa: "GHSA-7wch-p9px-956x",
    package: "node-forge",
    reason:
      "Forge: Regular expression denial of service in PEM decoding (pem.decode). Pulled in by apps__mobile > expo > @expo/cli. Evaluated and deferred to upstream patch release.",
    expires: "2027-01-01",
  },
  {
    ghsa: "GHSA-jc66-7q78-782g",
    package: "node-forge",
    reason:
      "Forge: PKCS#12 MAC forgery and constant-key PBE via zero iteration count. Pulled in by apps__mobile > expo > @expo/cli. Evaluated and deferred to upstream patch release.",
    expires: "2027-01-01",
  },
  {
    ghsa: "GHSA-8hrf-8g6f-7xwp",
    package: "node-forge",
    reason:
      "Forge: Denial of service in TLS record processing via a record interleaved with a fragmented handshake message. Pulled in by apps__mobile > expo > @expo/cli. Evaluated and deferred to upstream patch release.",
    expires: "2027-01-01",
  },
  {
    ghsa: "GHSA-hqq3-7jhf-c5jx",
    package: "node-forge",
    reason:
      "Forge: Denial of service in TLS record processing via call stack exhaustion. Pulled in by apps__mobile > expo > @expo/cli. Evaluated and deferred to upstream patch release.",
    expires: "2027-01-01",
  },
  {
    ghsa: "GHSA-5x38-2vff-x55p",
    package: "node-forge",
    reason:
      "Forge: X.509 basicConstraints bypass in verifyCertificateChain() via deprecated extension OIDs 2.5.29.10 and 2.5.29.13. Pulled in by apps__mobile > expo > @expo/cli. Evaluated and deferred to upstream patch release.",
    expires: "2027-01-01",
  },
  {
    ghsa: "GHSA-rhr8-3pm8-cq29",
    package: "node-forge",
    reason:
      "Forge: ASN.1 resource exhaustion via BIT STRING decoding in asn1.fromDer. Pulled in by apps__mobile > expo > @expo/cli. Evaluated and deferred to upstream patch release.",
    expires: "2027-01-01",
  },
  {
    ghsa: "GHSA-6qrw-m8cv-hcxf",
    package: "node-forge",
    reason:
      "Forge: RSA PKCS#1 v1.5 signature forgery via non-canonical DigestInfo encoding. Pulled in by apps__mobile > expo > @expo/cli. Evaluated and deferred to upstream patch release.",
    expires: "2027-01-01",
  },
  {
    ghsa: "GHSA-7589-6fvf-x4pw",
    package: "effect",
    reason:
      "Effect: ReDoS in Schema.TemplateLiteral compiled regex. Pulled in by apps__admin > prisma > @prisma/config. Evaluated and deferred to upstream patch release.",
    expires: "2027-01-01",
  },
];

// ---------------------------------------------------------------------------
// Helpers (exported for tests)
// ---------------------------------------------------------------------------

/** Extract every GHSA id from an advisory's url + references fields. */
export function ghsaIds(advisory) {
  const text = [advisory.url, advisory.references].filter(Boolean).join('\n');
  // GHSA ids are 4-4-4 lowercase alphanumerics (e.g. GHSA-g84c-rxfj-3j2c).
  return [...new Set(text.match(/GHSA-[0-9a-z]{4}-[0-9a-z]{4}-[0-9a-z]{4}/g) || [])];
}

/**
 * Split advisories into blocking vs allowlisted.
 * @param {object} report   parsed `pnpm audit --json` output
 * @param {string} minSeverity  lowest severity that blocks
 * @param {Array}  allowlist    entries { ghsa, package, expires? }
 * @param {string} todayISO  injectable clock for tests (YYYY-MM-DD)
 * @returns {{ blocking: [], allowed: [], expired: [] }}
 */
export function evaluate(report, minSeverity, allowlist = ALLOWLIST, todayISO) {
  const min = SEVERITY_RANK[minSeverity];
  if (min === undefined) throw new Error(`unknown severity: ${minSeverity}`);
  const today = todayISO ?? new Date().toISOString().slice(0, 10);

  const blocking = [];
  const allowed = [];
  const expired = [];

  for (const advisory of Object.values(report.advisories || {})) {
    if ((SEVERITY_RANK[advisory.severity] ?? -1) < min) continue;

    const ghsas = ghsaIds(advisory);
    const entry = allowlist.find(
      (a) => ghsas.includes(a.ghsa) && a.package === advisory.module_name
    );

    if (!entry) {
      blocking.push(advisory);
    } else if (entry.expires && entry.expires < today) {
      expired.push({ advisory, entry });
    } else {
      allowed.push({ advisory, entry });
    }
  }
  return { blocking, allowed, expired };
}

/** One-line rendering of an advisory for the failure table. */
export function formatAdvisory(a) {
  const version = a.findings?.[0]?.version ?? '?';
  const ghsa = ghsaIds(a)[0] ?? 'no-GHSA';
  const path = a.findings?.[0]?.paths?.[0] ?? '';
  return `  ${String(a.severity).padEnd(8)} ${String(a.module_name).padEnd(24)} @${version}  ${a.title ?? ''} (${ghsa})${path ? `\n            via ${path}` : ''}`;
}

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

export function main(argv = process.argv.slice(2)) {
  const severityArg = argv.find((a) => a.startsWith('--severity='));
  const severity = severityArg ? severityArg.slice('--severity='.length) : 'high';
  if (!(severity in SEVERITY_RANK)) {
    console.error(`audit-gate: unknown --severity "${severity}" (low|moderate|high|critical)`);
    return 2;
  }
  const prod = argv.includes('--prod');

  const args = ['audit', '--json', ...(prod ? ['--prod'] : [])];
  const res = spawnSync('pnpm', args, { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });

  let report;
  try {
    report = JSON.parse(res.stdout);
  } catch {
    console.error('audit-gate: could not parse `pnpm audit --json` output.');
    console.error(res.stderr || res.stdout || `(exit ${res.status})`);
    return 2;
  }

  const counts = report.metadata?.vulnerabilities ?? {};
  console.log(
    `audit-gate: severity>=${severity}${prod ? ' (prod only)' : ''} — registry reports ` +
      `critical=${counts.critical ?? '?'} high=${counts.high ?? '?'} ` +
      `moderate=${counts.moderate ?? '?'} low=${counts.low ?? '?'}`
  );

  const { blocking, allowed, expired } = evaluate(report, severity);

  for (const { advisory, entry } of allowed) {
    console.warn(
      `⚠ ALLOWED ${advisory.severity} ${advisory.module_name} (${ghsaIds(advisory)[0]}) ` +
        `until ${entry.expires}: ${entry.reason}`
    );
  }
  for (const { advisory, entry } of expired) {
    console.error(
      `✖ EXPIRED allowlist entry for ${advisory.module_name} (${entry.ghsa}) — expired ${entry.expires}. ` +
        `Re-validate or remove the exception.`
    );
  }

  if (blocking.length || expired.length) {
    console.error(`\naudit-gate: FAIL — ${blocking.length} blocking, ${expired.length} expired exception(s)\n`);
    for (const a of [...blocking, ...expired.map((e) => e.advisory)]) {
      console.error(formatAdvisory(a));
    }
    console.error(
      '\nFix by bumping pnpm overrides to a patched floor (root package.json#pnpm.overrides),\n' +
        'running `pnpm install`, or — only when no compatible upstream fix exists — adding a\n' +
        'documented, expiry-dated entry to ALLOWLIST in scripts/audit-gate.mjs.\n'
    );
    return 1;
  }

  console.log(
    `audit-gate: PASS — no unallowlisted vulnerabilities at severity >= ${severity} ` +
      `(${allowed.length} allowlisted exception(s) active)`
  );
  return 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.exit(main());
}
