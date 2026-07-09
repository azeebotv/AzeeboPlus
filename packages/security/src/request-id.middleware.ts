import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';

@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
  private readonly logger = new Logger(RequestIdMiddleware.name);

  use(req: Request, res: Response, next: NextFunction): void {
    const raw = (req.headers['x-request-id'] as string) || '';
    const sanitized = /^[a-zA-Z0-9\-_]{1,255}$/.test(raw) ? raw.substring(0, 255) : randomUUID();
    req.headers['x-request-id'] = sanitized;
    res.setHeader('X-Request-ID', sanitized);
    this.logger.debug(`Request ID: ${sanitized}`);
    next();
  }
}
