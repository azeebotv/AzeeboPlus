import { Logger } from '@nestjs/common';
import Redis from 'ioredis';

// ============================================================================
// Event Schema Registry (TAA §80)
// ============================================================================

export interface EventSchema {
  /** Event type identifier, e.g. "content.published" */
  eventType: string;
  /** Schema version number */
  version: number;
  /** JSON Schema or custom validation rules */
  schema: Record<string, unknown>;
  /** Human-readable description */
  description: string;
  /** Whether this schema is currently active */
  active: boolean;
  /** When this schema was registered */
  registeredAt: string;
  /** When this schema was deprecated (if applicable) */
  deprecatedAt?: string;
}

export interface SchemaValidationResult {
  valid: boolean;
  errors: string[];
}

export class EventSchemaRegistry {
  private readonly logger = new Logger(EventSchemaRegistry.name);
  private readonly redis: Redis;
  private readonly prefix: string;
  private schemas: Map<string, EventSchema[]> = new Map();

  constructor(redis: Redis, prefix = 'azeebo:events:schemas') {
    this.redis = redis;
    this.prefix = prefix;
  }

  /**
   * Register a new event schema version
   */
  async registerSchema(schema: Omit<EventSchema, 'registeredAt'>): Promise<EventSchema> {
    const fullSchema: EventSchema = {
      ...schema,
      registeredAt: new Date().toISOString(),
    };

    const key = `${this.prefix}:${schema.eventType}`;
    const existing: EventSchema[] = this.schemas.get(schema.eventType) ?? [];

    // Check for duplicate version
    if (existing.some((s) => s.version === schema.version)) {
      throw new Error(
        `Schema version ${schema.version} already registered for ${schema.eventType}`
      );
    }

    existing.push(fullSchema);
    existing.sort((a, b) => a.version - b.version);
    this.schemas.set(schema.eventType, existing);

    // Persist to Redis
    await this.redis.set(key, JSON.stringify(existing));

    this.logger.log(`Registered schema for ${schema.eventType} v${schema.version}`);
    return fullSchema;
  }

  /**
   * Get schema for a specific event type and version
   */
  async getSchema(eventType: string, version?: number): Promise<EventSchema | undefined> {
    let schemas: EventSchema[] | undefined = this.schemas.get(eventType);

    if (!schemas) {
      // Load from Redis
      const key = `${this.prefix}:${eventType}`;
      const data = await this.redis.get(key);
      if (data) {
        schemas = JSON.parse(data) as EventSchema[];
        this.schemas.set(eventType, schemas);
      }
    }

    if (!schemas || schemas.length === 0) {
      return undefined;
    }

    if (version !== undefined) {
      return schemas.find((s) => s.version === version);
    }

    // Return latest active version
    const activeVersions = schemas.filter((s) => s.active);
    return activeVersions[activeVersions.length - 1];
  }

  /**
   * Validate event data against schema
   */
  validateEvent(
    eventType: string,
    data: Record<string, unknown>,
    version?: number
  ): SchemaValidationResult {
    const schema = this.schemas.get(eventType)?.find((s) => s.version === (version || 1));

    if (!schema) {
      return {
        valid: false,
        errors: [`No schema found for ${eventType} v${version || 1}`],
      };
    }

    // Basic validation - extend with JSON Schema validator as needed
    const errors: string[] = [];

    // Check required fields based on schema definition
    const requiredFields = (schema.schema as { required?: string[] })?.required || [];
    for (const field of requiredFields) {
      if (!(field in data)) {
        errors.push(`Missing required field: ${field}`);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Deprecate a schema version
   */
  async deprecateSchema(eventType: string, version: number): Promise<void> {
    const schemas = this.schemas.get(eventType);
    if (!schemas) {
      throw new Error(`No schemas found for ${eventType}`);
    }

    const schema = schemas.find((s) => s.version === version);
    if (!schema) {
      throw new Error(`Schema version ${version} not found for ${eventType}`);
    }

    schema.active = false;
    schema.deprecatedAt = new Date().toISOString();

    const key = `${this.prefix}:${eventType}`;
    await this.redis.set(key, JSON.stringify(schemas));

    this.logger.log(`Deprecated schema for ${eventType} v${version}`);
  }

  /**
   * List all registered event types
   */
  async listEventTypes(): Promise<string[]> {
    return Array.from(this.schemas.keys());
  }
}
