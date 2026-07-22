import { UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';

interface AuthenticatedUser {
  id?: string;
  sub?: string;
  email?: string;
  role?: string;
}

interface AuthRequest extends Request {
  user?: AuthenticatedUser;
}

export function resolveActorId(req: AuthRequest): string {
  const actorId = req.user?.id ?? req.user?.sub;
  if (!actorId) {
    throw new UnauthorizedException('Unable to resolve actor identity');
  }
  return actorId;
}
