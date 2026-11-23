import { IsString, IsOptional, IsNumber, IsBoolean, IsArray, Min, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateEventDto {
  @ApiProperty({ description: 'Event title' })
  @IsString()
  @MaxLength(200)
  title!: string;

  @ApiPropertyOptional({ description: 'Event description' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @ApiProperty({ description: 'Thumbnail URL' })
  @IsString()
  thumbnail!: string;

  @ApiProperty({ description: 'Scheduled date/time (ISO 8601)' })
  @IsString()
  scheduledAt!: string;

  @ApiProperty({ description: 'Duration in minutes' })
  @IsNumber()
  @Min(1)
  duration!: number;

  @ApiProperty({ description: 'Ticket price' })
  @IsNumber()
  @Min(0)
  ticketPrice!: number;

  @ApiPropertyOptional({ description: 'Currency code', default: 'NGN' })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiPropertyOptional({ description: 'Maximum concurrent viewers' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  maxViewers?: number;

  @ApiPropertyOptional({ description: 'Enable live chat', default: true })
  @IsOptional()
  @IsBoolean()
  chatEnabled?: boolean;
}

export class UpdateEventDto {
  @ApiPropertyOptional({ description: 'Event title' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  title?: string;

  @ApiPropertyOptional({ description: 'Event description' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @ApiPropertyOptional({ description: 'Thumbnail URL' })
  @IsOptional()
  @IsString()
  thumbnail?: string;

  @ApiPropertyOptional({ description: 'Scheduled date/time (ISO 8601)' })
  @IsOptional()
  @IsString()
  scheduledAt?: string;

  @ApiPropertyOptional({ description: 'Duration in minutes' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  duration?: number;

  @ApiPropertyOptional({ description: 'Ticket price' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  ticketPrice?: number;

  @ApiPropertyOptional({ description: 'Stream URL' })
  @IsOptional()
  @IsString()
  streamUrl?: string;

  @ApiPropertyOptional({ description: 'Replay URL' })
  @IsOptional()
  @IsString()
  replayUrl?: string;

  @ApiPropertyOptional({ description: 'Event status' })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ description: 'Enable live chat' })
  @IsOptional()
  @IsBoolean()
  chatEnabled?: boolean;

  @ApiPropertyOptional({ description: 'Currency code' })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiPropertyOptional({ description: 'Maximum concurrent viewers' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  maxViewers?: number;
}

export class PurchaseTicketDto {
  @ApiPropertyOptional({ description: 'Optional promo code' })
  @IsOptional()
  @IsString()
  promoCode?: string;
}

export class PurchaseGroupTicketsDto {
  @ApiProperty({ description: 'List of recipient user IDs to receive tickets', type: [String] })
  @IsArray()
  @IsString({ each: true })
  recipientUserIds!: string[];

  @ApiPropertyOptional({ description: 'Optional message from the sender' })
  @IsOptional()
  @IsString()
  message?: string;
}

