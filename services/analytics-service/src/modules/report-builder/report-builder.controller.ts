import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';

import { ReportBuilderService } from './report-builder.service';
import { CreateReportDto, ExecuteReportDto } from './dto/report-builder.dto';

interface AuthenticatedRequest extends Request {
  user?: {
    sub: string;
    role: string;
  };
}

@ApiTags('Report Builder')
@ApiBearerAuth()
@Controller('v1/reports')
@UseGuards(AuthGuard('jwt'))
export class ReportBuilderController {
  constructor(private readonly reportBuilderService: ReportBuilderService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a custom report' })
  @ApiResponse({ status: 201, description: 'Report created successfully' })
  async createReport(@Request() req: AuthenticatedRequest, @Body() dto: CreateReportDto) {
    return this.reportBuilderService.createReport(req.user.sub, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List all reports' })
  @ApiResponse({ status: 200, description: 'Reports retrieved successfully' })
  async listReports(
    @Request() req: AuthenticatedRequest,
    @Query('category') category?: string,
    @Query('isPublic') isPublic?: string
  ) {
    return this.reportBuilderService.listReports(req.user.sub, req.user.role, {
      category,
      isPublic: isPublic === 'true' ? true : isPublic === 'false' ? false : undefined,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a report by ID' })
  @ApiResponse({ status: 200, description: 'Report retrieved successfully' })
  async getReport(@Request() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.reportBuilderService.getReport(id, req.user.sub);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a report' })
  @ApiResponse({ status: 200, description: 'Report updated successfully' })
  async updateReport(
    @Request() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() dto: Partial<CreateReportDto>
  ) {
    return this.reportBuilderService.updateReport(id, req.user.sub, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a report' })
  @ApiResponse({ status: 200, description: 'Report deleted successfully' })
  async deleteReport(@Request() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.reportBuilderService.deleteReport(id, req.user.sub);
  }

  @Post('execute')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Execute a report' })
  @ApiResponse({ status: 200, description: 'Report executed successfully' })
  async executeReport(@Request() req: AuthenticatedRequest, @Body() dto: ExecuteReportDto) {
    return this.reportBuilderService.executeReport(req.user.sub, dto);
  }

  @Get(':id/executions')
  @ApiOperation({ summary: 'Get report execution history' })
  @ApiResponse({ status: 200, description: 'Execution history retrieved successfully' })
  async getExecutionHistory(
    @Request() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Query('limit') limit?: string
  ) {
    return this.reportBuilderService.getExecutionHistory(
      id,
      req.user.sub,
      limit ? parseInt(limit) : 20
    );
  }
}
