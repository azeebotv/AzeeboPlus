export interface PaymentProvider {
  initializePayment(amount: number, currency: string, userId: string): Promise<any>;
  verifyPayment(reference: string): Promise<any>;
  processRefund(transactionId: string, reason: string): Promise<any>;
  verifyWebhookSignature(payload: any, signature: string): boolean;
}
