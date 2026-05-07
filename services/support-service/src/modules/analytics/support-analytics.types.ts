export enum SupportAnalyticsEvent {
  TICKET_CREATED = 'support_ticket_created',
  TICKET_UPDATED = 'support_ticket_updated',
  TICKET_ASSIGNED = 'support_ticket_assigned',
  TICKET_ESCALATED = 'support_ticket_escalated',
  TICKET_RESOLVED = 'support_ticket_resolved',
  TICKET_CLOSED = 'support_ticket_closed',

  REFUND_REQUESTED = 'support_refund_requested',
  REFUND_APPROVED = 'support_refund_approved',
  REFUND_REJECTED = 'support_refund_rejected',
  REFUND_PROCESSED = 'support_refund_processed',

  CHARGEBACK_CREATED = 'support_chargeback_created',
  CHARGEBACK_EVIDENCE_SUBMITTED = 'support_chargeback_evidence_submitted',
  CHARGEBACK_WON = 'support_chargeback_won',
  CHARGEBACK_LOST = 'support_chargeback_lost',

  APPEAL_CREATED = 'support_appeal_created',
  APPEAL_APPROVED = 'support_appeal_approved',
  APPEAL_REJECTED = 'support_appeal_rejected',

  TAKEDOWN_REQUESTED = 'support_takedown_requested',
  TAKEDOWN_DECIDED = 'support_takedown_decided',
  CONTENT_REMOVED = 'support_content_removed',
  CONTENT_RESTORED = 'support_content_restored',

  DISPUTE_CREATED = 'support_dispute_created',
  DISPUTE_RESOLVED = 'support_dispute_resolved',

  USER_SUSPENDED = 'support_user_suspended',
  USER_REINSTATED = 'support_user_reinstated',
  SUSPENSION_LIFTED = 'support_suspension_lifted',
}

export interface SupportTicketCreatedEvent {
  ticketId: string;
  category: string;
  priority: string;
  userId: string;
  universe?: string;
}

export interface RefundProcessedEvent {
  refundId: string;
  paymentId: string;
  amount: number;
  currency: string;
  userId: string;
}

export interface UserSuspendedEvent {
  suspensionId: string;
  userId: string;
  reason: string;
  durationDays?: number;
}
