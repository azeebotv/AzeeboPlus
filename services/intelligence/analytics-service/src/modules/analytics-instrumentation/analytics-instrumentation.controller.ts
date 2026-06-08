import { Controller, Post, Body, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import {
  AnalyticsInstrumentationService,
  AnalyticsEvent,
  EVENT_NAMES,
} from './analytics-instrumentation.service';

@ApiTags('Analytics Instrumentation')
@Controller('instrumentation')
export class AnalyticsInstrumentationController {
  constructor(private readonly analyticsInstrumentationService: AnalyticsInstrumentationService) {}

  @Post('track')
  @ApiOperation({ summary: 'Track a single event' })
  async track(@Body() event: AnalyticsEvent): Promise<{ id: string }> {
    return this.analyticsInstrumentationService.track(event);
  }

  @Post('track-batch')
  @ApiOperation({ summary: 'Track multiple events' })
  async trackBatch(@Body() events: AnalyticsEvent[]): Promise<{ ingested: number }> {
    return this.analyticsInstrumentationService.trackBatch(events);
  }

  @Post('screen-view')
  @ApiOperation({ summary: 'Track screen view' })
  async trackScreenView(
    @Body()
    body: {
      userId: string;
      sessionId: string;
      screenName: string;
      platform: 'web' | 'mobile' | 'tablet';
      metadata?: Record<string, unknown>;
    }
  ): Promise<{ id: string }> {
    return this.analyticsInstrumentationService.trackScreenView(
      body.userId,
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
      userId: string;
      sessionId: string;
      contentId: string;
      contentType: string;
      universe: string;
      platform: 'web' | 'mobile' | 'tablet';
    }
  ): Promise<{ id: string }> {
    return this.analyticsInstrumentationService.trackContentImpression(
      body.userId,
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
      userId: string;
      sessionId: string;
      eventType: 'viewed' | 'initiated' | 'success' | 'failed';
      amount: number;
      currency: string;
      paymentMethod?: string;
      errorMessage?: string;
    }
  ): Promise<{ id: string }> {
    return this.analyticsInstrumentationService.trackPayment(
      body.userId,
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
      userId: string;
      eventType: 'earned' | 'redeemed';
      rewardType: string;
      amount: number;
      universe?: string;
    }
  ): Promise<{ id: string }> {
    return this.analyticsInstrumentationService.trackReward(
      body.userId,
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
      userId: string;
      sessionId: string;
      eventType: 'started' | 'completed' | 'answered';
      gameId: string;
      metadata?: Record<string, unknown>;
    }
  ): Promise<{ id: string }> {
    return this.analyticsInstrumentationService.trackGameEvent(
      body.userId,
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
      userId: string;
      eventType: 'placed' | 'won' | 'lost';
      marketId: string;
      stake?: number;
      payout?: number;
    }
  ): Promise<{ id: string }> {
    return this.analyticsInstrumentationService.trackPrediction(
      body.userId,
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
      userId: string;
      contentId: string;
      contentType: string;
      platform: string;
      shareMethod: string;
    }
  ): Promise<{ id: string }> {
    return this.analyticsInstrumentationService.trackShare(
      body.userId,
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
