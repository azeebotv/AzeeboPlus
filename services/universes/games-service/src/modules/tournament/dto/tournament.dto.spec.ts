import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';

import { JoinTournamentDto, SubmitScoreDto } from './tournament.dto.js';

const PIPE = { whitelist: true, forbidNonWhitelisted: true };
const fields = (errors: { property: string }[]): string[] => errors.map((e) => e.property).sort();

/**
 * `enterTournament(..., initialScore = 0)`: joining is a score-less action and
 * the service already defaults it. The DTO otherwise required the field.
 */
describe('JoinTournamentDto', () => {
  it('accepts an empty body (join with the default score)', async () => {
    expect(await validate(plainToInstance(JoinTournamentDto, {}), PIPE)).toEqual([]);
  });

  it('accepts an explicit starting score', async () => {
    expect(await validate(plainToInstance(JoinTournamentDto, { initialScore: 12 }), PIPE)).toEqual(
      []
    );
  });

  it('still rejects a negative starting score', async () => {
    const dto = plainToInstance(JoinTournamentDto, { initialScore: -1 });
    expect(fields(await validate(dto, PIPE))).toEqual(['initialScore']);
  });
});

describe('SubmitScoreDto', () => {
  it('still requires a score', async () => {
    expect(fields(await validate(plainToInstance(SubmitScoreDto, {}), PIPE))).toEqual(['score']);
  });
});
