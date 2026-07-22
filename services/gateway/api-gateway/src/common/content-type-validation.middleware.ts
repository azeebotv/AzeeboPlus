import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

const BODY_METHODS = ['POST', 'PUT', 'PATCH'];

@Injectable()
export class ContentTypeValidationMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction): void {
    if (!BODY_METHODS.includes(req.method)) {
      return next();
    }

    const contentType = req.headers['content-type'];

    if (!contentType) {
      res.status(400).json({
        statusCode: 400,
        message: 'Content-Type header is required for POST/PUT/PATCH requests',
      });
      return;
    }

    if (!contentType.includes('application/json')) {
      res.status(400).json({
        statusCode: 400,
        message: 'Content-Type must be application/json',
      });
      return;
    }

    next();
  }
}
