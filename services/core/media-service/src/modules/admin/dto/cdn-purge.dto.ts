import { IsArray, IsOptional, IsString } from 'class-validator';

export class CdnPurgeDto {
  /** Exact object keys to invalidate, e.g. ['uploads/abc.jpg']. */
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  keys?: string[];

  /** Key prefix to invalidate (wildcard), e.g. 'uploads' or 'uploads/images'. */
  @IsOptional()
  @IsString()
  prefix?: string;
}
