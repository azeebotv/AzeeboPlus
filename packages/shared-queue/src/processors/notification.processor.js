"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var NotificationProcessor_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationProcessor = void 0;
const bullmq_1 = require("@nestjs/bullmq");
const bullmq_2 = require("bullmq");
const common_1 = require("@nestjs/common");
let NotificationProcessor = NotificationProcessor_1 = class NotificationProcessor extends bullmq_1.WorkerHost {
    constructor() {
        super(...arguments);
        this.logger = new common_1.Logger(NotificationProcessor_1.name);
    }
    async process(job) {
        this.logger.log(`Processing notification job ${job.id}`);
        const { userId, type, title } = job.data;
        switch (type) {
            case 'push':
                await this.sendPushNotification(userId, title);
                break;
            case 'email':
                await this.sendEmail(userId, title);
                break;
            case 'sms':
                await this.sendSms(userId);
                break;
            default:
                this.logger.warn(`Unknown notification type: ${type}`);
        }
        this.logger.log(`Notification sent to user ${userId}: ${title}`);
    }
    async sendPushNotification(userId, title) {
        this.logger.debug(`Sending push notification to ${userId}: ${title}`);
    }
    async sendEmail(userId, subject) {
        this.logger.debug(`Sending email to ${userId}: ${subject}`);
    }
    async sendSms(userId) {
        this.logger.debug(`Sending SMS to ${userId}`);
    }
    onCompleted(job) {
        this.logger.log(`Job ${job.id} completed successfully`);
    }
    onFailed(job, error) {
        this.logger.error(`Job ${job.id} failed: ${error.message}`);
    }
};
exports.NotificationProcessor = NotificationProcessor;
__decorate([
    (0, bullmq_1.OnWorkerEvent)('completed'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [bullmq_2.Job]),
    __metadata("design:returntype", void 0)
], NotificationProcessor.prototype, "onCompleted", null);
__decorate([
    (0, bullmq_1.OnWorkerEvent)('failed'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [bullmq_2.Job, Error]),
    __metadata("design:returntype", void 0)
], NotificationProcessor.prototype, "onFailed", null);
exports.NotificationProcessor = NotificationProcessor = NotificationProcessor_1 = __decorate([
    (0, bullmq_1.Processor)('notifications')
], NotificationProcessor);
