import { Module } from '@nestjs/common';
import { DeviceLinkController } from './device-link.controller.js';
import { DeviceLinkService } from './device-link.service.js';
import { PrismaService } from '../database/prisma.service.js';
import { AuthModule } from '../auth/auth.module.js';
import { AuditModule } from '../audit/audit.module.js';

/**
 * RFC 8628-style device authorization grant for TV (10-foot) devices.
 *
 * The TV displays a short code and polls; the user confirms the code on a
 * phone/browser at azeebo.tv/link while signed in; the next TV poll returns
 * the session tokens once.
 */
@Module({
  imports: [AuthModule, AuditModule],
  controllers: [DeviceLinkController],
  providers: [DeviceLinkService, PrismaService],
  exports: [DeviceLinkService],
})
export class DeviceLinkModule {}
