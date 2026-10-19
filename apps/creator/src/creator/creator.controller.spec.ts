import { Test, TestingModule } from '@nestjs/testing';
import { CreatorController } from './creator.controller';
import { CreatorService } from './creator.service';
import { ArchivedContentSweeperService } from './archived-content-sweeper.service';
import { FeatureFlagService, creatorFlags } from '@azeebo/feature-flags';

describe('CreatorController flags endpoint (universe sentinels)', () => {
  let controller: CreatorController;

  const mockFlags = {
    getAllFlagsWithDefaults: jest.fn(),
    isEnabled: jest.fn().mockResolvedValue(false),
    getFlag: jest.fn().mockResolvedValue(null),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CreatorController],
      providers: [
        { provide: CreatorService, useValue: {} },
        { provide: ArchivedContentSweeperService, useValue: {} },
        { provide: FeatureFlagService, useValue: mockFlags },
      ],
    }).compile();
    controller = module.get(CreatorController);
  });

  it('returns creator UI flags plus universe visibility sentinels', async () => {
    mockFlags.getAllFlagsWithDefaults.mockResolvedValue([
      { key: creatorFlags.uploadV2, enabled: true },
      { key: 'universe.comedy.enabled', enabled: false },
      { key: 'universe.reality.enabled', enabled: true },
      { key: 'search_faceted', enabled: true },
    ]);

    const res = (await controller.getFlags()) as {
      success: boolean;
      data: Array<{ key: string; enabled: boolean }>;
    };

    expect(res.success).toBe(true);
    const keys = res.data.map((f) => f.key);
    expect(keys).toContain(creatorFlags.uploadV2);
    expect(keys).toContain('universe.comedy.enabled');
    expect(keys).toContain('universe.reality.enabled');
    expect(keys).not.toContain('search_faceted');
    // Sentinel state is passed through unmodified — the client interprets
    // stored-disabled as hidden.
    expect(res.data.find((f) => f.key === 'universe.comedy.enabled')?.enabled).toBe(false);
  });
});
