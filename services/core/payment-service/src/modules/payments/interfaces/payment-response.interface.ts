export interface PaymentResponse {
  success: boolean;
  data: unknown;
}

export interface InitializePaymentResponse extends PaymentResponse {
  data: {
    paymentId: string;
    provider: string;
    checkoutUrl: string;
    reference: string;
    amount: number;
    currency: string;
    status: 'pending' | 'completed' | 'failed';
    createdAt: string;
    /** New checkout flow (payment_new_checkout_flow): 30-minute session expiry. */
    expiresAt?: string;
  };
}

export interface VerifyPaymentResponse extends PaymentResponse {
  data: {
    paymentId: string;
    provider: string;
    reference: string;
    status: 'pending' | 'completed' | 'failed';
    amount: number;
    currency: string;
    paidAt?: string;
    transactionId?: string;
    metadata?: Record<string, unknown>;
  };
}

export interface PaymentMethodsResponse extends PaymentResponse {
  data: {
    id: string;
    name: string;
    type: 'card' | 'bank' | 'mobile_money' | 'ussd';
    logo?: string;
    supportedCurrencies: string[];
  }[];
}

export interface TransactionHistoryResponse extends PaymentResponse {
  data: {
    transactions: {
      id: string;
      type: 'payment' | 'refund' | 'transfer';
      amount: number;
      currency: string;
      status: 'pending' | 'completed' | 'failed';
      description: string;
      createdAt: string;
    }[];
    total: number;
    page: number;
    limit: number;
  };
}
