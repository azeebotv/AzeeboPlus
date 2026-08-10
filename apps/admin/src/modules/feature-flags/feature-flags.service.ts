import { Injectable, Inject, Logger } from '@nestjs/common';
import { FeatureFlagService } from '@azeebo/feature-flags';
import { AuditLogService } from '../audit/audit.service';
import { UpdateFeatureFlagDto } from './dto/update-feature-flag.dto';

@Injectable()
export class FeatureFlagsService {
  private readonly logger = new Logger(FeatureFlagsService.name);

  constructor(
    @Inject(FeatureFlagService) private readonly featureFlagService: FeatureFlagService,
    @Inject(AuditLogService) private readonly auditService: AuditLogService
  ) {}

  /** All known global flags: stored records merged with registered defaults
   * (boolean defaultFlags + numeric defaultValues), sorted by key. */
  async getAll() {
    const flags = await this.featureFlagService.getAllFlagsWithDefaults();
    return flags.sort((a, b) => a.key.localeCompare(b.key));
  }

  async update(key: string, dto: UpdateFeatureFlagDto, actorId?: string) {
    const existing = await this.featureFlagService.getFlag(key);

    await this.featureFlagService.setFlag({
      key,
      enabled: dto.enabled ?? existing?.enabled ?? true,
      ...(dto.value !== undefined ? { value: dto.value } : {}),
      ...(dto.description !== undefined ? { description: dto.description } : {}),
      ...(dto.owner !== undefined ? { owner: dto.owner } : {}),
      ...(actorId ? { lastToggledBy: actorId } : {}),
    });

    await this.auditService.log({
      actorId,
      actorType: 'admin',
      action: 'feature_flag.updated',
      targetType: 'feature_flag',
      targetId: key,
      details: { enabled: dto.enabled, value: dto.value },
    });

    this.logger.log(`Feature flag ${key} updated by ${actorId ?? 'unknown'}`);
    return this.featureFlagService.getFlag(key);
  }

  async remove(key: string, actorId?: string) {
    await this.featureFlagService.deleteFlag(key);

    await this.auditService.log({
      actorId,
      actorType: 'admin',
      action: 'feature_flag.deleted',
      targetType: 'feature_flag',
      targetId: key,
    });

    this.logger.log(`Feature flag ${key} deleted by ${actorId ?? 'unknown'}`);
    return { key, removed: true };
  }
}
