import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { LoginDto } from './login.dto.js';
import { RegisterDto } from './register.dto.js';

/**
 * Sign-in is an authentication attempt, not a registration: the password policy
 * belongs to `RegisterDto`. A length rule on `LoginDto` rejected credentials the
 * service can verify — `CreateUserDto` allows 6 characters, so an account with
 * one could never reach `bcrypt.compare`, and the failed attempt never counted
 * toward the lockout.
 */
async function transform<T extends object>(
  cls: new () => T,
  raw: Record<string, unknown>
): Promise<T> {
  return plainToInstance(cls, raw);
}

function fieldsWithErrors(errors: Awaited<ReturnType<typeof validate>>): string[] {
  return errors.map((error) => error.property).sort();
}

describe('LoginDto', () => {
  it('accepts a password shorter than the registration policy, so the service can verify it', async () => {
    const dto = await transform(LoginDto, { email: 'legacy@example.com', password: 'abc123' });
    expect(await validate(dto)).toEqual([]);
  });

  it('accepts the 8-character seed password', async () => {
    const dto = await transform(LoginDto, { email: 'admin@azeeboplus.com', password: 'Demo123!' });
    expect(await validate(dto)).toEqual([]);
  });

  it('still rejects an empty password rather than hashing it', async () => {
    const dto = await transform(LoginDto, { email: 'user@example.com', password: '' });
    expect(fieldsWithErrors(await validate(dto))).toEqual(['password']);
  });

  it('still rejects a non-string password', async () => {
    const dto = await transform(LoginDto, { email: 'user@example.com', password: 12345678 });
    expect(fieldsWithErrors(await validate(dto))).toEqual(['password']);
  });

  it('still requires an email', async () => {
    const dto = await transform(LoginDto, { password: 'abc123' });
    expect(fieldsWithErrors(await validate(dto))).toContain('email');
  });

  it('the policy it stopped enforcing is still enforced where it belongs', async () => {
    // Same password that must now reach bcrypt at login must never be accepted
    // at registration — otherwise this change would have dropped the rule.
    const dto = await transform(RegisterDto, {
      email: 'new@example.com',
      password: 'abc123',
      displayName: 'New User',
    });
    expect(fieldsWithErrors(await validate(dto))).toEqual(['password']);
  });
});
