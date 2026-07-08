export interface InitializeResult {
  reference: string;
  authorizationUrl: string;
}

export interface VerifyResult {
  status: string;
  amount: number;
  currency: string;
  paidAt: Date;
  reference: string;
}

export interface RefundResult {
  reference: string;
  amount: number;
  status: string;
}

export interface PaymentProvider {
  initializePayment(amount: number, currency: string, userId: string): Promise<InitializeResult>;
  verifyPayment(reference: string): Promise<VerifyResult>;
  processRefund(transactionId: string, reason: string): Promise<RefundResult>;
  verifyWebhookSignature(rawBody: string, signature: string): Promise<boolean>;
}
