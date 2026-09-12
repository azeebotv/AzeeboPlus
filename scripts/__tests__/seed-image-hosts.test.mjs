/**
 * Unit tests for the seed-image-hosts check (scripts/check-seed-image-hosts.mjs
 * → scripts/lib/seed-image-hosts-core.mjs).
 *
 * The invariant: every seeder media URL routes through
 * scripts/seeders/seed-image-hosts.ts, and every host registered there is
 * allowlisted in apps/web/next.config.js images.remotePatterns — because a
 * seed host missing from the allowlist crashes next/image at render time
 * (the cdn.azeebo.test incident).
 *
 * Strategy: parser unit cases on synthetic sources + fixture-tree checks with
 * injected sources (no filesystem setup needed for the rule logic), then a
 * real-repo assertion that the check is green on the actual tree and a
 * discriminating drift-injection probe against real files.
 */
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import os from 'node:os';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import {
  extractSeedHosts,
  extractAllowlistedHosts,
  collectSeederFiles,
  collectEmissionFiles,
  hostMatchesAllowlist,
  diffSeederEmissions,
  checkSeedImageHosts,
} from '../lib/seed-image-hosts-core.mjs';

const MODULE = `export const SEED_IMAGE_HOSTS = {
  'cdn.azeebo.test': 'music covers',
  'storage.azeebo.com': 'media',
  'picsum.photos': 'placeholders',
} as const;
export function seedImageUrl(host, path) { return \`https://\${host}/\${path}\`; }
`;

const CONFIG = (hosts) => `module.exports = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'api.azeeboplus.com' },
${hosts.map((h) => `      { protocol: 'https', hostname: '${h}' },`).join('\n')}
    ],
  },
};
`;

describe('extractSeedHosts', () => {
  test('extracts registered hosts from the module source', () => {
    const { hosts, error } = extractSeedHosts(MODULE);
    assert.equal(error, null);
    assert.deepEqual(hosts, ['cdn.azeebo.test', 'storage.azeebo.com', 'picsum.photos']);
  });

  test('ignores URLs that appear in string values, only keys count', () => {
    const src = `export const SEED_IMAGE_HOSTS = { 'a.example': 'see https://trap.example/x' } as const;`;
    const { hosts } = extractSeedHosts(src);
    assert.deepEqual(hosts, ['a.example']);
  });

  test('reports a missing registry', () => {
    const { hosts, error } = extractSeedHosts('export const x = 1;');
    assert.equal(hosts, null);
    assert.match(error, /SEED_IMAGE_HOSTS not found/);
  });

  test('comments inside the registry — even with apostrophes/braces — do not break parsing', () => {
    // Regression: a naive scanner read the apostrophe in a host comment like
    // "don't" as an open string, desyncing brace tracking ("object never closes").
    const src = [
      'export const SEED_IMAGE_HOSTS = {',
      "  // don't treat this apostrophe as a string; nor these { braces }",
      "  'picsum.photos': 'placeholders', /* block comment with ' and { } too */",
      '} as const;',
    ].join('\n');
    const { hosts, error } = extractSeedHosts(src);
    assert.equal(error, null);
    assert.deepEqual(hosts, ['picsum.photos']);
  });
});

describe('extractAllowlistedHosts', () => {
  test('extracts hostnames from remotePatterns', () => {
    const { hosts, error } = extractAllowlistedHosts(CONFIG(['picsum.photos', 'cdn.azeebo.test']));
    assert.equal(error, null);
    assert.deepEqual(hosts, ['api.azeeboplus.com', 'picsum.photos', 'cdn.azeebo.test']);
  });

  test('reports a missing remotePatterns block', () => {
    const { hosts, error } = extractAllowlistedHosts('module.exports = { images: {} };');
    assert.equal(hosts, null);
    assert.match(error, /remotePatterns not found/);
  });
});

describe('collectSeederFiles', () => {
  test('finds scripts/seeders/*.ts and scripts/seed-*.ts, excluding non-ts', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'sih-collect-'));
    try {
      fs.mkdirSync(path.join(root, 'scripts', 'seeders'), { recursive: true });
      fs.writeFileSync(path.join(root, 'scripts', 'seeders', 'utils.ts'), '');
      fs.writeFileSync(path.join(root, 'scripts', 'seeders', 'note.md'), '');
      fs.writeFileSync(path.join(root, 'scripts', 'seed-users.ts'), '');
      fs.writeFileSync(path.join(root, 'scripts', 'other.ts'), '');
      const files = collectSeederFiles(root);
      assert.deepEqual(files, ['scripts/seed-users.ts', 'scripts/seeders/utils.ts']);
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  });
});

