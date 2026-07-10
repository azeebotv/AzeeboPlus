import { Controller, Post, Body, Get, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { RateLimitGuard, RateLimit } from '@azeebo/security';
import {
  AnalyticsInstrumentationService,
  AnalyticsEvent,
  EVENT_NAMES,
} from './analytics-instrumentation.service';

interface AuthenticatedRequest extends Request {
  user: { sub: string; id: string };
}

@ApiTags('Analytics Instrumentation')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), RateLimitGuard)
@Controller('instrumentation')
export class AnalyticsInstrumentationController {
  constructor(private readonly analyticsInstrumentationService: AnalyticsInstrumentationService) {}

  @Post('track')
  @ApiOperation({ summary: 'Track a single event' })
  @RateLimit(100, 60000)
  async track(
    @Body() event: AnalyticsEvent,
    @Req() req: AuthenticatedRequest
  ): Promise<{ id: string }> {
    return this.analyticsInstrumentationService.track({
      ...event,
      userId: req.user?.sub ?? event.userId,
    });
  }

  @Post('track-batch')
  @ApiOperation({ summary: 'Track multiple events' })
  @RateLimit(100, 60000)
  async trackBatch(
    @Body() events: AnalyticsEvent[],
    @Req() req: AuthenticatedRequest
  ): Promise<{ ingested: number }> {
    const userId = req.user?.sub;
    const sanitized = userId ? events.map((e) => ({ ...e, userId })) : events;
    return this.analyticsInstrumentationService.trackBatch(sanitized);
  }

  @Post('screen-view')
  @ApiOperation({ summary: 'Track screen view' })
  async trackScreenView(
    @Body()
    body: {
      sessionId: string;
      screenName: string;
      platform: 'web' | 'mobile' | 'tablet';
      metadata?: Record<string, unknown>;
    },
    @Req() req: AuthenticatedRequest
  ): Promise<{ id: string }> {
    return this.analyticsInstrumentationService.trackScreenView(
      req.user?.sub,
      body.sessionId,
      body.screenName,
      body.platform,
      body.metadata
    );
  }

  @Post('content-impression')
  @ApiOperation({ summary: 'Track content impression' })
  async trackContentImpression(
    @Body()
    body: {
      sessionId: string;
      contentId: string;
      contentType: string;
      universe: string;
      platform: 'web' | 'mobile' | 'tablet';
    },
    @Req() req: AuthenticatedRequest
  ): Promise<{ id: string }> {
    return this.analyticsInstrumentationService.trackContentImpression(
      req.user?.sub,
      body.sessionId,
      body.contentId,
      body.contentType,
      body.universe,
      body.platform
    );
  }

  @Post('payment')
  @ApiOperation({ summary: 'Track payment event' })
  async trackPayment(
    @Body()
    body: {
      sessionId: string;
      eventType: 'viewed' | 'initiated' | 'success' | 'failed';
      amount: number;
      currency: string;
      paymentMethod?: string;
      errorMessage?: string;
    },
    @Req() req: AuthenticatedRequest
  ): Promise<{ id: string }> {
    return this.analyticsInstrumentationService.trackPayment(
      req.user?.sub,
      body.sessionId,
      body.eventType,
      body.amount,
      body.currency,
      body.paymentMethod,
      body.errorMessage
    );
  }

  @Post('reward')
  @ApiOperation({ summary: 'Track reward event' })
  async trackReward(
    @Body()
    body: {
      eventType: 'earned' | 'redeemed';
      rewardType: string;
      amount: number;
      universe?: string;
    },
    @Req() req: AuthenticatedRequest
  ): Promise<{ id: string }> {
    return this.analyticsInstrumentationService.trackReward(
      req.user?.sub,
      body.eventType,
      body.rewardType,
      body.amount,
      body.universe
    );
  }

  @Post('game')
  @ApiOperation({ summary: 'Track game event' })
  async trackGameEvent(
    @Body()
    body: {
      sessionId: string;
      eventType: 'started' | 'completed' | 'answered';
      gameId: string;
      metadata?: Record<string, unknown>;
    },
    @Req() req: AuthenticatedRequest
  ): Promise<{ id: string }> {
    return this.analyticsInstrumentationService.trackGameEvent(
      req.user?.sub,
      body.sessionId,
      body.eventType,
      body.gameId,
      body.metadata
    );
  }

  @Post('prediction')
  @ApiOperation({ summary: 'Track prediction event' })
  async trackPrediction(
    @Body()
    body: {
      eventType: 'placed' | 'won' | 'lost';
      marketId: string;
      stake?: number;
      payout?: number;
    },
    @Req() req: AuthenticatedRequest
  ): Promise<{ id: string }> {
    return this.analyticsInstrumentationService.trackPrediction(
      req.user?.sub,
      body.eventType,
      body.marketId,
      body.stake,
      body.payout
    );
  }

  @Post('share')
  @ApiOperation({ summary: 'Track share event' })
  async trackShare(
    @Body()
    body: {
      contentId: string;
      contentType: string;
      platform: string;
      shareMethod: string;
    },
    @Req() req: AuthenticatedRequest
  ): Promise<{ id: string }> {
    return this.analyticsInstrumentationService.trackShare(
      req.user?.sub,
      body.contentId,
      body.contentType,
      body.platform,
      body.shareMethod
    );
  }

  @Get('event-names')
  @ApiOperation({ summary: 'Get available event names' })
  getEventNames(): typeof EVENT_NAMES {
    return EVENT_NAMES;
  }
}
