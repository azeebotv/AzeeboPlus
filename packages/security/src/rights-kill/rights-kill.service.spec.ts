import { RightsKillService } from './rights-kill.service';

describe('RightsKillService', () => {
  let service: RightsKillService;

  beforeEach(() => {
    RightsKillService.clearStore();
    service = new RightsKillService();
  });

  describe('createOrder', () => {
    it('should create a rights kill order', async () => {
      const result = await service.createOrder(
        'content-123',
        'single-title',
        'legal-takedown',
        'legal-team'
      );

      expect(result.id).toBeDefined();
      expect(result.status).toBe('pending');
      expect(result.scope).toBe('single-title');
      expect(result.trigger).toBe('legal-takedown');
    });

    it('should include audit trail entry', async () => {
      const result = await service.createOrder(
        'content-123',
        'single-title',
        'legal-takedown',
        'legal-team'
      );

      expect(result.auditTrail.length).toBe(1);
      expect(result.auditTrail[0].action).toBe('order_created');
    });
  });

  describe('activateOrder', () => {
    it('should activate and propagate policy', async () => {
      const order = await service.createOrder(
        'content-123',
        'single-title',
        'legal-takedown',
        'legal-team'
      );

      const activated = await service.activateOrder(order.id, 'ops-lead');
      expect(activated.status).toBe('active');
      expect(activated.cdnPurgeStatus).toBe('completed');
      expect(activated.apiBlockStatus).toBe('active');
      expect(activated.searchExclusionStatus).toBe('active');
    });

    it('should add audit trail entries', async () => {
      const order = await service.createOrder(
        'content-123',
        'single-title',
        'legal-takedown',
        'legal-team'
      );

      await service.activateOrder(order.id, 'ops-lead');
      const updated = await service.getOrder(order.id);

      expect(updated.auditTrail.length).toBe(3); // created + activated + propagated
    });
  });

  describe('isBlocked', () => {
    it('should return true for blocked content', async () => {
      const order = await service.createOrder(
        'content-123',
        'single-title',
        'legal-takedown',
        'legal-team'
      );
      await service.activateOrder(order.id, 'ops-lead');

      expect(await service.isBlocked('content-123')).toBe(true);
    });

    it('should return false for unblocked content', async () => {
      expect(await service.isBlocked('content-456')).toBe(false);
    });
  });

  describe('revokeOrder', () => {
    it('should revoke an active order', async () => {
      const order = await service.createOrder(
        'content-123',
        'single-title',
        'legal-takedown',
        'legal-team'
      );
      await service.activateOrder(order.id, 'ops-lead');

      const revoked = await service.revokeOrder(order.id, 'legal-lead');
      expect(revoked.status).toBe('revoked');
    });

    it('should reject revoking non-active order', async () => {
      const order = await service.createOrder(
        'content-123',
        'single-title',
        'legal-takedown',
        'legal-team'
      );
      await expect(service.revokeOrder(order.id, 'legal-lead')).rejects.toThrow(
        'only revoke active'
      );
    });
  });

  describe('getActiveOrders', () => {
    it('should return only active orders', async () => {
      const o1 = await service.createOrder('c1', 'single-title', 'legal-takedown', 'admin');
      await service.createOrder('c2', 'single-title', 'content-violation', 'admin');

      await service.activateOrder(o1.id, 'ops');
      // o2 remains pending

      const active = await service.getActiveOrders();
      expect(active.length).toBe(1);
      expect(active[0].id).toBe(o1.id);
    });
  });
});