describe('checkSeedImageHosts — rule logic (injected sources)', () => {
  const base = {
    moduleSource: MODULE,
    configSource: CONFIG(['cdn.azeebo.test', 'storage.azeebo.com', 'picsum.photos']),
    seederSources: {},
  };

  test('green when every registered host is allowlisted and no seeder bypasses', () => {
    assert.deepEqual(checkSeedImageHosts('/unused', base), []);
  });

  test('HOST_NOT_ALLOWLISTED when a registered host is missing from the web config', () => {
    const problems = checkSeedImageHosts('/unused', {
      ...base,
      configSource: CONFIG(['picsum.photos']),
    });
    assert.equal(problems.length, 2); // cdn.azeebo.test + storage.azeebo.com
    for (const p of problems) {
      assert.equal(p.code, 'HOST_NOT_ALLOWLISTED');
      assert.match(p.message, /missing from apps\/web\/next\.config\.js/);
    }
  });

  test('HARDCODED_MEDIA_URL (unregistered) for a raw literal to a foreign host', () => {
    const problems = checkSeedImageHosts('/unused', {
      ...base,
      seederSources: {
        'scripts/seeders/lifestyle-seeder.ts': 'const u = `https://cdn.example.net/music/x.jpg`;',
      },
    });
    assert.equal(problems.length, 1);
    assert.equal(problems[0].code, 'HARDCODED_MEDIA_URL');
    assert.equal(problems[0].line, 1);
    assert.match(problems[0].message, /unregistered host "cdn\.example\.net"/);
  });

  test('HARDCODED_MEDIA_URL (registered) even when the literal names an allowlisted host', () => {
    const problems = checkSeedImageHosts('/unused', {
      ...base,
      seederSources: {
        'scripts/seed-creators.ts': "const u = 'https://picsum.photos/seed/x/200/200';",
      },
    });
    assert.equal(problems.length, 1);
    assert.match(problems[0].message, /registered host "picsum\.photos"/);
  });

  test('link hosts (instagram/youtube) are exempt from the bypass scan', () => {
    const problems = checkSeedImageHosts('/unused', {
      ...base,
      seederSources: {
        'scripts/seeders/creator-seeder.ts':
          "const a = 'https://instagram.com/foo'; const b = 'https://www.youtube.com/watch?v=x'; const c = 'https://youtube.com/@y';",
      },
    });
    assert.deepEqual(problems, []);
  });

  test('the module itself is exempt from the bypass scan (it lists hosts by design)', () => {
    const problems = checkSeedImageHosts('/unused', {
      ...base,
      seederSources: {
        'scripts/seeders/seed-image-hosts.ts': "const doc = 'https://picsum.photos/example';",
      },
    });
    assert.deepEqual(problems, []);
  });

  test('NO_MODULE when the registry file is missing on a fixture tree', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'sih-nomod-'));
    try {
      const problems = checkSeedImageHosts(root, { seederSources: {} });
      assert.equal(problems[0].code, 'NO_MODULE');
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  });
});

describe('hostMatchesAllowlist — Next.js remotePatterns semantics', () => {
  const hosts = [
    'picsum.photos',
    'cdn.azeebo.test',
    '*.azeeboplus.com',
    '**.deep.azeeboplus.tv',
    'storage.azeebo.com',
  ];

  test('exact literal matches itself', () => {
    assert.equal(hostMatchesAllowlist('picsum.photos', hosts), true);
    assert.equal(hostMatchesAllowlist('cdn.azeebo.test', hosts), true);
  });

  test('*.suffix matches exactly one extra label — not the apex, not deeper', () => {
    assert.equal(hostMatchesAllowlist('cdn.azeeboplus.com', hosts), true);
    assert.equal(hostMatchesAllowlist('azeeboplus.com', hosts), false, 'apex NOT covered by *');
    assert.equal(
      hostMatchesAllowlist('a.b.azeeboplus.com', hosts),
      false,
      'two labels NOT covered by *'
    );
  });

  test('**.suffix matches one or more labels — still not the apex', () => {
    assert.equal(hostMatchesAllowlist('a.b.deep.azeeboplus.tv', hosts), true);
    assert.equal(
      hostMatchesAllowlist('deep.azeeboplus.tv', hosts),
      false,
      'apex NOT covered by **'
    );
  });

  test('different TLD does not match a wildcard suffix', () => {
    assert.equal(hostMatchesAllowlist('cdn.azeeboplus.eviltld', hosts), false);
    assert.equal(hostMatchesAllowlist('evilstld.com', hosts), false);
  });
});

