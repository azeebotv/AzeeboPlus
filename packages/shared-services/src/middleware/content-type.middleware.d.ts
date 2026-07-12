import { NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
export declare class ContentTypeMiddleware implements NestMiddleware {
  private readonly logger;
  use(req: Request, res: Response, next: NextFunction): void;
  private isJsonRequest;
}
