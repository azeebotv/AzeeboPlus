import {
  IsString,
  IsBoolean,
  IsNumber,
  IsOptional,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class MenuItemDto {
  @IsString()
  id!: string;

  @IsString()
  label!: string;

  @IsString()
  href!: string;

  @IsOptional()
  @IsString()
  icon?: string;

  @IsBoolean()
  isVisible!: boolean;

  @IsNumber()
  order!: number;

  @IsOptional()
  @IsString()
  badge?: string;

  @IsOptional()
  @IsString()
  target?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  roles?: string[];
}

export class CreateMenuDto {
  @IsString()
  name!: string;

  @IsString()
  location!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MenuItemDto)
  items?: MenuItemDto[];
}

export class UpdateMenuDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MenuItemDto)
  items!: MenuItemDto[];
}

export interface NavigationMenu {
  id: string;
  name: string;
  location: string;
  description?: string;
  isActive: boolean;
  isDefault?: boolean;
  items: MenuItemDto[];
  createdAt: string;
  updatedAt: string;
}
