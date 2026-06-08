// src/audit/audit.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { promises as fs } from 'fs';
import * as path from 'path';

@Injectable()
export class AuditService {
  private readonly logger = new Logger('Audit');
  private readonly logFile = path.resolve(process.cwd(), 'logs', 'audit.log');

  async log(message: string) {
    const line = `${new Date().toISOString()} - ${message}\n`;
    try {
      await fs.mkdir(path.dirname(this.logFile), { recursive: true });
      await fs.appendFile(this.logFile, line, 'utf8');
    } catch (err) {
      this.logger.error('Failed to write audit log', err);
    }
  }
}
