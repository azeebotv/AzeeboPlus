import { Test, TestingModule } from '@nestjs/testing';
import { ManualRemediationService } from './manual-remediation.service';

describe('ManualRemediationService', () => {
  let service: ManualRemediationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ManualRemediationService],
    }).compile();

    service = module.get<ManualRemediationService>(ManualRemediationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createRequest', () => {
    it('should create a remediation request', async () => {
      const request = await service.createRequest({
        action: 'grant_knowledge',
        requestedBy: 'admin-1',
        targetUserIds: ['user-1'],
        targetKnowledgeUnitIds: ['ku-1'],
        parameters: {},
        justification: 'Test grant',
      });

      expect(request).toBeDefined();
      expect(request.id).toBeDefined();
      expect(request.status).toBe('pending');
      expect(request.action).toBe('grant_knowledge');
      expect(request.requestedBy).toBe('admin-1');
    });

    it('should store the request', async () => {
      const created = await service.createRequest({
        action: 'grant_knowledge',
        requestedBy: 'admin-1',
        targetUserIds: ['user-1'],
        targetKnowledgeUnitIds: ['ku-1'],
        parameters: {},
        justification: 'Test',
      });

      const retrieved = await service.getRequest(created.id);
      expect(retrieved).toEqual(created);
    });
  });

  describe('approveRequest', () => {
    it('should approve a pending request', async () => {
      const created = await service.createRequest({
        action: 'grant_knowledge',
        requestedBy: 'admin-1',
        targetUserIds: ['user-1'],
        targetKnowledgeUnitIds: ['ku-1'],
        parameters: {},
        justification: 'Test',
      });

      const approved = await service.approveRequest(created.id, 'approver-1');

      expect(approved.status).toBe('approved');
    });

    it('should throw for non-existent request', async () => {
      await expect(service.approveRequest('non-existent', 'approver-1')).rejects.toThrow(
        'Request not found'
      );
    });

    it('should throw for already approved request', async () => {
      const created = await service.createRequest({
        action: 'grant_knowledge',
        requestedBy: 'admin-1',
        targetUserIds: ['user-1'],
        targetKnowledgeUnitIds: ['ku-1'],
        parameters: {},
        justification: 'Test',
      });

      await service.approveRequest(created.id, 'approver-1');

      await expect(service.approveRequest(created.id, 'approver-2')).rejects.toThrow(
        'Cannot approve request in approved status'
      );
    });
  });

  describe('executeRequest', () => {
    it('should execute an approved request', async () => {
      const created = await service.createRequest({
        action: 'grant_knowledge',
        requestedBy: 'admin-1',
        targetUserIds: ['user-1', 'user-2'],
        targetKnowledgeUnitIds: ['ku-1'],
        parameters: {},
        justification: 'Test',
      });

      await service.approveRequest(created.id, 'approver-1');
      const executed = await service.executeRequest(created.id);

      expect(executed.status).toBe('executed');
      expect(executed.executedAt).toBeDefined();
      expect(executed.result).toBeDefined();
      expect(executed.result?.success).toBe(true);
    });

    it('should throw for non-existent request', async () => {
      await expect(service.executeRequest('non-existent')).rejects.toThrow('Request not found');
    });

    it('should throw for non-approved request', async () => {
      const created = await service.createRequest({
        action: 'grant_knowledge',
        requestedBy: 'admin-1',
        targetUserIds: ['user-1'],
        targetKnowledgeUnitIds: ['ku-1'],
        parameters: {},
        justification: 'Test',
      });

      await expect(service.executeRequest(created.id)).rejects.toThrow(
        'Cannot execute request in pending status'
      );
    });

    it('should execute grant_knowledge action correctly', async () => {
      const created = await service.createRequest({
        action: 'grant_knowledge',
        requestedBy: 'admin-1',
        targetUserIds: ['user-1'],
        targetKnowledgeUnitIds: ['ku-1', 'ku-2'],
        parameters: {},
        justification: 'Test',
      });

      await service.approveRequest(created.id, 'approver-1');
      const executed = await service.executeRequest(created.id);

      expect(executed.result?.changes.length).toBe(2);
      expect(executed.result?.changes[0].type).toBe('grant');
    });

    it('should execute revoke_knowledge action correctly', async () => {
      const created = await service.createRequest({
        action: 'revoke_knowledge',
        requestedBy: 'admin-1',
        targetUserIds: ['user-1'],
        targetKnowledgeUnitIds: ['ku-1'],
        parameters: {},
        justification: 'Test',
      });

      await service.approveRequest(created.id, 'approver-1');
      const executed = await service.executeRequest(created.id);

      expect(executed.result?.changes.length).toBe(1);
      expect(executed.result?.changes[0].type).toBe('revoke');
    });

    it('should execute merge_units action correctly', async () => {
      const created = await service.createRequest({
        action: 'merge_units',
        requestedBy: 'admin-1',
        targetUserIds: [],
        targetKnowledgeUnitIds: ['ku-1', 'ku-2'],
        parameters: { targetUnitId: 'ku-merged' },
        justification: 'Test',
      });

      await service.approveRequest(created.id, 'approver-1');
      const executed = await service.executeRequest(created.id);

      expect(executed.result?.changes.length).toBe(1);
      expect(executed.result?.changes[0].type).toBe('merge');
    });

    it('should execute split_unit action correctly', async () => {
      const created = await service.createRequest({
        action: 'split_unit',
        requestedBy: 'admin-1',
        targetUserIds: [],
        targetKnowledgeUnitIds: ['ku-original'],
        parameters: { newUnitIds: ['ku-new-1', 'ku-new-2'] },
        justification: 'Test',
      });

      await service.approveRequest(created.id, 'approver-1');
      const executed = await service.executeRequest(created.id);

      expect(executed.result?.changes.length).toBe(1);
      expect(executed.result?.changes[0].type).toBe('split');
    });

    it('should execute bulk_grant action correctly', async () => {
      const created = await service.createRequest({
        action: 'bulk_grant',
        requestedBy: 'admin-1',
        targetUserIds: ['user-1', 'user-2'],
        targetKnowledgeUnitIds: [],
        parameters: { unitIds: ['ku-1', 'ku-2'] },
        justification: 'Test',
      });

      await service.approveRequest(created.id, 'approver-1');
      const executed = await service.executeRequest(created.id);

      expect(executed.result?.success).toBe(true);
      expect(executed.result?.usersAffected).toBe(2);
    });

    it('should execute rebuild_projection action correctly', async () => {
      const created = await service.createRequest({
        action: 'rebuild_projection',
        requestedBy: 'admin-1',
        targetUserIds: ['user-1'],
        targetKnowledgeUnitIds: [],
        parameters: {},
        justification: 'Test',
      });

      await service.approveRequest(created.id, 'approver-1');
      const executed = await service.executeRequest(created.id);

      expect(executed.result?.changes.length).toBe(1);
      expect(executed.result?.changes[0].type).toBe('rebuild_projection');
    });
  });

  describe('rejectRequest', () => {
    it('should reject a pending request', async () => {
      const created = await service.createRequest({
        action: 'grant_knowledge',
        requestedBy: 'admin-1',
        targetUserIds: ['user-1'],
        targetKnowledgeUnitIds: ['ku-1'],
        parameters: {},
        justification: 'Test',
      });

      const rejected = await service.rejectRequest(created.id, 'reviewer-1', 'Not needed');

      expect(rejected.status).toBe('rejected');
    });

    it('should throw for non-existent request', async () => {
      await expect(service.rejectRequest('non-existent', 'reviewer-1', 'Reason')).rejects.toThrow(
        'Request not found'
      );
    });

    it('should throw for already approved request', async () => {
      const created = await service.createRequest({
        action: 'grant_knowledge',
        requestedBy: 'admin-1',
        targetUserIds: ['user-1'],
        targetKnowledgeUnitIds: ['ku-1'],
        parameters: {},
        justification: 'Test',
      });

      await service.approveRequest(created.id, 'approver-1');

      await expect(service.rejectRequest(created.id, 'reviewer-1', 'Reason')).rejects.toThrow(
        'Cannot reject request in approved status'
      );
    });
  });

  describe('getRequest', () => {
    it('should return undefined for non-existent request', async () => {
      const result = await service.getRequest('non-existent');
      expect(result).toBeUndefined();
    });

    it('should return the request by ID', async () => {
      const created = await service.createRequest({
        action: 'grant_knowledge',
        requestedBy: 'admin-1',
        targetUserIds: ['user-1'],
        targetKnowledgeUnitIds: ['ku-1'],
        parameters: {},
        justification: 'Test',
      });

      const result = await service.getRequest(created.id);
      expect(result).toBeDefined();
      expect(result?.action).toBe('grant_knowledge');
    });
  });

  describe('getPendingRequests', () => {
    it('should return empty array when no pending requests', async () => {
      const result = await service.getPendingRequests();
      expect(result).toEqual([]);
    });

    it('should return only pending requests', async () => {
      await service.createRequest({
        action: 'grant_knowledge',
        requestedBy: 'admin-1',
        targetUserIds: ['user-1'],
        targetKnowledgeUnitIds: ['ku-1'],
        parameters: {},
        justification: 'Test',
      });

      const result = await service.getPendingRequests();
      expect(result.length).toBe(1);
    });

    it('should not return approved or rejected requests', async () => {
      const created = await service.createRequest({
        action: 'grant_knowledge',
        requestedBy: 'admin-1',
        targetUserIds: ['user-1'],
        targetKnowledgeUnitIds: ['ku-1'],
        parameters: {},
        justification: 'Test',
      });

      await service.approveRequest(created.id, 'approver-1');

      const result = await service.getPendingRequests();
      expect(result.length).toBe(0);
    });
  });

  describe('getUserRequestHistory', () => {
    it('should return empty array for user with no requests', async () => {
      const result = await service.getUserRequestHistory('user-1');
      expect(result).toEqual([]);
    });

    it('should return requests for a specific user', async () => {
      await service.createRequest({
        action: 'grant_knowledge',
        requestedBy: 'admin-1',
        targetUserIds: ['user-1'],
        targetKnowledgeUnitIds: ['ku-1'],
        parameters: {},
        justification: 'Test',
      });

      await service.createRequest({
        action: 'revoke_knowledge',
        requestedBy: 'admin-2',
        targetUserIds: ['user-1'],
        targetKnowledgeUnitIds: ['ku-1'],
        parameters: {},
        justification: 'Test',
      });

      const result = await service.getUserRequestHistory('admin-1');
      expect(result.length).toBe(1);
      expect(result[0].requestedBy).toBe('admin-1');
    });

    it('should return requests sorted by creation date descending', async () => {
      const first = await service.createRequest({
        action: 'grant_knowledge',
        requestedBy: 'admin-1',
        targetUserIds: ['user-1'],
        targetKnowledgeUnitIds: ['ku-1'],
        parameters: {},
        justification: 'First',
      });

      // Ensure second request has a later timestamp
      await new Promise((resolve) => setTimeout(resolve, 10));

      const second = await service.createRequest({
        action: 'grant_knowledge',
        requestedBy: 'admin-1',
        targetUserIds: ['user-1'],
        targetKnowledgeUnitIds: ['ku-2'],
        parameters: {},
        justification: 'Second',
      });

      // Verify timestamps are different
      expect(second.createdAt.getTime()).toBeGreaterThan(first.createdAt.getTime());

      const result = await service.getUserRequestHistory('admin-1');
      expect(result.length).toBe(2);
      expect(result[0].justification).toBe('Second');
      expect(result[1].justification).toBe('First');
    });
  });
});
