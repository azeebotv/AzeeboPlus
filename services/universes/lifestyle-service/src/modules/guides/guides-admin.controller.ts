import {
  Inject,
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AdminGuard } from '@azeebo/security';
import { GuidesAdminService } from './guides-admin.service';
import {
  CreateItineraryDto,
  UpdateItineraryDto,
  CreateNeighborhoodDto,
  UpdateNeighborhoodDto,
  CreatePartnerDto,
  UpdatePartnerDto,
  CreatePartnerOfferDto,
  UpdatePartnerOfferDto,
} from './dto/guides-admin.dto';

/**
 * Admin CRUD for the lifestyle guides catalogs. Mounted under `lifestyle/admin`
 * so the gateway's existing `/lifestyle` service mapping forwards it straight
 * to this service (the `/admin` prefix is already owned by the admin service).
 *
 * Auth chain: ServiceAuthGuard (global) establishes identity from the
 * gateway-forwarded headers / session cookie; AdminGuard then requires the
 * admin role. Every route below is therefore admin-only — unlike the public
 * GuidesController, nothing here is @Public().
 */
@ApiTags('Guides Admin')
@ApiBearerAuth()
@Controller('lifestyle/admin')
@UseGuards(AdminGuard)
export class GuidesAdminController {
  constructor(@Inject(GuidesAdminService) private readonly adminService: GuidesAdminService) {}

  /** AdminGuard-established identity; falls back to `sub` for Bearer tokens. */
  private adminId(req: { user?: { id?: string; sub?: string } }): string {
    return req.user?.id ?? req.user?.sub ?? '';
  }

  // ---------------------------------------------------------------- itineraries

  @Get('itineraries')
  @ApiOperation({ summary: 'List itineraries, all statuses (admin)' })
  async listItineraries(@Query('status') status?: string) {
    return this.adminService.listItineraries(status);
  }

  @Get('itineraries/:id')
  @ApiOperation({ summary: 'Get itinerary by id, any status (admin)' })
  @ApiResponse({ status: 404, description: 'Not found' })
  async getItinerary(@Param('id') id: string) {
    return this.adminService.getItinerary(id);
  }

  @Post('itineraries')
  @ApiOperation({ summary: 'Create an itinerary with ordered stops (admin)' })
  async createItinerary(
    @Request() req: { user?: { id?: string; sub?: string } },
    @Body() dto: CreateItineraryDto
  ) {
    return this.adminService.createItinerary(dto, this.adminId(req));
  }

  @Patch('itineraries/:id')
  @ApiOperation({ summary: 'Update an itinerary (admin)' })
  async updateItinerary(@Param('id') id: string, @Body() dto: UpdateItineraryDto) {
    return this.adminService.updateItinerary(id, dto);
  }

  @Delete('itineraries/:id')
  @ApiOperation({ summary: 'Delete an itinerary (admin)' })
  async deleteItinerary(@Param('id') id: string) {
    return this.adminService.deleteItinerary(id);
  }

  // -------------------------------------------------------------- neighborhoods

  @Get('neighborhoods')
  @ApiOperation({ summary: 'List neighborhoods, all statuses (admin)' })
  async listNeighborhoods(@Query('status') status?: string) {
    return this.adminService.listNeighborhoods(status);
  }

  @Get('neighborhoods/:id')
  @ApiOperation({ summary: 'Get neighborhood by id, any status (admin)' })
  @ApiResponse({ status: 404, description: 'Not found' })
  async getNeighborhood(@Param('id') id: string) {
    return this.adminService.getNeighborhood(id);
  }

  @Post('neighborhoods')
  @ApiOperation({ summary: 'Create a neighborhood with places (admin)' })
  async createNeighborhood(
    @Request() req: { user?: { id?: string; sub?: string } },
    @Body() dto: CreateNeighborhoodDto
  ) {
    return this.adminService.createNeighborhood(dto, this.adminId(req));
  }

  @Patch('neighborhoods/:id')
  @ApiOperation({ summary: 'Update a neighborhood (admin)' })
  async updateNeighborhood(@Param('id') id: string, @Body() dto: UpdateNeighborhoodDto) {
    return this.adminService.updateNeighborhood(id, dto);
  }

  @Delete('neighborhoods/:id')
  @ApiOperation({ summary: 'Delete a neighborhood (admin)' })
  async deleteNeighborhood(@Param('id') id: string) {
    return this.adminService.deleteNeighborhood(id);
  }

  // ------------------------------------------------------------------- partners

  @Get('partners')
  @ApiOperation({ summary: 'List partners, all statuses (admin)' })
  async listPartners(@Query('status') status?: string) {
    return this.adminService.listPartners(status);
  }

  @Get('partners/:id')
  @ApiOperation({ summary: 'Get partner by id, any status (admin)' })
  @ApiResponse({ status: 404, description: 'Not found' })
  async getPartner(@Param('id') id: string) {
    return this.adminService.getPartner(id);
  }

  @Post('partners')
  @ApiOperation({ summary: 'Create a partner (admin)' })
  async createPartner(
    @Request() req: { user?: { id?: string; sub?: string } },
    @Body() dto: CreatePartnerDto
  ) {
    return this.adminService.createPartner(dto, this.adminId(req));
  }

  @Patch('partners/:id')
  @ApiOperation({ summary: 'Update a partner (admin)' })
  async updatePartner(@Param('id') id: string, @Body() dto: UpdatePartnerDto) {
    return this.adminService.updatePartner(id, dto);
  }

  @Delete('partners/:id')
  @ApiOperation({ summary: 'Delete a partner and cascade its offers (admin)' })
  async deletePartner(@Param('id') id: string) {
    return this.adminService.deletePartner(id);
  }

  // --------------------------------------------------------------------- offers

  @Get('partners/:partnerId/offers')
  @ApiOperation({ summary: "List a partner's offers, all statuses (admin)" })
  async listOffers(@Param('partnerId') partnerId: string, @Query('status') status?: string) {
    void partnerId;
    return this.adminService.listOffers(status);
  }
  @Get('offers/:id')
  @ApiOperation({ summary: 'Get offer by id, any status (admin)' })
  @ApiResponse({ status: 404, description: 'Not found' })
  async getOffer(@Param('id') id: string) {
    return this.adminService.getOffer(id);
  }

  @Post('partners/:partnerId/offers')
  @ApiOperation({ summary: 'Create an offer under a partner (admin)' })
  async createOffer(@Param('partnerId') partnerId: string, @Body() dto: CreatePartnerOfferDto) {
    return this.adminService.createOffer(partnerId, dto);
  }

  @Patch('offers/:id')
  @ApiOperation({ summary: 'Update an offer (admin)' })
  async updateOffer(@Param('id') id: string, @Body() dto: UpdatePartnerOfferDto) {
    return this.adminService.updateOffer(id, dto);
  }

  @Delete('offers/:id')
  @ApiOperation({ summary: 'Delete an offer (admin)' })
  async deleteOffer(@Param('id') id: string) {
    return this.adminService.deleteOffer(id);
  }
}
