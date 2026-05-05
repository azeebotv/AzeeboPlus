export interface MfaResponse {
  success: boolean;
  data?: {
    secret?: string;
    qrCode?: string;
    backupCodes?: string[];
    mfaEnabled: boolean;
  };
  error?: {
    code: string;
    message: string;
  };
}
