export interface WalletBalanceData {
  balance: number;
  bonusBalance: number;
  promoBalance: number;
  totalBalance: number;
  currency: string;
}

export interface TransactionData {
  id: string;
  walletId: string;
  type: string;
  amount: number;
  status: string;
  description: string | null;
  reference: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface WalletSummaryData extends WalletBalanceData {
  recentTransactions: TransactionData[];
}

export interface FundingData {
  transactionId: string;
  amount: number;
  status: string;
  message: string;
}

export interface RedeemRewardData {
  message: string;
  pointsRedeemed: number;
  amountAdded: number;
  newBonusBalance: number;
}

export interface BonusCreditData {
  transactionId: string;
  amount: number;
  reason: string;
  newBonusBalance: number;
}

export interface PromoCreditData {
  transactionId: string;
  amount: number;
  promoCode: string;
  expiresAt: string;
  newPromoBalance: number;
}

export interface AuditTrailData {
  walletId: string;
  startDate: string;
  endDate: string;
  totalTransactions: number;
  transactions: TransactionData[];
}

export interface WalletResponse {
  success: boolean;
  data?:
    | WalletBalanceData
    | TransactionData[]
    | WalletSummaryData
    | FundingData
    | RedeemRewardData
    | BonusCreditData
    | PromoCreditData
    | AuditTrailData
    | BankAccountData[]
    | WithdrawalMethodData[]
    | WithdrawalPricingData
    | WalletPricingData
    | PaymentMethodData[]
    | Record<string, unknown>
    | { message: string };
  error?: {
    code: string;
    message: string;
  };
}

export interface BankAccountData {
  id: string;
  bankName: string;
  accountNumber: string;
  accountName: string;
  isDefault: boolean;
  createdAt: Date;
}

export interface WithdrawalMethodData {
  id: string;
  name: string;
  processingTime: string;
  fee: number;
}

export interface WithdrawalPricingData {
  minimumAmount: number;
  maximumAmount: number;
  fees: Array<{ method: string; percentage: number; flat: number; min: number; max: number }>;
}

export interface WalletPricingData {
  minimumDeposit: number;
  maximumDeposit: number;
  fees: Array<{ method: string; percentage: number; flat: number }>;
}

export interface PaymentMethodData {
  id: string;
  name: string;
  enabled: boolean;
}
