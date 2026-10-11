import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AdminGuard } from '@azeebo/security';
import { ApiResponseWrapper } from '@azeebo/shared-types';
import { BorrowService } from './borrow.service.js';
import { CreatePartnerBankDto } from './dto/create-partner-bank.dto.js';
import { UpdatePartnerBankDto } from './dto/update-partner-bank.dto.js';

/**
 * Partner-bank maintenance for the admin portal. Deactivating a partner is the
 * takedown path: the public listing filters on isActive, so an offer disappears
 * without deleting its disclosure history.
 */
@ApiTags('Admin - Borrow')
@ApiBearerAuth()
@Controller('borrow/admin')
@UseGuards(AdminGuard)
export class BorrowAdminController {
  constructor(private readonly borrowService: BorrowService) {}

  @Get('banks')
  @ApiOperation({ summary: 'List all partner banks, active and inactive (admin)' })
  @ApiResponse({ status: 200, description: 'Paginated partner banks' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async listAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number
  ) {
    const result = await this.borrowService.listAll({ page, limit });
    return ApiResponseWrapper.paginated(
      result.items,
      result.meta.page,
      result.meta.limit,
      result.meta.total
    );
  }

  @Post('banks')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a partner bank (admin)' })
  @ApiResponse({ status: 201, description: 'Partner bank created' })
  @ApiResponse({ status: 400, description: 'Invalid input or inverted offer ranges' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 409, description: 'Slug already in use' })
  async create(@Body() dto: CreatePartnerBankDto) {
    const created = await this.borrowService.create(dto);
    return ApiResponseWrapper.created(created);
  }

  @Patch('banks/:id')
  @ApiOperation({ summary: 'Update a partner bank (admin)' })
  @ApiResponse({ status: 200, description: 'Partner bank updated' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Partner bank not found' })
  @ApiResponse({ status: 409, description: 'Slug already in use' })
  async update(@Param('id') id: string, @Body() dto: UpdatePartnerBankDto) {
    const updated = await this.borrowService.update(id, dto);
    return ApiResponseWrapper.success(updated);
  }

  @Delete('banks/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a partner bank (admin)' })
  @ApiResponse({ status: 200, description: 'Partner bank deleted' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Partner bank not found' })
  async remove(@Param('id') id: string) {
    const deleted = await this.borrowService.remove(id);
    return ApiResponseWrapper.success({ id: deleted.id, deleted: true });
  }
}
