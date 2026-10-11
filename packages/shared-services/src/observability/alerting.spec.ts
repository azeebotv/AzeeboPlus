import {
  AlertingService,
  NotificationChannelAdapter,
} from './alerting.service';

describe('AlertingService', () => {
  let service: AlertingService;

  beforeEach(() => {
    service = new AlertingService();
  });

  it('initializes default alerting rules and escalation policies', () => {
    const rules = service.getRules();
    expect(rules.length).toBeGreaterThan(0);
    const policy = service.getEscalationPolicy('default-escalation');
    expect(policy).toBeDefined();
    expect(policy?.levels.length).toBe(4);
  });

  it('fires alerts and records active state', () => {
    const alert = service.fireAlert('auth-failure-surge', 'Auth failure count: 120');
    expect(alert).not.toBeNull();
    expect(alert?.status).toBe('firing');

    const active = service.getActiveAlerts();
    expect(active.length).toBe(1);
    expect(active[0].id).toBe(alert?.id);
  });

  it('acknowledges and resolves alerts accurately', () => {
    const alert = service.fireAlert('auth-failure-surge', 'Auth failures');
    expect(alert).not.toBeNull();

    const ack = service.acknowledgeAlert(alert!.id, 'oncall-engineer');
    expect(ack).toBe(true);

    const afterAck = service.getActiveAlerts();
    expect(afterAck.length).toBe(0);

    const resolve = service.resolveAlert(alert!.id);
    expect(resolve).toBe(true);

    const stats = service.getStats();
    expect(stats.resolvedAlerts).toBe(1);
    expect(stats.firingAlerts).toBe(0);
  });

  it('delivers to registered notification adapters with retry tracking', async () => {
    const mockSend = jest.fn().mockResolvedValue(true);
    const adapter: NotificationChannelAdapter = {
      channel: 'pagerduty',
      send: mockSend,
    };
    service.registerChannelAdapter(adapter);

    service.fireAlert('auth-failure-surge', 'Critical auth failure');

    // Allow async notification tick
    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(mockSend).toHaveBeenCalled();
    const logs = service.getDeliveryLogs();
    const pdLog = logs.find((l) => l.channel === 'pagerduty');
    expect(pdLog).toBeDefined();
    expect(pdLog?.status).toBe('sent');
  });

  it('deduplicates alerts fired within cooldown window', async () => {
    service.setDeduplicationWindowMs(60000);
    service.fireAlert('auth-failure-surge', 'Identical surge message');
    service.fireAlert('auth-failure-surge', 'Identical surge message');

    await new Promise((resolve) => setTimeout(resolve, 50));

    const logs = service.getDeliveryLogs();
    const dedupLogs = logs.filter((l) => l.status === 'deduplicated');
    expect(dedupLogs.length).toBeGreaterThan(0);
  });
});
