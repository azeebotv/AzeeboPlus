import { Injectable, Logger } from '@nestjs/common';
import { InjectRedis } from '@nestjs-modules/ioredis';
import { Redis } from 'ioredis';

export enum SpoilerLevel {
  NONE = 'none',
  MINOR = 'minor',
  MODERATE = 'moderate',
  MAJOR = 'major',
}

export enum AccessLevel {
  PUBLIC = 'public',
  MEMBERS = 'members',
  PREMIUM = 'premium',
  ADMIN = 'admin',
}

@Injectable()
export class SanitizationService {
  private readonly logger = new Logger(SanitizationService.name);

  constructor(@InjectRedis() private readonly redis: Redis) {}

  private readonly allowedTags = new Set([
    'p',
    'br',
    'strong',
    'em',
    'b',
    'i',
    'u',
    's',
    'ul',
    'ol',
    'li',
    'blockquote',
    'h1',
    'h2',
    'h3',
    'h4',
    'h5',
    'h6',
    'a',
    'span',
  ]);

  private readonly allowedAttributes: Record<string, Set<string>> = {
    a: new Set(['href', 'title']),
    span: new Set(['class']),
  };

  private readonly disallowedProtocols = ['javascript:', 'data:', 'vbscript:'];

  private readonly rateLimitPrefix = 'agbala:rate_limit:';

  sanitizeContent(content: string): string {
    if (!content || typeof content !== 'string') {
      return '';
    }

    let sanitized = content;

    sanitized = this.removeScriptTags(sanitized);
    sanitized = this.removeEventHandlers(sanitized);
    sanitized = this.stripDisallowedTags(sanitized);
    sanitized = this.sanitizeAttributes(sanitized);
    sanitized = this.stripDisallowedProtocols(sanitized);

    return sanitized.trim();
  }

  validateUnlockCode(code: string): boolean {
    if (!code || typeof code !== 'string') {
      this.logValidationFailure('unlock_code', 'empty_or_invalid_type', code);
      return false;
    }

    const trimmed = code.trim();
    const isValid = /^[a-zA-Z0-9]{6,12}$/.test(trimmed);

    if (!isValid) {
      this.logValidationFailure('unlock_code', 'invalid_format', code);
    }

    return isValid;
  }

  validateSpoilerLevel(level: string): SpoilerLevel {
    const normalized = level?.toLowerCase().trim();

    if (!normalized || !Object.values(SpoilerLevel).includes(normalized as SpoilerLevel)) {
      this.logValidationFailure('spoiler_level', 'invalid_value', level);
      return SpoilerLevel.NONE;
    }

    return normalized as SpoilerLevel;
  }

  validateAccessLevel(level: string): AccessLevel {
    const normalized = level?.toLowerCase().trim();

    if (!normalized || !Object.values(AccessLevel).includes(normalized as AccessLevel)) {
      this.logValidationFailure('access_level', 'invalid_value', level);
      return AccessLevel.PUBLIC;
    }

    return normalized as AccessLevel;
  }

  rateLimitKey(userId: string, action: string): string {
    return `${this.rateLimitPrefix}${action}:${userId}`;
  }

  async checkRateLimit(userId: string, action: string, maxRequests: number, windowMs: number): Promise<boolean> {
    const key = this.rateLimitKey(userId, action);
    const windowSec = Math.ceil(windowMs / 1000);

    try {
      const current = await this.redis.incr(key);
      if (current === 1) {
        await this.redis.expire(key, windowSec);
      }

      if (current > maxRequests) {
        this.logValidationFailure('rate_limit', 'exceeded', `${userId}:${action}`);
        return false;
      }

      return true;
    } catch (error) {
      this.logger.warn(`Redis rate limit check failed: ${error}`);
      return true; // Fail open
    }
  }

  private removeScriptTags(content: string): string {
    return content.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  }

  private removeEventHandlers(content: string): string {
    return content.replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, '');
  }

  private stripDisallowedTags(content: string): string {
    const tagPattern = /<\/?([a-zA-Z][a-zA-Z0-9]*)\b[^>]*>/g;

    return content.replace(tagPattern, (match, tagName: string) => {
      if (this.allowedTags.has(tagName.toLowerCase())) {
        return match;
      }
      return '';
    });
  }

  private sanitizeAttributes(content: string): string {
    const tagPattern = /<([a-zA-Z][a-zA-Z0-9]*)((?:\s+[^>]*)?)>/g;

    return content.replace(tagPattern, (match, tagName: string, attributes: string) => {
      const lowerTag = tagName.toLowerCase();
      const allowedAttrs = this.allowedAttributes[lowerTag];

      if (!allowedAttrs || !attributes) {
        if (!allowedAttrs && attributes?.trim()) {
          return `<${tagName}>`;
        }
        return match;
      }

      const sanitizedAttrs = this.sanitizeTagAttributes(attributes, allowedAttrs);
      return `<${tagName}${sanitizedAttrs}>`;
    });
  }

  private sanitizeTagAttributes(attributes: string, allowedAttrs: Set<string>): string {
    const attrPattern = /([a-zA-Z-]+)\s*=\s*["']([^"']*)["']/g;
    let result = '';
    let match;

    while ((match = attrPattern.exec(attributes)) !== null) {
      const [, attrName, attrValue] = match;
      const lowerAttr = attrName.toLowerCase();

      if (allowedAttrs.has(lowerAttr)) {
        result += ` ${attrName}="${this.escapeAttributeValue(attrValue)}"`;
      }
    }

    return result;
  }

  private escapeAttributeValue(value: string): string {
    return value
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  private stripDisallowedProtocols(content: string): string {
    const protocolPattern = /href\s*=\s*["']([^"']*)["']/gi;

    return content.replace(protocolPattern, (match, url: string) => {
      const lowerUrl = url.toLowerCase().trim();

      for (const protocol of this.disallowedProtocols) {
        if (lowerUrl.startsWith(protocol)) {
          this.logValidationFailure('protocol', 'disallowed', url);
          return 'href="#"';
        }
      }

      return match;
    });
  }

  private logValidationFailure(field: string, reason: string, value: unknown): void {
    this.logger.warn(
      `Validation failure: field=${field}, reason=${reason}, value=${this.sanitizeLogValue(value)}`
    );
  }

  private sanitizeLogValue(value: unknown): string {
    if (typeof value !== 'string') {
      return String(value).substring(0, 100);
    }

    return value.replace(/[<>"']/g, '').substring(0, 100);
  }
}
