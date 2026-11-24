import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { SocialAuthCallbackDto } from './social-auth.dto.js';

/**
 * Apple's `form_post` returns two different bodies: a success body carrying
 * `code`, and a failure body carrying `error` with **no** `code`. The failure
 * body used to be rejected by the validation pipe before the controller could
 * read `error`, so a cancelled sign-in surfaced as a malformed request.
 *
 * These pin the conditional rule from both sides: lenient where the provider
 * legitimately omits a code, strict everywhere else.
 */
async function transform(raw: Record<string, unknown>): Promise<SocialAuthCallbackDto> {
  return plainToInstance(SocialAuthCallbackDto, raw);
}

function fieldsWithErrors(errors: Awaited<ReturnType<typeof validate>>): string[] {
  return errors.map((error) => error.property).sort();
}

describe('SocialAuthCallbackDto', () => {
  describe('provider failure callbacks', () => {
    it('accepts an Apple cancellation that carries error and no code', async () => {
      const dto = await transform({ state: 'state-abc', error: 'user_cancelled_authorize' });

      expect(await validate(dto)).toEqual([]);
      expect(dto.code).toBeUndefined();
    });

    it('accepts access_denied with no code too', async () => {
      const dto = await transform({ state: 'state-abc', error: 'access_denied' });
      expect(await validate(dto)).toEqual([]);
    });
  });

  describe('success callbacks stay strict', () => {
    it('accepts a normal Google callback', async () => {
      const dto = await transform({ state: 'state-abc', code: 'auth-code' });
      expect(await validate(dto)).toEqual([]);
    });

    it('rejects a callback with no code and no error', async () => {
      const dto = await transform({ state: 'state-abc' });
      const errors = await validate(dto);

      expect(fieldsWithErrors(errors)).toEqual(['code']);
      expect(errors[0].constraints).toHaveProperty('isNotEmpty');
    });

    it('rejects an empty code when no error is present', async () => {
      const dto = await transform({ state: 'state-abc', code: '' });
      expect(fieldsWithErrors(await validate(dto))).toEqual(['code']);
    });

    it('rejects a non-string code', async () => {
      const dto = await transform({ state: 'state-abc', code: 42 });
      expect(fieldsWithErrors(await validate(dto))).toEqual(['code']);
    });
  });

  describe('state is always required', () => {
    it('rejects a callback with no state', async () => {
      const dto = await transform({ code: 'auth-code' });
      expect(fieldsWithErrors(await validate(dto))).toContain('state');
    });

    it('rejects an empty state even when an error is present', async () => {
      const dto = await transform({ state: '', error: 'access_denied' });
      expect(fieldsWithErrors(await validate(dto))).toContain('state');
    });
  });

  describe('the error escape hatch is not widened by falsy values', () => {
    it('still requires code when error is an empty string', async () => {
      // An empty `error` is not a provider failure, so it must not excuse a
      // missing code — otherwise `?error=` becomes a validation bypass.
      const dto = await transform({ state: 'state-abc', error: '' });
      expect(fieldsWithErrors(await validate(dto))).toEqual(['code']);
    });
  });
});
