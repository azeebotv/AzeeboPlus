import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { SelectableRole, SelectRoleDto } from './select-role.dto.js';

/**
 * The request pipe runs `transform: true` before validation, so what the
 * service sees is the transformed value. These pin that contract, which is the
 * half a service-level test cannot reach.
 */
async function transform(raw: Record<string, unknown>): Promise<SelectRoleDto> {
  return plainToInstance(SelectRoleDto, raw, { exposeDefaultValues: true });
}

describe('SelectRoleDto', () => {
  it.each(['user', 'creator'])('accepts the self-selectable role %s', async (role) => {
    const dto = await transform({ role });
    expect(await validate(dto)).toEqual([]);
    expect(dto.role).toBe(role as SelectableRole);
  });

  it('maps the retired `both` spelling onto creator, because creator already includes viewer access', async () => {
    const dto = await transform({ role: 'both' });

    expect(dto.role).toBe(SelectableRole.CREATOR);
    expect(await validate(dto)).toEqual([]);
  });

  it('rejects a role that grants more than self-service should, and says what is allowed', async () => {
    const dto = await transform({ role: 'admin' });
    const errors = await validate(dto);

    expect(errors).toHaveLength(1);
    expect(errors[0].constraints?.isEnum).toContain('creator already includes viewer access');
  });
});
