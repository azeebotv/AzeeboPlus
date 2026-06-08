import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreateReportDto, ExecuteReportDto, FilterConfig, MetricConfig, MetricType, DimensionConfig } from './dto/report-builder.dto';

interface ReportResult {
  success: boolean;
  data?: Record<string, unknown>[];
  columns?: string[];
  error?: string;
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
  constructor(private readonly prisma: PrismaService) {}

  async createReport(userId: string, dto: CreateReportDto): Promise<ReportResult> {
    try {
      const report = await this.prisma.customReport.create({
        data: {
          name: dto.name,
          description: dto.description,
          category: dto.category || 'general',
          createdBy: userId,
          metrics: dto.metrics as unknown as Record<string, unknown>,
          dimensions: dto.dimensions as unknown as Record<string, unknown>,
          filters: (dto.filters || []) as unknown as Record<string, unknown>,
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
      throw new BadRequestException(`Failed to create report: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getReport(reportId: string, userId: string): Promise<ReportResult> {
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
      throw new BadRequestException(`Failed to get report: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async listReports(userId: string, role: string, filters?: { category?: string; isPublic?: boolean }): Promise<ReportResult> {
    try {
      const where: Record<string, unknown> = {};

      if (!role.includes('admin')) {
        where.OR = [
          { createdBy: userId },
          { isPublic: true },
        ];
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
      throw new BadRequestException(`Failed to list reports: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async executeReport(userId: string, dto: ExecuteReportDto): Promise<ReportResult> {
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
          } as unknown as Record<string, unknown>,
        },
      });

      return {
        success: true,
        data: {
          results,
          columns: [...dimensions.map(d => d.field || d.label), ...metrics.map(m => m.label)],
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
        error: `Failed to execute report: ${error instanceof Error ? error.message : 'Unknown error'}`,
        metadata: {
          totalRows: 0,
          executionTime,
          reportName: 'Unknown',
          generatedAt: new Date(),
        },
      };
    }
  }

  async updateReport(reportId: string, userId: string, dto: Partial<CreateReportDto>): Promise<ReportResult> {
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
          ...(dto.metrics && { metrics: dto.metrics as unknown as Record<string, unknown> }),
          ...(dto.dimensions && { dimensions: dto.dimensions as unknown as Record<string, unknown> }),
          ...(dto.filters !== undefined && { filters: dto.filters as unknown as Record<string, unknown> }),
          ...(dto.dateField && { dateField: dto.dateField }),
          ...(dto.dateRange && { dateRange: dto.dateRange }),
          ...(dto.startDate && { startDate: new Date(dto.startDate) }),
          ...(dto.endDate && { endDate: new Date(dto.endDate) }),
          ...(dto.isPublic !== undefined && { isPublic: dto.isPublic }),
          ...(dto.chartConfig && { chartConfig: dto.chartConfig }),
        },
      });

      return {
        success: true,
        data: updated,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(`Failed to update report: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async deleteReport(reportId: string, userId: string): Promise<ReportResult> {
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
      throw new BadRequestException(`Failed to delete report: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getExecutionHistory(reportId: string, userId: string, limit: number = 20): Promise<ReportResult> {
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
      throw new BadRequestException(`Failed to get execution history: ${error instanceof Error ? error.message : 'Unknown error'}`);
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

    dimensions.forEach(dim => {
      query.select[dim.field] = true;
    });

    metrics.forEach(metric => {
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

    filters.forEach(filter => {
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

  private async executeQuery(query: PrismaQuery): Promise<Record<string, unknown>[]> {
    try {
      const results = await this.prisma.$queryRawUnsafe(
        this.convertPrismaQueryToRawSQL(query)
      );
      return results as Record<string, unknown>[];
    } catch (error) {
      throw new BadRequestException(`Query execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private convertPrismaQueryToRawSQL(query: PrismaQuery): string {
    let sql = 'SELECT ';

    const selectFields = Object.keys(query.select || {});
    if (selectFields.length > 0) {
      sql += selectFields.join(', ');
    } else {
      sql += '*';
    }

    sql += ' FROM analytics_events';

    if (query.where) {
      const conditions: string[] = [];

      if (query.where.createdAt) {
        if (query.where.createdAt.gte) {
          conditions.push(`created_at >= '${query.where.createdAt.gte.toISOString()}'`);
        }
        if (query.where.createdAt.lte) {
          conditions.push(`created_at <= '${query.where.createdAt.lte.toISOString()}'`);
        }
      }

      if (conditions.length > 0) {
        sql += ' WHERE ' + conditions.join(' AND ');
      }
    }

    if (query.orderBy && Object.keys(query.orderBy).length > 0) {
      const orderByField = Object.keys(query.orderBy)[0];
      const direction = query.orderBy[orderByField];
      sql += ` ORDER BY ${orderByField} ${direction.toUpperCase()}`;
    }

    if (query.take) {
      sql += ` LIMIT ${query.take}`;
    }

    if (query.skip) {
      sql += ` OFFSET ${query.skip}`;
    }

    return sql;
  }
}
