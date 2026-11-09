import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';

import {
  CreateTicketDto,
  SupportTicketCategory,
  SupportTicketPriority,
  normalizeTicketCategory,
  normalizeTicketPriority,
} from './ticket.dto.js';

const PIPE = { whitelist: true, forbidNonWhitelisted: true };
const fields = (errors: { property: string }[]): string[] => errors.map((e) => e.property).sort();

/**
 * The mobile support screen posts `{ subject, category: 'Payment', message,
 * priority: 'medium' }` — a human label, a lowercase priority and `message`
 * instead of `description`. All three used to be 400s.
 */
describe('CreateTicketDto', () => {
  it('accepts the mobile payload as-is', async () => {
    const dto = plainToInstance(CreateTicketDto, {
      subject: 'Charged twice',
      category: 'Payment',
      message: 'I was charged twice for the same bundle.',
      priority: 'medium',
    });

    expect(await validate(dto, PIPE)).toEqual([]);
    expect(dto.category).toBe(SupportTicketCategory.REFUND);
    expect(dto.priority).toBe(SupportTicketPriority.MEDIUM);
  });

  it('accepts the admin/web payload that uses description and enum values', async () => {
    const dto = plainToInstance(CreateTicketDto, {
      subject: 'Refund request',
      category: SupportTicketCategory.REFUND,
      description: 'Please refund the duplicate charge.',
      priority: SupportTicketPriority.HIGH,
    });

    expect(await validate(dto, PIPE)).toEqual([]);
    expect(dto.description).toBeDefined();
  });

  it('still rejects a ticket with neither description nor message', async () => {
    const dto = plainToInstance(CreateTicketDto, {
      subject: 'No body',
      category: 'Payment',
    });

    expect(fields(await validate(dto, PIPE))).toEqual(['description', 'message']);
  });

  it('still rejects an empty subject', async () => {
    const dto = plainToInstance(CreateTicketDto, {
      subject: '',
      category: 'Payment',
      message: 'x',
    });

    expect(fields(await validate(dto, PIPE))).toEqual(['subject']);
  });

  it('routes an unrecognised label to GENERAL rather than rejecting the ticket', () => {
    expect(normalizeTicketCategory('Something New')).toBe(SupportTicketCategory.GENERAL);
    expect(normalizeTicketCategory('technical')).toBe(SupportTicketCategory.GENERAL);
    expect(normalizeTicketCategory('Creator')).toBe(SupportTicketCategory.PAYOUT_DISPUTE);
  });

  it('maps urgent priority onto the stored CRITICAL enum', () => {
    expect(normalizeTicketPriority('urgent')).toBe(SupportTicketPriority.CRITICAL);
    expect(normalizeTicketPriority('LOW')).toBe(SupportTicketPriority.LOW);
  });
});
