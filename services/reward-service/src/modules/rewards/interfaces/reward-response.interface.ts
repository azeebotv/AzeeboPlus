export interface RewardAccountData {
  id: string;
  userId: string;
  points: number;
  levelId: string;
  streak: number;
  lastLoginAt: Date;
  lastCheckInAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface LevelData {
  id: string;
  name: string;
  rank: number;
  minPoints: number;
  icon: string | null;
  color: string | null;
}

export interface BadgeData {
  id: string;
  name: string;
  description: string | null;
  icon: string;
  points: number;
}

export interface MissionData {
  id: string;
  title: string;
  description: string | null;
  points: number;
  type: string;
  isActive: boolean;
}

export interface RewardData {
  id: string;
  name: string;
  description: string | null;
  cost: number;
  type: string;
}

export interface RewardResponse {
  success: boolean;
  data?: {
    rewardAccount?: RewardAccountData;
    missions?: MissionData[];
    badges?: BadgeData[];
    streak?: { current: number; lastCheckInAt: Date | null };
    level?: LevelData;
    message?: string;
  };
  error?: {
    code: string;
    message: string;
  };
}
