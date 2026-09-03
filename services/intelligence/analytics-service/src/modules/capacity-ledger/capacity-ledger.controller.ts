import { Controller, Get, Post, Param, Body, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { CapacityLedgerService, CreateCapacityEntryDto } from './capacity-ledger.service';

@ApiTags('Capacity Ledger')
@Controller('capacity')
export class CapacityLedgerController {
  constructor(private readonly ledgerService: CapacityLedgerService) {}

  @Post('entries')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Record a capacity ledger entry' })
  createEntry(@Body() dto: CreateCapacityEntryDto) {
    return this.ledgerService.createEntry(dto);
  }

  @Get('entries')
  @ApiOperation({ summary: 'List capacity entries' })
  @ApiQuery({ name: 'period', required: false })
  @ApiQuery({ name: 'domain', required: false })
  findAll(@Query('period') period?: string, @Query('domain') domain?: string) {
    return this.ledgerService.findAll(period, domain);
  }

  @Get('summary/:period')
  @ApiOperation({ summary: 'Get period summary' })
  getPeriodSummary(@Param('period') period: string) {
    return this.ledgerService.getPeriodSummary(period);
  }

  @Post('entries/:id/validate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Validate a capacity entry (CFO/People)' })
  validateEntry(@Param('id') id: string, @Body() body: { validatedBy: string }) {
    return this.ledgerService.validateEntry(id, body.validatedBy);
  }

  @Post('seed')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Seed capacity ledger with sample AOS-MA-001 workflow data' })
  @ApiQuery({ name: 'period', required: false, description: 'Period to seed (default: current quarter)' })
  seedEntries(@Query('period') period?: string) {
    return this.ledgerService.seedEntries(period);
  }
}
