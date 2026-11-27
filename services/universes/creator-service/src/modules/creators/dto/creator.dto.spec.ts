import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';

import { UpdateTierDto } from './creator.dto.js';

const PIPE = { whitelist: true, forbidNonWhitelisted: true };

/**
 * `POST /creators/subscribe/:creatorId` does `body.tier || 'free'`, and the web
 * subscribe button sends no body at all. The DTO typed the field optional but
 * omitted `@IsOptional()`, so the pipe rejected the request before the default
 * could apply.
 */
describe('UpdateTierDto', () => {
  it('accepts an empty body so the handler default ("free") applies', async () => {
    const dto = plainToInstance(UpdateTierDto, {});
    expect(await validate(dto, PIPE)).toEqual([]);
  });

  it('accepts an explicit tier', async () => {
    const dto = plainToInstance(UpdateTierDto, { tier: 'gold' });
    expect(await validate(dto, PIPE)).toEqual([]);
  });

  it('still rejects a non-string tier', async () => {
    const dto = plainToInstance(UpdateTierDto, { tier: 42 });
    const errors = await validate(dto, PIPE);
    expect(errors.map((e) => e.property)).toEqual(['tier']);
  });
});
