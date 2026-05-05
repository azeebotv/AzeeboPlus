import { User } from '@azeebo/shared-types';

export interface UserEntity {
  id: string;
  email: string;
  password: string;
  displayName: string;
  avatar: string | null;
  role: string;
  mfaEnabled: boolean;
  mfaSecret: string | null;
  mfaBackupCodes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface SessionEntity {
  id: string;
  userId: string;
  refreshToken: string;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface OtpEntity {
  id: string;
  userId: string;
  code: string | null;
  expiresAt: Date | null;
  verified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface SocialAccountEntity {
  id: string;
  userId: string;
  provider: string;
  socialId: string;
  displayName: string;
  email: string;
  avatar: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUserData {
  email: string;
  password: string;
  displayName: string;
  avatar?: string;
  role?: string;
}

export interface UpdateUserData {
  email?: string;
  displayName?: string;
  avatar?: string;
  role?: string;
  mfaEnabled?: boolean;
  mfaSecret?: string;
  mfaBackupCodes?: string;
}

export interface CreateSessionData {
  userId: string;
  refreshToken: string;
  expiresAt: Date;
}

export interface AuthResult {
  user: User;
  token: string;
  refreshToken?: string;
  expiresAt?: string;
}
