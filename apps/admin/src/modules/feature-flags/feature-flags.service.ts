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
      ...(dto.rolloutPercentage !== undefined ? { rolloutPercentage: dto.rolloutPercentage } : {}),
      ...(dto.userIds !== undefined ? { userIds: dto.userIds } : {}),
      ...(dto.staleAfter !== undefined ? { staleAfter: dto.staleAfter } : {}),
      ...(actorId ? { lastToggledBy: actorId } : {}),
    });

    await this.auditService.log({
      actorId,
      actorType: 'admin',
      action: 'feature_flag.updated',
      targetType: 'feature_flag',
      targetId: key,
      details: {
        enabled: dto.enabled,
        value: dto.value,
        rolloutPercentage: dto.rolloutPercentage,
        userIds: dto.userIds,
        staleAfter: dto.staleAfter,
      },
    });

    this.logger.log(`Feature flag ${key} updated by ${actorId ?? 'unknown'}`);
    return this.featureFlagService.getFlag(key);
  }

  /** Flags whose `staleAfter` date has passed — candidates for removal.
   * Also exposes `staleNotifiedAt` (sweep dedupe) + description/value so the
   * stale sweep and the admin UI can act on them. */
  async getStaleFlags() {
    const flags = await this.getAll();
    const now = Date.now();
    return flags
      .filter((f) => f.staleAfter && new Date(f.staleAfter).getTime() <= now)
      .map((f) => ({
        key: f.key,
        enabled: f.enabled,
        staleAfter: f.staleAfter,
        staleNotifiedAt: f.staleNotifiedAt,
        owner: f.owner,
        description: f.description,
        value: f.value,
        lastToggledBy: f.lastToggledBy,
      }));
  }

  /**
   * Batch-removes flags whose `staleAfter` has passed, archiving each one
   * (snapshot + `feature_flag.deleted` audit) before the hard delete — the
   * same per-flag path as `remove()`, so the batch never loses history.
   *
   * `keys` optionally restricts the batch to a confirmed subset (e.g. the list
   * the admin UI showed in the confirm dialog); a key that isn't actually past
   * its staleAfter is still skipped. One failing key never aborts the batch.
   */
  async pruneStaleFlags(actorId?: string, keys?: string[]) {
    const stale = await this.getStaleFlags();
    const keySet = keys ? new Set(keys) : null;
    const targets = stale.filter((f) => !keySet || keySet.has(f.key));

    const removed: Array<{ key: string; archived: boolean }> = [];
    const skipped: string[] = [];
    for (const flag of targets) {
      try {
        removed.push(await this.remove(flag.key, actorId));
      } catch (error) {
        skipped.push(flag.key);
        this.logger.warn(`Failed to prune stale flag ${flag.key}: ${(error as Error).message}`);
      }
    }

    this.logger.log(
      `Pruned ${removed.length} stale flag(s)${skipped.length ? `, skipped ${skipped.length}` : ''} by ${actorId ?? 'unknown'}`
    );
    return {
      success: true,
      data: {
        removedCount: removed.length,
        removedKeys: removed.map((r) => r.key),
        archivedCount: removed.filter((r) => r.archived).length,
        skipped,
      },
    };
  }

  /**
   * Undo path for remove/prune: replays the flag's archived snapshot from the
   * audit log (the `feature_flag.deleted` entry with `archivedSnapshot`),
   * re-creating the stored flag exactly as it was before deletion. The
   * snapshot's `archivedAt` stamp is dropped (it belongs to the deletion, not
   * the flag). Refuses to clobber a flag that already exists, and reports a
   * clean miss when no archive exists.
   */
  async restore(key: string, actorId?: string) {
    const existing = await this.featureFlagService.getFlag(key);
    if (existing) {
      return { key, restored: false, reason: 'already-exists' };
    }

    const result = await this.auditService.getLogs(
      { action: 'feature_flag.deleted', targetType: 'feature_flag', targetId: key },
      1,
      1
    );
    const deletedLog = result.logs[0] as
      | (Record<string, unknown> & { details?: Record<string, unknown> })
      | undefined;
    const snapshot = deletedLog?.details?.archivedSnapshot as Record<string, unknown> | undefined;
    if (!snapshot) {
      return { key, restored: false, reason: 'no-archive' };
    }

    const { archivedAt: _archivedAt, ...flag } = snapshot;
    await this.featureFlagService.setFlag(
      flag as unknown as Parameters<FeatureFlagService['setFlag']>[0]
    );

    await this.auditService.log({
      actorId,
      actorType: 'admin',
      action: 'feature_flag.restored',
      targetType: 'feature_flag',
      targetId: key,
      details: {
        restoredFromSnapshotAt: snapshot.archivedAt,
        restoredAt: new Date().toISOString(),
      },
    });

    this.logger.log(`Feature flag ${key} restored by ${actorId ?? 'unknown'}`);
    return { key, restored: true as const, enabled: flag.enabled === true };
  }

  /** Batch undo: restores several deleted flags from their archived snapshots. */
  async restoreMany(keys: string[], actorId?: string) {
    const restored: Array<{ key: string; enabled?: boolean }> = [];
    const skipped: Array<{ key: string; reason: string }> = [];
    for (const key of keys) {
      const res = await this.restore(key, actorId);
      if (res.restored) {
        restored.push({ key, enabled: res.enabled });
      } else {
        skipped.push({ key, reason: res.reason });
      }
    }
    return {
      success: true,
      data: { restoredCount: restored.length, restored, skipped },
    };
  }

  /** Recently deleted flags (most recent first) with their archive availability. */
  async getRecentlyDeleted(limit = 20) {
    const { logs } = await this.auditService.getLogs(
      { action: 'feature_flag.deleted', targetType: 'feature_flag' },
      1,
      limit
    );
    return logs.map((log) => {
      const entry = log as Record<string, unknown>;
      const details = (entry.details as Record<string, unknown> | undefined) ?? {};
      const snapshot = details.archivedSnapshot as Record<string, unknown> | undefined;
      return {
        key: entry.targetId,
        deletedAt: entry.createdAt,
        deletedBy: entry.actorId,
        archived: Boolean(snapshot),
        enabled: snapshot?.enabled ?? undefined,
      };
    });
  }

  async remove(key: string, actorId?: string) {
    // Archive the flag's last-known state in the audit log BEFORE the row is
    // gone — removal is a hard delete from the store, so this snapshot is the
    // only history that survives (never lose who toggled what + when).
    let snapshot: Record<string, unknown> | undefined;
    try {
      const flag = await this.featureFlagService.getFlag(key);
      if (flag) {
        snapshot = {
          enabled: flag.enabled,
          value: flag.value,
          rolloutPercentage: flag.rolloutPercentage,
          userIds: flag.userIds,
          staleAfter: flag.staleAfter,
          owner: flag.owner,
          lastToggledBy: flag.lastToggledBy,
          archivedAt: new Date().toISOString(),
        };
      }
    } catch (error) {
      this.logger.warn(
        `Failed to snapshot flag ${key} before removal: ${(error as Error).message}`
      );
    }

    await this.featureFlagService.deleteFlag(key);

    await this.auditService.log({
      actorId,
      actorType: 'admin',
      action: 'feature_flag.deleted',
      targetType: 'feature_flag',
      targetId: key,
      details: snapshot ? { archivedSnapshot: snapshot } : undefined,
    });

    this.logger.log(`Feature flag ${key} deleted by ${actorId ?? 'unknown'}`);
    return { key, removed: true, archived: Boolean(snapshot) };
  }
}
