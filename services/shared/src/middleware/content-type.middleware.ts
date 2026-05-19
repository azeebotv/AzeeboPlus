import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class ContentTypeMiddleware implements NestMiddleware {
  private readonly logger = new Logger(ContentTypeMiddleware.name);

  use(req: Request, res: Response, next: NextFunction) {
    if (this.isJsonRequest(req)) {
      const contentType = req.headers['content-type'];
      if (contentType && !contentType.includes('application/json')) {
        this.logger.warn(`Invalid content-type: ${contentType}`);
        res.status(415).json({
          success: false,
          message: 'Unsupported media type',
          supportedTypes: ['application/json'],
        });
        return;
      }
    }
    next();
  }

  private isJsonRequest(req: Request): boolean {
    const methodsWithBody = ['POST', 'PUT', 'PATCH'];
    return methodsWithBody.includes(req.method);
  }
}
