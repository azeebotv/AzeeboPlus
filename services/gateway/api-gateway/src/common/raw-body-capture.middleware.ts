import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

/**
 * Captures the raw request body for content types that no body-parser owns
 * (multipart/form-data, binary streams) BEFORE it is forwarded upstream.
 *
 * Why: the gateway runs with bodyParser:false and registers only json and
 * urlencoded parsers. Multipart bodies (file uploads) arrive unparsed, so
 * req.body is an empty object — and JSON.stringify of that empty object is
 * what used to be forwarded upstream, corrupting every proxied upload with
 * "Multipart: Unexpected end of form" downstream.
 *
 * The capture is buffered (up to RAW_BODY_LIMIT) and attached as
 * (req as RawBodyRequest).rawBody; CircuitBreakerProxyService forwards it
 * verbatim. Streams larger than the limit are rejected with 413 rather than
 * partially buffered — the per-service upload caps are smaller.
 */
export interface RawBodyRequest extends Request {
  rawBody?: Buffer;
}

@Injectable()
export class RawBodyCaptureMiddleware implements NestMiddleware {
  private readonly logger = new Logger(RawBodyCaptureMiddleware.name);
  private static readonly RAW_BODY_LIMIT = 600 * 1024 * 1024; // 600MB — above the portal's 500MB upload cap

  use(req: RawBodyRequest, res: Response, next: NextFunction) {
    const contentType = req.headers['content-type'] || '';
    const needsCapture = contentType.includes('multipart/form-data');

    // Only safe/GET methods and non-multipart bodies flow through untouched —
    // json/urlencoded are parsed by the registered body parsers and forwarded
    // through the structured-body path.
    if (!needsCapture || req.method === 'GET' || req.method === 'HEAD') {
      return next();
    }

    const declaredLength = Number(req.headers['content-length'] || 0);
    if (declaredLength > RawBodyCaptureMiddleware.RAW_BODY_LIMIT) {
      this.logger.warn(`Raw body too large (${declaredLength} bytes) [${req.method} ${req.path}]`);
      res.status(413).json({
        success: false,
        message: 'Payload too large',
      });
      return;
    }

    const chunks: Buffer[] = [];
    let size = 0;
    let aborted = false;

    req.on('data', (chunk: Buffer) => {
      if (aborted) return;
      size += chunk.length;
      if (size > RawBodyCaptureMiddleware.RAW_BODY_LIMIT) {
        aborted = true;
        this.logger.warn(
          `Raw body exceeded limit mid-stream (${size} bytes) [${req.method} ${req.path}]`
        );
        if (!res.headersSent) {
          res.status(413).json({ success: false, message: 'Payload too large' });
        }
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });

    req.on('end', () => {
      if (aborted) return;
      req.rawBody = Buffer.concat(chunks);
      next();
    });

    req.on('error', (err: Error) => {
      if (aborted) return;
      aborted = true;
      this.logger.warn(`Raw body capture failed: ${err.message} [${req.method} ${req.path}]`);
      if (!res.headersSent) {
        res.status(400).json({ success: false, message: 'Failed to read request body' });
      }
    });
  }
}
