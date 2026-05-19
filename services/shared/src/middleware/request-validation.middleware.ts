import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class RequestValidationMiddleware implements NestMiddleware {
  private readonly logger = new Logger(RequestValidationMiddleware.name);
  private readonly MAX_REQUEST_SIZE = 10 * 1024 * 1024; // 10MB

  use(req: Request, res: Response, next: NextFunction) {
    this.validateContentLength(req, res, next);
  }

  private validateContentLength(req: Request, res: Response, next: NextFunction) {
    const contentLength = req.headers['content-length'];
    if (contentLength) {
      const length = parseInt(contentLength);
      if (length > this.MAX_REQUEST_SIZE) {
        this.logger.warn(`Request size exceeds limit: ${length} bytes`);
        res.status(413).json({
          success: false,
          message: 'Request entity too large',
          maxSize: `${this.MAX_REQUEST_SIZE / (1024 * 1024)}MB`,
        });
        return;
      }
    }
    next();
  }
}
