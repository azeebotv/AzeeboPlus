export interface PaymentProvider {
  initializePayment(amount: number, currency: string, userId: string): Promise<any>;
  verifyPayment(reference: string): Promise<any>;
  processRefund(transactionReference: string, reason: string): Promise<any>;
  processPayout(amount: number, recipient: string, reference: string): Promise<any>;
  verifyWebhookSignature(payload: any, signature: string): Promise<boolean>;
}
