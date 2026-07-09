import { IsStrongPassword } from './password.validator';
import { validate } from 'class-validator';

class TestDto {
  @IsStrongPassword()
  password!: string;
}

describe('IsStrongPassword', () => {
  it('should validate a strong password', async () => {
    const dto = new TestDto();
    dto.password = 'Str0ng!Pass';

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should reject password without uppercase', async () => {
    const dto = new TestDto();
    dto.password = 'str0ng!pass';

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should reject password without lowercase', async () => {
    const dto = new TestDto();
    dto.password = 'STR0NG!PASS';

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should reject password without number', async () => {
    const dto = new TestDto();
    dto.password = 'Strong!Pass';

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should reject password without special character', async () => {
    const dto = new TestDto();
    dto.password = 'Str0ngPass';

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should reject password shorter than 8 characters', async () => {
    const dto = new TestDto();
    dto.password = 'St0!p';

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should reject non-string values', async () => {
    const dto = new TestDto();
    dto.password = 12345 as any;

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });
});
