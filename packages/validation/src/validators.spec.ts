import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { IsStrongPassword } from './validators/password.validator';
import { IsValidEmail } from './validators/email.validator';
import { IsValidUsername } from './validators/username.validator';
import { IsValidPhone } from './validators/phone.validator';
import { IsValidUrl } from './validators/url.validator';

class TestPasswordDto {
  @IsStrongPassword()
  password!: string;
}

class TestEmailDto {
  @IsValidEmail()
  email!: string;
}

class TestUsernameDto {
  @IsValidUsername()
  username!: string;
}

class TestPhoneDto {
  @IsValidPhone()
  phone!: string;
}

class TestUrlDto {
  @IsValidUrl()
  url!: string;
}

describe('IsStrongPassword validator', () => {
  it('should accept a strong password', async () => {
    const dto = plainToInstance(TestPasswordDto, { password: 'Str0ng!Pass' });
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should reject password without uppercase', async () => {
    const dto = plainToInstance(TestPasswordDto, { password: 'weak123!pass' });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should reject password without number', async () => {
    const dto = plainToInstance(TestPasswordDto, { password: 'WeakPass!word' });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should reject password without special character', async () => {
    const dto = plainToInstance(TestPasswordDto, { password: 'WeakPass1word' });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should reject short password', async () => {
    const dto = plainToInstance(TestPasswordDto, { password: 'S1!abc' });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should reject non-string value', async () => {
    const dto = plainToInstance(TestPasswordDto, { password: 12345678 });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });
});

describe('IsValidEmail validator', () => {
  it('should accept valid email', async () => {
    const dto = plainToInstance(TestEmailDto, { email: 'user@example.com' });
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should accept email with subdomains', async () => {
    const dto = plainToInstance(TestEmailDto, { email: 'user@mail.example.com' });
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should reject email without @', async () => {
    const dto = plainToInstance(TestEmailDto, { email: 'userexample.com' });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should reject email without TLD', async () => {
    const dto = plainToInstance(TestEmailDto, { email: 'user@example' });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should reject non-string value', async () => {
    const dto = plainToInstance(TestEmailDto, { email: 123 });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });
});

describe('IsValidUsername validator', () => {
  it('should accept valid username', async () => {
    const dto = plainToInstance(TestUsernameDto, { username: 'john_doe' });
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should accept alphanumeric username', async () => {
    const dto = plainToInstance(TestUsernameDto, { username: 'user123' });
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should reject username with spaces', async () => {
    const dto = plainToInstance(TestUsernameDto, { username: 'john doe' });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should reject too short username', async () => {
    const dto = plainToInstance(TestUsernameDto, { username: 'ab' });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should reject username with special characters', async () => {
    const dto = plainToInstance(TestUsernameDto, { username: 'john@doe!' });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });
});

describe('IsValidPhone validator', () => {
  it('should accept valid E.164 phone number', async () => {
    const dto = plainToInstance(TestPhoneDto, { phone: '+2348012345678' });
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should accept US phone number', async () => {
    const dto = plainToInstance(TestPhoneDto, { phone: '+12025551234' });
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should reject phone without country code', async () => {
    const dto = plainToInstance(TestPhoneDto, { phone: '08012345678' });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should reject phone with letters', async () => {
    const dto = plainToInstance(TestPhoneDto, { phone: '+abc1234567890' });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });
});

describe('IsValidUrl validator', () => {
  it('should accept valid HTTPS URL', async () => {
    const dto = plainToInstance(TestUrlDto, { url: 'https://example.com' });
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should accept valid HTTP URL', async () => {
    const dto = plainToInstance(TestUrlDto, { url: 'http://example.com' });
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should reject FTP URL', async () => {
    const dto = plainToInstance(TestUrlDto, { url: 'ftp://example.com' });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should reject invalid URL', async () => {
    const dto = plainToInstance(TestUrlDto, { url: 'not-a-url' });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should reject non-string value', async () => {
    const dto = plainToInstance(TestUrlDto, { url: 123 });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });
});
