import {
  IsString,
  IsArray,
  IsOptional,
  IsEnum,
  IsObject,
  ValidateNested,
  IsBoolean,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export enum MetricType {
  COUNT = 'count',
  SUM = 'sum',
  AVG = 'avg',
  MIN = 'min',
  MAX = 'max',
  UNIQUE = 'unique',
}

export enum DimensionType {
  DATE = 'date',
  STRING = 'string',
  NUMBER = 'number',
  BOOLEAN = 'boolean',
}

export class MetricConfig {
  @ApiProperty({ enum: MetricType })
  @IsEnum(MetricType)
  type!: MetricType;

  @ApiProperty()
  @IsString()
  field!: string;

  @ApiProperty()
  @IsString()
  label!: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  format?: string;
}

export class DimensionConfig {
  @ApiProperty()
  @IsString()
  field!: string;

  @ApiProperty()
  @IsString()
  label!: string;

  @ApiProperty({ enum: DimensionType })
  @IsEnum(DimensionType)
  type!: DimensionType;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  format?: string;
}

export class FilterConfig {
  @ApiProperty()
  @IsString()
  field!: string;

  @ApiProperty()
  @IsString()
  operator!: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'contains' | 'between';

  @ApiProperty()
  @IsOptional()
  value?: string | number | boolean;

  @ApiPropertyOptional()
  @IsArray()
  @IsOptional()
  values?: (string | number)[];
}

export class CreateReportDto {
  @ApiProperty()
  @IsString()
  name!: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  category?: string;

  @ApiProperty({ type: [MetricConfig] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MetricConfig)
  metrics!: MetricConfig[];

  @ApiProperty({ type: [DimensionConfig] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DimensionConfig)
  dimensions!: DimensionConfig[];

  @ApiPropertyOptional({ type: [FilterConfig] })
  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => FilterConfig)
  filters?: FilterConfig[];

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  dateField?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  dateRange?: 'today' | 'yesterday' | '7d' | '30d' | '90d' | 'custom';

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  startDate?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  endDate?: string;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isPublic?: boolean;

  @ApiPropertyOptional()
  @IsObject()
  @IsOptional()
  chartConfig?: Record<string, string | number | boolean>;
}

export class ExecuteReportDto {
  @ApiProperty()
  @IsString()
  reportId!: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  startDate?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  endDate?: string;

  @ApiPropertyOptional({ type: [FilterConfig] })
  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => FilterConfig)
  additionalFilters?: FilterConfig[];

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  groupBy?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  orderBy?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  orderDirection?: 'asc' | 'desc';

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  limit?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  offset?: string;
}
