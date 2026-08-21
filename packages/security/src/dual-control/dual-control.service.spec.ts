import { DualControlService } from './dual-control.service';

describe('DualControlService', () => {
  let service: DualControlService;

  beforeEach(() => {
    service = new DualControlService();
  });

  describe('createRequest', () => {
    it('should create a dual-control request', async () => {
      const result = await service.createRequest(
        'large-refund',
        'admin-1',
        'payment',
        'pay-123',
        { amount: 50000, reason: 'Customer complaint' },
      );

      expect(result.id).toBeDefined();
      expect(result.status).toBe('pending');
      expect(result.requiredApprovals).toBe(2);
    });

    it('should set correct threshold for different actions', async () => {
      const refund = await service.createRequest('large-refund', 'a', 'p', '1', {});
      expect(refund.requiredApprovals).toBe(2);

      const pub = await service.createRequest('scheduled-publication', 'a', 'c', '1', {});
      expect(pub.requiredApprovals).toBe(1);
    });
  });

  describe('approve', () => {
    it('should approve and track approvals', async () => {
      const req = await service.createRequest(
        'large-refund',
        'admin-1',
        'payment',
        'pay-123',
        { amount: 50000 },
      );

      const approved = await service.approve(req.id, 'admin-2', 'senior-admin');
      expect(approved.approvals.length).toBe(1);
      expect(approved.status).toBe('pending'); // Needs 2 approvals
    });

    it('should mark approved when threshold met', async () => {
      const req = await service.createRequest(
        'large-refund',
        'admin-1',
        'payment',
        'pay-123',
        { amount: 50000 },
      );

      await service.approve(req.id, 'admin-2', 'senior-admin');
      await service.approve(req.id, 'admin-3', 'security-lead');

      const final = await service.getRequest(req.id);
      expect(final.status).toBe('approved');
    });

    it('should reject self-approval', async () => {
      const req = await service.createRequest(
        'large-refund',
        'admin-1',
        'payment',
        'pay-123',
        { amount: 50000 },
      );

      await expect(
        service.approve(req.id, 'admin-1', 'admin'),
      ).rejects.toThrow('cannot approve their own');
    });

    it('should reject duplicate approval', async () => {
      const req = await service.createRequest(
        'large-refund',
        'admin-1',
        'payment',
        'pay-123',
        { amount: 50000 },
      );

      await service.approve(req.id, 'admin-2', 'senior-admin');
      await expect(
        service.approve(req.id, 'admin-2', 'senior-admin'),
      ).rejects.toThrow('already approved');
    });
  });

  describe('reject', () => {
    it('should reject a request', async () => {
      const req = await service.createRequest(
        'large-refund',
        'admin-1',
        'payment',
        'pay-123',
        { amount: 50000 },
      );

      const rejected = await service.reject(req.id, 'admin-2', 'Not justified');
      expect(rejected.status).toBe('rejected');
    });
  });

  describe('execute', () => {
    it('should execute an approved request', async () => {
      const req = await service.createRequest(
        'large-refund',
        'admin-1',
        'payment',
        'pay-123',
        { amount: 50000 },
      );

      await service.approve(req.id, 'admin-2', 'senior-admin');
      await service.approve(req.id, 'admin-3', 'security-lead');

      const executed = await service.execute(req.id, 'admin-2');
      expect(executed.status).toBe('executed');
      expect(executed.executedBy).toBe('admin-2');
    });

    it('should reject executing non-approved request', async () => {
      const req = await service.createRequest(
        'large-refund',
        'admin-1',
        'payment',
        'pay-123',
        { amount: 50000 },
      );

      await expect(service.execute(req.id, 'admin-2')).rejects.toThrow('must be approved');
    });
  });
});
