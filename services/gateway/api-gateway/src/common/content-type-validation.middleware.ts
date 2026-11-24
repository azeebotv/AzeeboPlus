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

    // Accept JSON bodies plus the form encodings used for uploads and HTML
    // forms. The middleware's purpose (SEC-006) is to reject requests with an
    // ambiguous or absent body type — not to block file uploads, which send
    // multipart/form-data (browser/RN sets the boundary automatically).
    const isAllowed =
      contentType.includes('application/json') ||
      contentType.includes('multipart/form-data') ||
      contentType.includes('application/x-www-form-urlencoded');

    if (!isAllowed) {
      res.status(400).json({
        statusCode: 400,
        message:
          'Content-Type must be application/json, multipart/form-data, or application/x-www-form-urlencoded',
      });
      return;
    }

    next();
  }
}
