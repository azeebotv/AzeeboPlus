import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it, expect } from 'vitest';

/**
 * next/image throws at render — in every environment — when a `quality` prop is
 * absent from `images.qualities`. Nothing else in the suite sees it because the
 * check lives in the image loader, not in a component test.
 */
const APP_ROOT = join(process.cwd());

function tsxFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) return tsxFiles(full);
    return /\.tsx?$/.test(name) ? [full] : [];
  });
}

describe('next/image quality allowlist', () => {
  it('covers every quality prop used in the app', () => {
    const config = readFileSync(join(APP_ROOT, 'next.config.js'), 'utf8');
    const declared = config.match(/qualities:\s*\[([^\]]*)\]/);
    expect(declared, 'next.config.js must declare images.qualities').not.toBeNull();
    const allowed = new Set(
      declared![1]
        .split(',')
        .map((token) => Number(token.trim()))
        .filter((n) => Number.isFinite(n))
    );

    const offenders: string[] = [];
    for (const file of tsxFiles(join(APP_ROOT, 'src'))) {
      const used = [...readFileSync(file, 'utf8').matchAll(/quality=\{(\d+)\}/g)];
      for (const match of used) {
        if (!allowed.has(Number(match[1]))) {
          offenders.push(`${file.replace(`${APP_ROOT}/`, '')}: quality={${match[1]}}`);
        }
      }
    }

    expect(offenders, `qualities: [${[...allowed].sort((a, b) => a - b).join(', ')}]`).toEqual([]);
  });
});
