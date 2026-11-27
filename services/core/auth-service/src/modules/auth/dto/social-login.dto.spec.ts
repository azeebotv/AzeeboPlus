import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { SocialLoginDto, SocialProvider } from './social-login.dto.js';

/**
 * `POST /auth/social/login` takes the credential the *provider* hands the
 * client, and those differ: Google issues an OAuth access token (the only thing
 * the Google verifier reads), while Apple issues an identity token and no access
 * token at all. One unconditional `accessToken` rule therefore rejected every
 * Apple sign-in with a 422 before the service could verify anything.
 *
 * These pin the rule per provider, from both sides.
 */
async function transform(raw: Record<string, unknown>): Promise<SocialLoginDto> {
  return plainToInstance(SocialLoginDto, raw);
}

function fieldsWithErrors(errors: Awaited<ReturnType<typeof validate>>): string[] {
  return errors.map((error) => error.property).sort();
}

describe('SocialLoginDto', () => {
  describe('Apple — identity token only, because that is all Apple issues', () => {
    it('accepts a request carrying just an idToken', async () => {
      const dto = await transform({
        provider: SocialProvider.APPLE,
        idToken: 'header.payload.signature',
      });

      expect(await validate(dto)).toEqual([]);
      expect(dto.accessToken).toBeUndefined();
    });

    it('rejects an Apple request with neither credential', async () => {
      const dto = await transform({ provider: SocialProvider.APPLE });
      expect(fieldsWithErrors(await validate(dto))).toEqual(['idToken']);
    });

    it('rejects an empty idToken', async () => {
      const dto = await transform({ provider: SocialProvider.APPLE, idToken: '' });
      expect(fieldsWithErrors(await validate(dto))).toEqual(['idToken']);
    });

    it('rejects an Apple request that sends only an accessToken', async () => {
      // Not a behaviour we lost: Apple never issues a client access token, so
      // there is no real caller to keep working, and letting one through would
      // mean signing in against a credential the handler cannot verify.
      const dto = await transform({ provider: SocialProvider.APPLE, accessToken: 'opaque' });
      expect(fieldsWithErrors(await validate(dto))).toEqual(['idToken']);
    });
  });

  describe('Google — access token stays mandatory', () => {
    it('accepts a request carrying just an accessToken', async () => {
      const dto = await transform({ provider: SocialProvider.GOOGLE, accessToken: 'ya29.token' });
      expect(await validate(dto)).toEqual([]);
    });

    it('rejects a Google request with only an idToken', async () => {
      // The Google verifier exchanges the access token at Google's tokeninfo
      // endpoint; an idToken alone gives the handler nothing to check.
      const dto = await transform({ provider: SocialProvider.GOOGLE, idToken: 'a.b.c' });
      expect(fieldsWithErrors(await validate(dto))).toEqual(['accessToken']);
    });

    it('rejects an empty accessToken', async () => {
      const dto = await transform({ provider: SocialProvider.GOOGLE, accessToken: '' });
      expect(fieldsWithErrors(await validate(dto))).toEqual(['accessToken']);
    });

    it('does not police a field it will not read', async () => {
      // idToken is not part of the Google path; type-checking it would only
      // reject callers for a value that never reaches a decision.
      const dto = await transform({
        provider: SocialProvider.GOOGLE,
        accessToken: 'ya29.token',
        idToken: 42,
      });
      expect(await validate(dto)).toEqual([]);
    });
  });

  describe('provider is always required and constrained', () => {
    it('rejects an unknown provider', async () => {
      const dto = await transform({ provider: 'github', accessToken: 'x' });
      expect(fieldsWithErrors(await validate(dto))).toEqual(['provider']);
    });

    it('rejects a missing provider', async () => {
      const dto = await transform({ accessToken: 'x' });
      expect(fieldsWithErrors(await validate(dto))).toEqual(['provider']);
    });
  });
});
