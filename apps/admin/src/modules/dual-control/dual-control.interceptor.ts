import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Inject,
  HttpStatus,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable, of } from 'rxjs';
import { Request, Response } from 'express';
import { DualControlService } from './dual-control.service';
import { REQUIRE_DUAL_CONTROL_KEY, DualControlMetadata } from './require-dual-control.decorator';
import { resolveActorId } from '../../common/resolve-actor-id';

@Injectable()
export class DualControlInterceptor implements NestInterceptor {
  constructor(
    private readonly reflector: Reflector,
    @Inject(DualControlService) private readonly dualControlService: DualControlService
  ) {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
    const metadata = this.reflector.get<DualControlMetadata>(
      REQUIRE_DUAL_CONTROL_KEY,
      context.getHandler()
    );

    if (!metadata) {
      return next.handle();
    }

    const http = context.switchToHttp();
    const req = http.getRequest<Request>();
    const res = http.getResponse<Response>();

    // If request has already been validated and executed by the second approver
    const isApprovedExecution =
      req.headers['x-dual-control-approved'] === 'true' ||
      req.headers['x-internal-approval-token'] !== undefined;

    if (isApprovedExecution) {
      return next.handle();
    }

    const actorId = resolveActorId(req);
    const amount = Number(req.body?.amount ?? 0);

    // If a monetary threshold is set, only enforce dual control above threshold
    if (metadata.thresholdAmount && amount > 0 && amount < metadata.thresholdAmount) {
      return next.handle();
    }

    const description =
      metadata.description ||
      `${req.method} ${req.originalUrl || req.url} - ${req.body?.reason || 'Administrative action'}`;

    const targetUserIds = req.params?.id
      ? [req.params.id]
      : Array.isArray(req.body?.userIds)
      ? req.body.userIds
      : req.body?.userId
      ? [req.body.userId]
      : [];

    // Intercept and register dual-control request
    const pendingRequest = await this.dualControlService.create(
      {
        actionType: metadata.actionType,
        description,
        amount: amount > 0 ? amount : undefined,
        currency: (req.body?.currency as string) || metadata.currency || 'NGN',
        targetUserIds: targetUserIds.length > 0 ? targetUserIds : undefined,
      },
      actorId
    );

    res.status(HttpStatus.ACCEPTED);
    return of({
      success: true,
      pendingApproval: true,
      statusCode: HttpStatus.ACCEPTED,
      requestId: pendingRequest.id,
      actionType: pendingRequest.actionType,
      message:
        'Action intercepted and submitted for dual-control authorization. A second administrator must approve before execution.',
    });
  }
}
