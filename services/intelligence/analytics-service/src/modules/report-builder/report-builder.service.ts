import { Inject, Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { mapAndThrow } from '@azeebo/security';
import { Prisma } from '../../prisma/client/index.js';
import { PrismaService } from '../database/prisma.service.js';
import { FeatureFlagService, analyticsFlags } from '@azeebo/feature-flags';
import {
  CreateReportDto,
  ExecuteReportDto,
  FilterConfig,
  MetricConfig,
  MetricType,
  DimensionConfig,
} from './dto/report-builder.dto.js';

type ReportRow = Record<string, unknown>;

interface ReportResult {
  success: boolean;
  data?: ReportRow | ReportRow[] | unknown;
  columns?: string[];
  error?: string;
  message?: string;
  metadata?: {
    totalRows: number;
    executionTime: number;
    reportName: string;
    generatedAt: Date;
  };
}

interface PrismaQuery {
  select: Record<string, boolean>;
  where: Record<string, unknown>;
  orderBy: Record<string, string>;
  skip: number;
  take: number;
  _count?: Record<string, boolean>;
  _sum?: Record<string, boolean>;
  _avg?: Record<string, boolean>;
  _min?: Record<string, boolean>;
  _max?: Record<string, boolean>;
}

interface QueryOptions {
  groupBy?: string;
  orderBy?: string;
  orderDirection?: string;
  limit?: number;
  offset?: number;
}

@Injectable()
export class ReportBuilderService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(FeatureFlagService) private readonly featureFlagService: FeatureFlagService
  ) {}

  /** Kill-switch: report builder v2 defaults OFF until the pipeline is validated. */
  private async assertEnabled(): Promise<void> {
    if (!(await this.featureFlagService.isEnabled(analyticsFlags.reportBuilderV2))) {
      throw new BadRequestException('Report builder is disabled');
    }
  }

  async createReport(userId: string, dto: CreateReportDto): Promise<ReportResult> {
    await this.assertEnabled();
    try {
      const report = await this.prisma.customReport.create({
        data: {
          name: dto.name,
          description: dto.description,
          category: dto.category || 'general',
          createdBy: userId,
          metrics: dto.metrics as unknown as Prisma.InputJsonValue,
          dimensions: dto.dimensions as unknown as Prisma.InputJsonValue,
          filters: (dto.filters || []) as unknown as Prisma.InputJsonValue,
          dateField: dto.dateField || 'createdAt',
          dateRange: dto.dateRange || '30d',
          startDate: dto.startDate ? new Date(dto.startDate) : null,
          endDate: dto.endDate ? new Date(dto.endDate) : null,
          isPublic: dto.isPublic || false,
          chartConfig: dto.chartConfig || {},
        },
      });

      return {
        success: true,
        data: report,
      };
    } catch (error) {
      mapAndThrow(error, 'creating report');
    }
  }

  async getReport(reportId: string, userId: string): Promise<ReportResult> {
    await this.assertEnabled();
    try {
      const report = await this.prisma.customReport.findUnique({
        where: { id: reportId },
      });

      if (!report) {
        throw new NotFoundException('Report not found');
      }

      if (!report.isPublic && report.createdBy !== userId) {
        throw new BadRequestException('You do not have permission to view this report');
      }

      return {
        success: true,
        data: report,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      mapAndThrow(error, 'getting report');
    }
  }

  async listReports(
    userId: string,
    role: string,
    filters?: { category?: string; isPublic?: boolean }
  ): Promise<ReportResult> {
    await this.assertEnabled();
    try {
      const where: Record<string, unknown> = {};

      if (!role.includes('admin')) {
        where.OR = [{ createdBy: userId }, { isPublic: true }];
      }

      if (filters?.category) {
        where.category = filters.category;
      }

      if (filters?.isPublic !== undefined) {
        where.isPublic = filters.isPublic;
      }

      const reports = await this.prisma.customReport.findMany({
        where,
        orderBy: { createdAt: 'desc' },
      });

      return {
        success: true,
        data: reports,
      };
    } catch (error) {
      mapAndThrow(error, 'listing reports');
    }
  }

  async executeReport(userId: string, dto: ExecuteReportDto): Promise<ReportResult> {
    await this.assertEnabled();
    const startTime = Date.now();

    try {
      const report = await this.prisma.customReport.findUnique({
        where: { id: dto.reportId },
      });

      if (!report) {
        throw new NotFoundException('Report not found');
      }

      if (!report.isPublic && report.createdBy !== userId) {
        throw new BadRequestException('You do not have permission to execute this report');
      }

      const metrics = report.metrics as unknown as MetricConfig[];
      const dimensions = report.dimensions as unknown as DimensionConfig[];
      const filters = (report.filters as unknown as FilterConfig[]) || [];

      const additionalFilters = dto.additionalFilters || [];
      const allFilters = [...filters, ...additionalFilters];

      const startDate = dto.startDate
        ? new Date(dto.startDate)
        : report.startDate
          ? new Date(report.startDate)
          : this.getDefaultStartDate(report.dateRange);

      const endDate = dto.endDate
        ? new Date(dto.endDate)
        : report.endDate
          ? new Date(report.endDate)
          : new Date();

      const query = this.buildQuery(metrics, dimensions, allFilters, startDate, endDate, {
        groupBy: dto.groupBy,
        orderBy: dto.orderBy,
        orderDirection: dto.orderDirection,
        limit: dto.limit ? parseInt(dto.limit) : 100,
        offset: dto.offset ? parseInt(dto.offset) : 0,
      });

      const results = await this.executeQuery(query);

      const executionTime = Date.now() - startTime;

      await this.prisma.reportExecution.create({
        data: {
          reportId: dto.reportId,
          executedBy: userId,
          executionTime,
          rowCount: results.length,
          parameters: {
            startDate,
            endDate,
            additionalFilters,
            groupBy: dto.groupBy,
          } as unknown as Prisma.InputJsonValue,
        },
      });

      return {
        success: true,
        data: {
          results,
          columns: [...dimensions.map((d) => d.field || d.label), ...metrics.map((m) => m.label)],
        },
        metadata: {
          totalRows: results.length,
          executionTime,
          reportName: report.name,
          generatedAt: new Date(),
        },
      };
    } catch (error) {
      const executionTime = Date.now() - startTime;

      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }

      return {
        success: false,
        error: `Failed to execute report: ${error instanceof Error ? (error as Error).message : 'Unknown error'}`,
        metadata: {
          totalRows: 0,
          executionTime,
          reportName: 'Unknown',
          generatedAt: new Date(),
        },
      };
    }
  }

  async updateReport(
    reportId: string,
    userId: string,
    dto: Partial<CreateReportDto>
  ): Promise<ReportResult> {
    await this.assertEnabled();
    try {
      const report = await this.prisma.customReport.findUnique({
        where: { id: reportId },
      });

      if (!report) {
        throw new NotFoundException('Report not found');
      }

      if (report.createdBy !== userId) {
        throw new BadRequestException('You do not have permission to update this report');
      }

      const updated = await this.prisma.customReport.update({
        where: { id: reportId },
        data: {
          ...(dto.name && { name: dto.name }),
          ...(dto.description !== undefined && { description: dto.description }),
          ...(dto.category && { category: dto.category }),
          ...(dto.metrics && { metrics: dto.metrics as unknown as Prisma.InputJsonValue }),
          ...(dto.dimensions && { dimensions: dto.dimensions as unknown as Prisma.InputJsonValue }),
          ...(dto.filters !== undefined && {
            filters: dto.filters as unknown as Prisma.InputJsonValue,
          }),
          ...(dto.dateField && { dateField: dto.dateField }),
          ...(dto.dateRange && { dateRange: dto.dateRange }),
          ...(dto.startDate && { startDate: new Date(dto.startDate) }),
          ...(dto.endDate && { endDate: new Date(dto.endDate) }),
          ...(dto.isPublic !== undefined && { isPublic: dto.isPublic }),
          ...(dto.chartConfig && {
            chartConfig: dto.chartConfig as unknown as Prisma.InputJsonValue,
          }),
        } as unknown as Prisma.CustomReportUpdateInput,
      });

      return {
        success: true,
        data: updated,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      mapAndThrow(error, 'updating report');
    }
  }

  async deleteReport(reportId: string, userId: string): Promise<ReportResult> {
    await this.assertEnabled();
    try {
      const report = await this.prisma.customReport.findUnique({
        where: { id: reportId },
      });

      if (!report) {
        throw new NotFoundException('Report not found');
      }

      if (report.createdBy !== userId) {
        throw new BadRequestException('You do not have permission to delete this report');
      }

      await this.prisma.customReport.delete({
        where: { id: reportId },
      });

      return {
        success: true,
        message: 'Report deleted successfully',
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      mapAndThrow(error, 'deleting report');
    }
  }

  async getExecutionHistory(
    reportId: string,
    userId: string,
    limit: number = 20
  ): Promise<ReportResult> {
    await this.assertEnabled();
    try {
      const report = await this.prisma.customReport.findUnique({
        where: { id: reportId },
      });

      if (!report) {
        throw new NotFoundException('Report not found');
      }

      if (!report.isPublic && report.createdBy !== userId) {
        throw new BadRequestException('You do not have permission to view this report');
      }

      const executions = await this.prisma.reportExecution.findMany({
        where: { reportId },
        orderBy: { executedAt: 'desc' },
        take: limit,
      });

      return {
        success: true,
        data: executions,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      mapAndThrow(error, 'getting execution history');
    }
  }

  private getDefaultStartDate(dateRange: string): Date {
    const now = new Date();
    const days = parseInt(dateRange.replace('d', '')) || 30;
    return new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
  }

  private buildQuery(
    metrics: MetricConfig[],
    dimensions: DimensionConfig[],
    filters: FilterConfig[],
    startDate: Date,
    endDate: Date,
    options: QueryOptions
  ): PrismaQuery {
    const query: PrismaQuery = {
      select: {},
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: {},
      skip: options.offset || 0,
      take: options.limit || 100,
    };

    dimensions.forEach((dim) => {
      query.select[dim.field] = true;
    });

    metrics.forEach((metric) => {
      if (metric.type === MetricType.COUNT) {
        query._count = query._count || {};
        query._count[metric.field] = true;
      } else if (metric.type === MetricType.SUM) {
        query._sum = query._sum || {};
        query._sum[metric.field] = true;
      } else if (metric.type === MetricType.AVG) {
        query._avg = query._avg || {};
        query._avg[metric.field] = true;
      } else if (metric.type === MetricType.MIN) {
        query._min = query._min || {};
        query._min[metric.field] = true;
      } else if (metric.type === MetricType.MAX) {
        query._max = query._max || {};
        query._max[metric.field] = true;
      }
    });

    filters.forEach((filter) => {
      switch (filter.operator) {
        case 'eq':
          query.where[filter.field] = filter.value;
          break;
        case 'neq':
          query.where[filter.field] = { not: filter.value };
          break;
        case 'gt':
          query.where[filter.field] = { gt: filter.value };
          break;
        case 'gte':
          query.where[filter.field] = { gte: filter.value };
          break;
        case 'lt':
          query.where[filter.field] = { lt: filter.value };
          break;
        case 'lte':
          query.where[filter.field] = { lte: filter.value };
          break;
        case 'in':
          query.where[filter.field] = { in: filter.values };
          break;
        case 'contains':
          query.where[filter.field] = { contains: filter.value };
          break;
        case 'between':
          query.where[filter.field] = {
            gte: filter.values?.[0],
            lte: filter.values?.[1],
          };
          break;
      }
    });

    if (options.orderBy) {
      query.orderBy[options.orderBy] = options.orderDirection || 'desc';
    }

    return query;
  }

  // Prisma groupBy with dynamic fields requires type assertions due to Prisma's typing limitations
  private async dynamicGroupBy(options: {
    by: string[];
    _count?: Record<string, boolean>;
    _sum?: Record<string, boolean>;
    _avg?: Record<string, boolean>;
    _min?: Record<string, boolean>;
    _max?: Record<string, boolean>;
    where?: Record<string, unknown>;
    orderBy?: Record<string, unknown>;
    take?: number;
    skip?: number;
  }): Promise<Record<string, unknown>[]> {
    // Using unknown cast because Prisma's groupBy typing doesn't support dynamic field arrays
    const result = await this.prisma.productEvent.groupBy(
      options as unknown as Parameters<typeof this.prisma.productEvent.groupBy>[0]
    );
    return result as unknown as Record<string, unknown>[];
  }

  // Field name mapping from snake_case (used in queries) to camelCase (Prisma model)
  private readonly FIELD_MAPPING: Record<string, string> = {
    event_name: 'eventName',
    user_id: 'userId',
    created_at: 'createdAt',
    updated_at: 'updatedAt',
  };

  private mapFieldName(field: string): string {
    return this.FIELD_MAPPING[field] || field;
  }

  private async executeQuery(query: PrismaQuery): Promise<Record<string, unknown>[]> {
    try {
      // Build Prisma-compatible where clause from the query
      const where = this.buildPrismaWhereClause(query.where);

      // Build orderBy for Prisma (map field names)
      const orderBy = this.buildPrismaOrderBy(query.orderBy);

      // Build select clause for dimensions (map field names)
      const select: Record<string, boolean> = {};
      Object.keys(query.select || {}).forEach((field) => {
        if (this.ALLOWED_FIELDS.has(field)) {
          select[this.mapFieldName(field)] = true;
        }
      });

      // Determine if we need aggregation
      const hasAggregation = query._count || query._sum || query._avg || query._min || query._max;

      if (hasAggregation) {
        // Use groupBy for aggregations
        const groupByFields = Object.keys(query.select || {})
          .filter((f) => f !== 'id')
          .map((f) => this.mapFieldName(f));

        if (query._count) {
          const countKeys = Object.keys(query._count);
          const countField = this.mapFieldName(countKeys[0]);
          const result = await this.dynamicGroupBy({
            by: groupByFields.length > 0 ? groupByFields : [],
            where,
            _count: { [countField]: true },
            orderBy,
            take: query.take,
            skip: query.skip,
          });

          return result.map((row) => {
            const transformed: ReportRow = {};
            Object.keys(query.select || {})
              .filter((f) => f !== 'id')
              .forEach((f) => {
                transformed[f] = row[this.mapFieldName(f) as keyof typeof row];
              });
            transformed[`${countKeys[0]}_count`] = (row as Record<string, unknown>)._count
              ? ((row as Record<string, unknown>)._count as Record<string, unknown>)[countField]
              : undefined;
            return transformed;
          });
        }

        if (query._sum) {
          const sumKeys = Object.keys(query._sum);
          const sumField = this.mapFieldName(sumKeys[0]);
          const result = await this.dynamicGroupBy({
            by: groupByFields.length > 0 ? groupByFields : [],
            where,
            _sum: { [sumField]: true },
            orderBy,
            take: query.take,
            skip: query.skip,
          });

          return result.map((row) => {
            const transformed: ReportRow = {};
            Object.keys(query.select || {})
              .filter((f) => f !== 'id')
              .forEach((f) => {
                transformed[f] = row[this.mapFieldName(f) as keyof typeof row];
              });
            transformed[`${sumKeys[0]}_sum`] = (row as Record<string, unknown>)._sum
              ? ((row as Record<string, unknown>)._sum as Record<string, unknown>)[sumField]
              : undefined;
            return transformed;
          });
        }

        if (query._avg) {
          const avgKeys = Object.keys(query._avg);
          const avgField = this.mapFieldName(avgKeys[0]);
          const result = await this.dynamicGroupBy({
            by: groupByFields.length > 0 ? groupByFields : [],
            where,
            _avg: { [avgField]: true },
            orderBy,
            take: query.take,
            skip: query.skip,
          });

          return result.map((row) => {
            const transformed: ReportRow = {};
            Object.keys(query.select || {})
              .filter((f) => f !== 'id')
              .forEach((f) => {
                transformed[f] = row[this.mapFieldName(f) as keyof typeof row];
              });
            transformed[`${avgKeys[0]}_avg`] = (row as Record<string, unknown>)._avg
              ? ((row as Record<string, unknown>)._avg as Record<string, unknown>)[avgField]
              : undefined;
            return transformed;
          });
        }

        if (query._min) {
          const minKeys = Object.keys(query._min);
          const minField = this.mapFieldName(minKeys[0]);
          const result = await this.dynamicGroupBy({
            by: groupByFields.length > 0 ? groupByFields : [],
            where,
            _min: { [minField]: true },
            orderBy,
            take: query.take,
            skip: query.skip,
          });

          return result.map((row) => {
            const transformed: ReportRow = {};
            Object.keys(query.select || {})
              .filter((f) => f !== 'id')
              .forEach((f) => {
                transformed[f] = row[this.mapFieldName(f) as keyof typeof row];
              });
            transformed[`${minKeys[0]}_min`] = (row as Record<string, unknown>)._min
              ? ((row as Record<string, unknown>)._min as Record<string, unknown>)[minField]
              : undefined;
            return transformed;
          });
        }

        if (query._max) {
          const maxKeys = Object.keys(query._max);
          const maxField = this.mapFieldName(maxKeys[0]);
          const result = await this.dynamicGroupBy({
            by: groupByFields.length > 0 ? groupByFields : [],
            where,
            _max: { [maxField]: true },
            orderBy,
            take: query.take,
            skip: query.skip,
          });

          return result.map((row) => {
            const transformed: ReportRow = {};
            Object.keys(query.select || {})
              .filter((f) => f !== 'id')
              .forEach((f) => {
                transformed[f] = row[this.mapFieldName(f) as keyof typeof row];
              });
            transformed[`${maxKeys[0]}_max`] = (row as Record<string, unknown>)._max
              ? ((row as Record<string, unknown>)._max as Record<string, unknown>)[maxField]
              : undefined;
            return transformed;
          });
        }
      }

      // Regular findMany without aggregation
      const results = await this.prisma.productEvent.findMany({
        where,
        select: Object.keys(select).length > 0 ? select : undefined,
        orderBy,
        take: query.take,
        skip: query.skip,
      });

      return results as Record<string, unknown>[];
    } catch (error) {
      mapAndThrow(error, 'executing report query');
    }
  }

  // Allowlist of valid fields for analytics_events table
  private readonly ALLOWED_FIELDS = new Set([
    'id',
    'event_name',
    'user_id',
    'universe',
    'metadata',
    'created_at',
    'updated_at',
    'session_id',
    'platform',
    'app_version',
    'experiment_flags',
    'timestamp',
    'eventName',
  ]);

  // Allowlist of valid order directions
  private readonly ALLOWED_ORDER_DIRECTIONS = new Set(['asc', 'desc']);

  private validateFieldName(field: string): void {
    if (!this.ALLOWED_FIELDS.has(field)) {
      throw new BadRequestException(`Invalid field name: ${field}`);
    }
  }

  private buildPrismaWhereClause(where: Record<string, unknown>): Record<string, unknown> {
    const prismaWhere: Record<string, unknown> = {};

    Object.keys(where).forEach((key) => {
      if (!this.ALLOWED_FIELDS.has(key)) {
        throw new BadRequestException(`Invalid field name: ${key}`);
      }

      // Map snake_case to camelCase for Prisma
      const prismaKey = this.mapFieldName(key);
      const value = where[key];

      // Handle date operators - created_at maps to createdAt
      if (key === 'created_at' && typeof value === 'object' && value !== null) {
        const dateFilter = value as Record<string, unknown>;
        if (dateFilter.gte)
          prismaWhere.createdAt = {
            ...((prismaWhere.createdAt as object) || {}),
            gte: dateFilter.gte,
          };
        if (dateFilter.lte)
          prismaWhere.createdAt = {
            ...((prismaWhere.createdAt as object) || {}),
            lte: dateFilter.lte,
          };
      } else if (typeof value === 'object' && value !== null) {
        // Handle other operators like { not: x }, { in: [x,y] }, { gte: x }, etc.
        const operatorObj = value as Record<string, unknown>;
        const validOperators = [
          'not',
          'in',
          'notIn',
          'gt',
          'gte',
          'lt',
          'lte',
          'contains',
          'startsWith',
          'endsWith',
        ];
        const usedOperators = Object.keys(operatorObj).filter((op) => validOperators.includes(op));

        if (usedOperators.length > 0) {
          // Validate all operator values
          usedOperators.forEach((op) => {
            const opValue = operatorObj[op];
            if (Array.isArray(opValue)) {
              opValue.forEach((item) => this.validateScalarValue(item));
            } else {
              this.validateScalarValue(opValue);
            }
          });
          prismaWhere[prismaKey] = operatorObj;
        } else {
          // Simple equality
          prismaWhere[prismaKey] = value;
        }
      } else {
        // Simple equality
        this.validateScalarValue(value);
        prismaWhere[prismaKey] = value;
      }
    });

    return prismaWhere;
  }

  private validateScalarValue(value: unknown): void {
    if (value === null || value === undefined) return;
    if (typeof value === 'string') {
      // Check for potential SQL injection patterns
      const dangerousPatterns = [
        /('|"|;|--|\/\*|\*\/|xp_|sp_|exec|execute|insert|update|delete|drop|alter|create|truncate)/i,
      ];
      if (dangerousPatterns.some((pattern) => pattern.test(value))) {
        throw new BadRequestException(`Invalid value detected in query`);
      }
    }
  }

  private buildPrismaOrderBy(orderBy: Record<string, string>): Record<string, string> | undefined {
    if (!orderBy || Object.keys(orderBy).length === 0) {
      return undefined;
    }

    const orderByField = Object.keys(orderBy)[0];
    const direction = orderBy[orderByField];

    this.validateFieldName(orderByField);

    if (!this.ALLOWED_ORDER_DIRECTIONS.has(direction.toLowerCase())) {
      throw new BadRequestException(`Invalid order direction: ${direction}`);
    }

    // Map snake_case field name to camelCase for Prisma
    return { [this.mapFieldName(orderByField)]: direction };
  }
}
