import { SetMetadata } from '@nestjs/common';
import { DualControlActionType } from './dual-control.service';

export const REQUIRE_DUAL_CONTROL_KEY = 'REQUIRE_DUAL_CONTROL';

export interface DualControlMetadata {
  actionType: DualControlActionType;
  description?: string;
  thresholdAmount?: number;
  currency?: string;
}

export const RequireDualControl = (options: DualControlMetadata) =>
  SetMetadata(REQUIRE_DUAL_CONTROL_KEY, options);
