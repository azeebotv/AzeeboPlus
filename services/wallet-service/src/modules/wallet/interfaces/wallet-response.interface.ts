export interface WalletResponse {
  success: boolean;
  data?: {
    balance: number;
    bonusBalance: number;
    promoBalance: number;
    totalBalance: number;
    currency: string;
  };
  error?: {
    code: string;
    message: string;
  };
}
