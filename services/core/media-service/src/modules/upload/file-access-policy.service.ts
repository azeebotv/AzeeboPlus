import { Injectable, ForbiddenException } from '@nestjs/common';
import { FileMetadata } from './s3.service.js';

/**
 * Actor identity as attached by ServiceAuthGuard (gateway-forwarded headers
 * or a verified JWT). `id`/`role` are the fields the policy relies on.
 */
export interface FileActor {
  id: string;
  role?: string;
}

/**
 * Ownership policy for stored file objects.
 *
 * Convention: the uploader's user id rides in the S3 object's user metadata
 * under `userId`. S3-compatible stores normalize user metadata keys to
 * lowercase on HEAD (`userId` → `userid`), so the owner is read
 * case-insensitively. The rules:
 *  - objects without owner metadata (legacy/pre-policy uploads) are treated
 *    as shared and remain accessible to any authenticated actor;
 *  - actors with the `admin` role bypass ownership;
 *  - everyone else may only act on their own objects.
 *
 * The delete route delegates enforcement here, and any other route that
 * touches an owned object (metadata reads, future mutation endpoints)
 * shares the same decision so the rules cannot drift apart.
 */
@Injectable()
export class FileAccessPolicyService {
  /** Owner id from object user metadata, case-insensitive on the key. */
  private ownerIdOf(metadata: FileMetadata | undefined | null): string | undefined {
    const entries = metadata?.metadata;
    if (!entries) return undefined;
    for (const [key, value] of Object.entries(entries)) {
      if (key.toLowerCase() === 'userid') return value;
    }
    return undefined;
  }

  /**
   * Throws ForbiddenException unless `actor` may perform the action on the
   * object described by `metadata`. `action` only shapes the error message;
   * the decision rules are identical for every action.
   */
  assertCanAccess(
    actor: FileActor,
    metadata: FileMetadata | undefined | null,
    action: 'delete' | 'read metadata' | string = 'delete'
  ): void {
    const ownerId = this.ownerIdOf(metadata);
    if (ownerId && ownerId !== actor.id && actor.role !== 'admin') {
      throw new ForbiddenException(
        action === 'delete'
          ? 'You can only delete your own files'
          : `You can only ${action} your own files`
      );
    }
  }

  /** Non-throwing variant for callers that branch on the decision. */
  canAccess(actor: FileActor, metadata: FileMetadata | undefined | null): boolean {
    const ownerId = this.ownerIdOf(metadata);
    return !ownerId || ownerId === actor.id || actor.role === 'admin';
  }
}
