import { ApiResponseWrapper } from '@azeebo/shared-types';

interface TicketMeta {
  page: number;
  limit: number;
  total: number;
  totalPages?: number;
}

interface TicketError {
  code: string;
  message: string;
}

export class TicketResponse {
  success: boolean;
  data?: Record<string, unknown>;
  error?: TicketError;
  meta?: TicketMeta;

  static success(data: Record<string, unknown>, meta?: TicketMeta) {
    return ApiResponseWrapper.success({ ticket: data, ...meta });
  }

  static paginated(tickets: Record<string, unknown>[], meta: TicketMeta) {
    return ApiResponseWrapper.paginated(tickets, meta.page, meta.limit, meta.total);
  }
}
