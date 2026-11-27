import { readdirSync, readFileSync } from 'fs';
import { join, relative, resolve } from 'path';
import { RequestMethod } from '@nestjs/common';
import { METHOD_METADATA, PATH_METADATA } from '@nestjs/common/constants';

import { SocialAuthController } from './social.controller.js';

/**
 * `/auth/social` used to be owned by two controllers — one in `auth/social`,
 * one in a separate `social-auth` module — each with its own service. Nest
 * resolves overlapping routes by module registration order, so half of one
 * table silently never ran (and the half that did verified Apple tokens
 * without checking the signature).
 *
 * These pin the consolidation from both directions: exactly one controller
 * declares the prefix, and that controller's route inventory is the whole
 * advertised surface — nothing dropped, nothing quietly resurrected elsewhere.
 */

const SRC_ROOT = resolve(__dirname, '../../..');

function controllerFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) return entry.name === 'node_modules' ? [] : controllerFiles(full);
    return entry.name.endsWith('.controller.ts') && !entry.name.endsWith('.spec.ts') ? [full] : [];
  });
}

describe('the auth/social route table', () => {
  it('is declared by exactly one controller', () => {
    const owners = controllerFiles(SRC_ROOT)
      .filter((file) =>
        /@Controller\(\s*['"`]auth\/social['"`]\s*\)/.test(readFileSync(file, 'utf8'))
      )
      .map((file) => relative(SRC_ROOT, file).replace(/\\/g, '/'));

    expect(owners).toEqual(['modules/auth/social/social.controller.ts']);
  });

  it('owns every advertised social route, and no others', () => {
    const prefix = Reflect.getMetadata(PATH_METADATA, SocialAuthController) as string;
    expect(prefix).toBe('auth/social');

    const routes = Object.getOwnPropertyNames(SocialAuthController.prototype)
      .filter((name) => name !== 'constructor')
      .flatMap((name) => {
        const handler = Object.getOwnPropertyDescriptor(SocialAuthController.prototype, name)
          ?.value as object | undefined;
        if (!handler) return [];
        const path = Reflect.getMetadata(PATH_METADATA, handler) as string | undefined;
        const method = Reflect.getMetadata(METHOD_METADATA, handler) as RequestMethod | undefined;
        if (path === undefined || method === undefined) return [];
        return [{ method: RequestMethod[method], path: `${prefix}/${path}` }];
      })
      .sort((a, b) => `${a.path} ${a.method}`.localeCompare(`${b.path} ${b.method}`));

    expect(routes).toEqual([
      { method: 'GET', path: 'auth/social/accounts' },
      { method: 'GET', path: 'auth/social/apple/authorize' },
      { method: 'POST', path: 'auth/social/callback' },
      { method: 'POST', path: 'auth/social/google' },
      { method: 'GET', path: 'auth/social/google/authorize' },
      { method: 'POST', path: 'auth/social/login' },
      { method: 'POST', path: 'auth/social/unlink' },
    ]);
  });
});