describe('collectEmissionFiles — scope', () => {
  test('covers demo-content/database recursively, never scripts-root loose files', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'sih-emit-'));
    try {
      fs.mkdirSync(path.join(root, 'scripts', 'demo-content', 'backups'), { recursive: true });
      fs.mkdirSync(path.join(root, 'scripts', 'database'), { recursive: true });
      fs.writeFileSync(path.join(root, 'scripts', 'demo-content', 'seed.sql'), '');
      fs.writeFileSync(path.join(root, 'scripts', 'demo-content', 'backups', 'rows.csv'), '');
      fs.writeFileSync(path.join(root, 'scripts', 'database', 'seed-all.sh'), '');
      fs.writeFileSync(path.join(root, 'scripts', 'release-tool.sh'), '');
      fs.writeFileSync(path.join(root, 'scripts', 'drift-bot.mjs'), '');
      const files = collectEmissionFiles(root);
      assert.deepEqual(files, [
        path.join('scripts', 'database', 'seed-all.sh'),
        path.join('scripts', 'demo-content', 'backups', 'rows.csv'),
        path.join('scripts', 'demo-content', 'seed.sql'),
      ]);
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  });
});

describe('diffSeederEmissions — rule 3 (injected sources)', () => {
  const SEED_HOSTS = ['cdn.azeebo.test', 'storage.azeebo.com', 'picsum.photos'];
  const ALLOW = [
    'picsum.photos',
    'cdn.azeebo.test',
    'storage.azeebo.com',
    '*.azeeboplus.com',
    'ui-avatars.com',
  ];

  test('flags a seed-data URL to an unallowlisted host', () => {
    const problems = diffSeederEmissions('/unused', {
      seedHosts: SEED_HOSTS,
      allowHosts: ALLOW,
      emissionSources: {
        'scripts/demo-content/deploy.sql':
          "INSERT ... 'https://mystery-host.example/cover.jpg' ...",
      },
    });
    assert.equal(problems.length, 1);
    assert.equal(problems[0].code, 'EMISSION_NOT_ALLOWLISTED');
    assert.equal(problems[0].line, 1);
    assert.match(problems[0].message, /mystery-host\.example/);
  });

  test('*.wildcard coverage passes a single-label subdomain without an exact entry', () => {
    const problems = diffSeederEmissions('/unused', {
      seedHosts: SEED_HOSTS,
      allowHosts: ALLOW,
      emissionSources: {
        'scripts/demo-content/data.sql': "'https://cdn.azeeboplus.com/media/x.jpg'",
      },
    });
    assert.deepEqual(problems, []);
  });

  test('link-shaped URLs (/terms, /live/) are exempt even on unallowlisted hosts', () => {
    const problems = diffSeederEmissions('/unused', {
      seedHosts: SEED_HOSTS,
      allowHosts: ALLOW,
      emissionSources: {
        'scripts/demo-content/settings.sql':
          "'https://azeeboplus.com/terms' 'https://stream.azeebo.com/live/show'",
      },
    });
    assert.deepEqual(problems, []);
  });

  test('a MEDIA url on an unallowlisted host is NOT exempted by the apex-link shape', () => {
    const problems = diffSeederEmissions('/unused', {
      seedHosts: SEED_HOSTS,
      allowHosts: ALLOW,
      emissionSources: {
        'scripts/demo-content/data.sql': "'https://stream.azeebo.com/cover.jpg'",
      },
    });
    assert.equal(problems.length, 1);
  });
});

describe('checkSeedImageHosts — real repo', () => {
  // scripts/__tests__/this.test.mjs → repo root is two levels up.
  const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

  test('green on the actual tree (all module hosts allowlisted, no bypasses)', () => {
    const problems = checkSeedImageHosts(repoRoot);
    assert.deepEqual(problems, []);
  });

  test('discriminates: injecting a bypass into the real repo is caught, and restoring goes green', () => {
    const target = path.join(repoRoot, 'scripts', 'seeders', 'lifestyle-seeder.ts');
    const original = fs.readFileSync(target, 'utf8');
    try {
      fs.writeFileSync(target, original + "\nconst __drift = 'https://evil.example.com/x.jpg';\n");
      const problems = checkSeedImageHosts(repoRoot);
      const hit = problems.find(
        (p) => p.code === 'HARDCODED_MEDIA_URL' && p.file.endsWith('lifestyle-seeder.ts')
      );
      assert.ok(hit, 'injected bypass must be detected');
      assert.match(hit.message, /evil\.example\.com/);
    } finally {
      fs.writeFileSync(target, original);
    }
    assert.deepEqual(checkSeedImageHosts(repoRoot), []);
  });
});
