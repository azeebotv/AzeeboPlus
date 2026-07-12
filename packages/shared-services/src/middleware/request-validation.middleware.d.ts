import { NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
export declare class RequestValidationMiddleware implements NestMiddleware {
  private readonly logger;
  private readonly MAX_REQUEST_SIZE;
  use(req: Request, res: Response, next: NextFunction): void;
  private validateContentLength;
}
