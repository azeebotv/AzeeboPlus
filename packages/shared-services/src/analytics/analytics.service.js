"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var AnalyticsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnalyticsService = exports.AnalyticsEvents = void 0;
const common_1 = require("@nestjs/common");
exports.AnalyticsEvents = {
    // Authentication Events
    AUTH_LOGIN_VIEWED: 'auth_login_viewed',
    AUTH_LOGIN_SUBMITTED: 'auth_login_submitted',
    AUTH_LOGIN_COMPLETED: 'auth_login_completed',
    AUTH_LOGIN_FAILED: 'auth_login_failed',
    AUTH_REGISTER_VIEWED: 'auth_register_viewed',
    AUTH_REGISTER_SUBMITTED: 'auth_register_submitted',
    AUTH_REGISTER_COMPLETED: 'auth_register_completed',
    AUTH_REGISTER_FAILED: 'auth_register_failed',
    AUTH_LOGOUT_COMPLETED: 'auth_logout_completed',
    // Payment Events
    PAYMENT_VIEWED: 'payment_viewed',
    PAYMENT_SUBMITTED: 'payment_submitted',
    PAYMENT_COMPLETED: 'payment_completed',
    PAYMENT_FAILED: 'payment_failed',
    REFUND_REQUESTED: 'refund_requested',
    REFUND_COMPLETED: 'refund_completed',
    REFUND_FAILED: 'refund_failed',
    // Content Events
    CONTENT_VIEWED: 'content_viewed',
    CONTENT_LIKED: 'content_liked',
    CONTENT_SHARED: 'content_shared',
    CONTENT_COMMENTED: 'content_commented',
    // Creator Events
    CREATOR_TIPPED: 'creator_tipped',
    CREATOR_SUBSCRIBED: 'creator_subscribed',
    CREATOR_UNSUBSCRIBED: 'creator_unsubscribed',
    // User Events
    USER_PROFILE_VIEWED: 'user_profile_viewed',
    USER_PROFILE_UPDATED: 'user_profile_updated',
    USER_SETTINGS_VIEWED: 'user_settings_viewed',
    USER_SETTINGS_UPDATED: 'user_settings_updated',
    // Universe Events
    UNIVERSE_ENTERED: 'universe_entered',
    UNIVERSE_EXITED: 'universe_exited',
    UNIVERSE_CREATED: 'universe_created',
    // Challenge Events
    CHALLENGE_VIEWED: 'challenge_viewed',
    CHALLENGE_SUBMITTED: 'challenge_submitted',
    CHALLENGE_WON: 'challenge_won',
    CHALLENGE_LOST: 'challenge_lost',
    // Reward Events
    REWARD_CLAIMED: 'reward_claimed',
    REWARD_EARNED: 'reward_earned',
    // Wallet Events
    WALLET_VIEWED: 'wallet_viewed',
    WALLET_DEPOSITED: 'wallet_deposited',
    WALLET_WITHDRAWN: 'wallet_withdrawn',
    WALLET_TRANSFERRED: 'wallet_transferred',
};
let AnalyticsService = AnalyticsService_1 = class AnalyticsService {
    logger = new common_1.Logger(AnalyticsService_1.name);
    track(event) {
        this.validateEventName(event.name);
        const eventData = {
            ...event,
            timestamp: event.timestamp.toISOString(),
        };
        this.logger.debug(`Tracking analytics event: ${event.name}`, eventData);
        this.sendToAnalytics(eventData);
    }
    trackView(action, userId) {
        const eventName = `${action}_viewed`;
        this.track({
            name: eventName,
            userId,
            timestamp: new Date(),
        });
    }
    trackSubmit(action, userId, data) {
        const eventName = `${action}_submitted`;
        this.track({
            name: eventName,
            userId,
            timestamp: new Date(),
            properties: data,
        });
    }
    trackCompleted(action, userId, result) {
        const eventName = `${action}_completed`;
        this.track({
            name: eventName,
            userId,
            timestamp: new Date(),
            properties: result,
        });
    }
    trackFailed(action, userId, error) {
        const eventName = `${action}_failed`;
        this.track({
            name: eventName,
            userId,
            timestamp: new Date(),
            properties: { error },
        });
    }
    validateEventName(name) {
        const snakeCaseRegex = /^[a-z][a-z0-9_]*$/;
        if (!snakeCaseRegex.test(name)) {
            this.logger.warn(`Event name "${name}" is not in snake_case format. Please use lowercase letters, numbers, and underscores only.`);
        }
        const maxLength = 100;
        if (name.length > maxLength) {
            this.logger.warn(`Event name "${name}" exceeds ${maxLength} characters.`);
        }
    }
    sendToAnalytics(event) {
        try {
            // In production, this would send to your analytics provider
            // e.g., Segment, Mixpanel, Amplitude, or internal analytics service
            this.logger.debug('[Analytics]', JSON.stringify(event));
        }
        catch (error) {
            this.logger.error('Failed to send analytics event:', error);
        }
    }
};
exports.AnalyticsService = AnalyticsService;
exports.AnalyticsService = AnalyticsService = AnalyticsService_1 = __decorate([
    (0, common_1.Injectable)()
], AnalyticsService);
