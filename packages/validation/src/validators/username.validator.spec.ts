import { IsValidUsername } from './username.validator';
import { validate } from 'class-validator';

class TestDto {
  @IsValidUsername()
  username!: string;
}

describe('IsValidUsername', () => {
  it('should validate a valid username', async () => {
    const dto = new TestDto();
    dto.username = 'valid_user123';

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should reject username shorter than 3 characters', async () => {
    const dto = new TestDto();
    dto.username = 'ab';

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should reject username longer than 30 characters', async () => {
    const dto = new TestDto();
    dto.username = 'a'.repeat(31);

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should reject username with special characters', async () => {
    const dto = new TestDto();
    dto.username = 'invalid@user';

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should reject username with spaces', async () => {
    const dto = new TestDto();
    dto.username = 'invalid user';

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should accept username with only alphanumeric', async () => {
    const dto = new TestDto();
    dto.username = 'user123';

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });
});
