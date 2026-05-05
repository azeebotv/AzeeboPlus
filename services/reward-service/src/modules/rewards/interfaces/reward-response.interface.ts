export interface RewardResponse {
  success: boolean;
  data?: {
    rewardAccount?: any;
    missions?: any[];
    badges?: any[];
    streak?: any;
    level?: any;
    message?: string;
  };
  error?: {
    code: string;
    message: string;
  };
}
