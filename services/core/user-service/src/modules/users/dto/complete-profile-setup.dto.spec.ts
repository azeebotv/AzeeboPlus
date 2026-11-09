import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';

import { CompleteProfileSetupDto } from './complete-profile-setup.dto.js';

/**
 * Both setup screens hit the same endpoint with different shapes:
 * `apps/mobile` posts only `{ interests }` on the interests step, and
 * `apps/web` posts `avatarUrl` for the uploaded image. The service handles
 * both (displayName falls back to the email prefix, avatar falls back to
 * avatarUrl); before this the pipe rejected both requests.
 */
const PIPE = { whitelist: true, forbidNonWhitelisted: true };

const fields = (errors: { property: string }[]): string[] => errors.map((e) => e.property).sort();

describe('CompleteProfileSetupDto', () => {
  it('accepts the mobile interests-only step', async () => {
    const dto = plainToInstance(CompleteProfileSetupDto, { interests: ['comedy'] });
    expect(await validate(dto, PIPE)).toEqual([]);
  });

  it('accepts the web payload with the avatarUrl name', async () => {
    const dto = plainToInstance(CompleteProfileSetupDto, {
      displayName: 'Jane',
      fullName: 'Jane Doe',
      username: 'jane',
      avatarUrl: 'https://cdn.example.com/a.png',
      email: 'a@b.com',
      interests: ['comedy'],
    });

    expect(await validate(dto, PIPE)).toEqual([]);
    expect(dto.avatar).toBeUndefined();
    expect(dto.avatarUrl).toBe('https://cdn.example.com/a.png');
  });

  it('still bounds displayName when it is supplied', async () => {
    const dto = plainToInstance(CompleteProfileSetupDto, { displayName: 'x'.repeat(51) });
    expect(fields(await validate(dto, PIPE))).toEqual(['displayName']);
  });

  it('still rejects an unknown role', async () => {
    const dto = plainToInstance(CompleteProfileSetupDto, { role: 'admin' });
    expect(fields(await validate(dto, PIPE))).toEqual(['role']);
  });
});
