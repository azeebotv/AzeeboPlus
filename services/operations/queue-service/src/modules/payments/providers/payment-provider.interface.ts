export interface PaymentProvider {
  initializePayment(amount: number, currency: string, userId: string): Promise<Record<string, unknown>>;
  verifyPayment(reference: string): Promise<Record<string, unknown>>;
  processRefund(transactionReference: string, reason: string): Promise<Record<string, unknown>>;
  processPayout(amount: number, recipient: string, reference: string): Promise<Record<string, unknown>>;
  verifyWebhookSignature(payload: Record<string, unknown>, signature: string): Promise<boolean>;
}
