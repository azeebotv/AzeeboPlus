import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException } from '@nestjs/common';
import { FileAccessPolicyService, FileActor } from './file-access-policy.service';
import type { FileMetadata } from './s3.service';

/**
 * Unit spec for the shared file-ownership policy.
 *
 * Contract (identical for every action — delete, metadata read, …):
 *  - objects without owner metadata are legacy/shared → allowed;
 *  - the owner is allowed;
 *  - admins bypass ownership;
 *  - any other actor is forbidden, and no error is thrown by canAccess.
 */
describe('FileAccessPolicyService', () => {
  let policy: FileAccessPolicyService;

  const ownedByUser1: FileMetadata = {
    contentType: 'video/mp4',
    contentLength: 1024,
    lastModified: new Date('2026-09-17T09:00:00Z'),
    metadata: { userId: 'user-1' },
  };
  const legacyNoOwner: FileMetadata = { ...ownedByUser1, metadata: undefined };

  const owner: FileActor = { id: 'user-1', role: 'user' };
  const other: FileActor = { id: 'user-2', role: 'user' };
  const admin: FileActor = { id: 'admin-9', role: 'admin' };

  beforeEach(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [FileAccessPolicyService],
    }).compile();

    policy = moduleRef.get<FileAccessPolicyService>(FileAccessPolicyService);
  });

  describe('assertCanAccess', () => {
    it('allows the owner', () => {
      expect(() => policy.assertCanAccess(owner, ownedByUser1, 'delete')).not.toThrow();
    });

    it('allows any actor when the object carries no owner metadata (legacy objects)', () => {
      expect(() => policy.assertCanAccess(other, legacyNoOwner, 'delete')).not.toThrow();
      expect(() => policy.assertCanAccess(other, legacyNoOwner, 'read metadata')).not.toThrow();
    });

    it('allows an admin on an object they do not own', () => {
      expect(() => policy.assertCanAccess(admin, ownedByUser1, 'delete')).not.toThrow();
      expect(() => policy.assertCanAccess(admin, ownedByUser1, 'read metadata')).not.toThrow();
    });

    it('throws Forbidden for a non-owner non-admin', () => {
      expect(() => policy.assertCanAccess(other, ownedByUser1, 'delete')).toThrow(
        new ForbiddenException('You can only delete your own files')
      );
    });

    it('shapes the error message per action for non-delete actions', () => {
      expect(() => policy.assertCanAccess(other, ownedByUser1, 'read metadata')).toThrow(
        new ForbiddenException('You can only read metadata your own files')
      );
    });

    it('treats missing metadata like a legacy object (fail-open on absent owner)', () => {
      expect(() => policy.assertCanAccess(other, null, 'delete')).not.toThrow();
      expect(() => policy.assertCanAccess(other, undefined, 'delete')).not.toThrow();
    });
  });

  describe('canAccess (non-throwing)', () => {
    it('mirrors the throwing variant without raising', () => {
      expect(policy.canAccess(owner, ownedByUser1)).toBe(true);
      expect(policy.canAccess(admin, ownedByUser1)).toBe(true);
      expect(policy.canAccess(other, legacyNoOwner)).toBe(true);
      expect(policy.canAccess(other, ownedByUser1)).toBe(false);
      expect(policy.canAccess(other, null)).toBe(true);
    });
  });
});
