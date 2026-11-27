import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';

import { CreateNeighborhoodPlaceDto } from './guides-admin.dto.js';

const PIPE = { whitelist: true, forbidNonWhitelisted: true };
const fields = (errors: { property: string }[]): string[] => errors.map((e) => e.property).sort();

/**
 * `guides-admin.service` writes `rating: dto.rating ?? 0`, so the fallback only
 * runs when the field is absent — which the DTO used to forbid.
 */
describe('CreateNeighborhoodPlaceDto', () => {
  it('accepts a place with no rating (defaults to 0 in the service)', async () => {
    const dto = plainToInstance(CreateNeighborhoodPlaceDto, {
      name: 'Nok by Alara',
      category: 'restaurant',
    });

    expect(await validate(dto, PIPE)).toEqual([]);
  });

  it('accepts an explicit rating', async () => {
    const dto = plainToInstance(CreateNeighborhoodPlaceDto, {
      name: 'Nok by Alara',
      category: 'restaurant',
      rating: 4.5,
    });

    expect(await validate(dto, PIPE)).toEqual([]);
  });

  it('still rejects a negative rating', async () => {
    const dto = plainToInstance(CreateNeighborhoodPlaceDto, {
      name: 'Nok by Alara',
      category: 'restaurant',
      rating: -1,
    });

    expect(fields(await validate(dto, PIPE))).toEqual(['rating']);
  });
});
