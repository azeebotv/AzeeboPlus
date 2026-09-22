import { Inject, Controller, Get, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Public } from '@azeebo/security';
import { GuidesService } from './guides.service';

/**
 * Lifestyle guides — public consumer catalogs for the 9TLIFE web pages.
 * All routes are @Public(): the pages run for anonymous visitors and every
 * handler only exposes published/active content.
 */
@ApiTags('Guides')
@Public()
@Controller('lifestyle')
export class GuidesController {
  constructor(@Inject(GuidesService) private readonly guidesService: GuidesService) {}

  // ---------------------------------------------------------------- itineraries

  @Get('itineraries')
  @ApiOperation({ summary: 'List published itineraries' })
  @ApiResponse({ status: 200, description: 'Itinerary list' })
  async getItineraries(): Promise<unknown> {
    return this.guidesService.getItineraries();
  }

  @Get('itineraries/:id')
  @ApiOperation({ summary: 'Get itinerary details' })
  @ApiResponse({ status: 200, description: 'Itinerary with ordered stops' })
  @ApiResponse({ status: 404, description: 'Not found' })
  async getItinerary(@Param('id') id: string): Promise<unknown> {
    return this.guidesService.getItinerary(id);
  }

  // --------------------------------------------------------------- neighborhoods

  @Get('neighborhoods')
  @ApiOperation({ summary: 'List published neighborhoods' })
  @ApiResponse({ status: 200, description: 'Neighborhood list' })
  async getNeighborhoods(): Promise<unknown> {
    return this.guidesService.getNeighborhoods();
  }

  @Get('neighborhoods/:id')
  @ApiOperation({ summary: 'Get neighborhood details' })
  @ApiResponse({ status: 200, description: 'Neighborhood with places' })
  @ApiResponse({ status: 404, description: 'Not found' })
  async getNeighborhood(@Param('id') id: string): Promise<unknown> {
    return this.guidesService.getNeighborhood(id);
  }

  // ------------------------------------------------------------------- partners

  @Get('partners')
  @ApiOperation({ summary: 'List published partners' })
  @ApiResponse({ status: 200, description: 'Partner list' })
  async getPartners(): Promise<unknown> {
    return this.guidesService.getPartners();
  }

  @Get('partners/:id')
  @ApiOperation({ summary: 'Get partner details' })
  @ApiResponse({ status: 200, description: 'Partner with active offers' })
  @ApiResponse({ status: 404, description: 'Not found' })
  async getPartner(@Param('id') id: string): Promise<unknown> {
    return this.guidesService.getPartner(id);
  }

  // --------------------------------------------------------------------- offers

  @Get('offers')
  @ApiOperation({ summary: 'List active offers' })
  @ApiResponse({ status: 200, description: 'Offer list' })
  async getOffers(): Promise<unknown> {
    return this.guidesService.getOffers();
  }

  @Get('offers/:id')
  @ApiOperation({ summary: 'Get offer details' })
  @ApiResponse({ status: 200, description: 'Offer with partner name' })
  @ApiResponse({ status: 404, description: 'Not found' })
  async getOffer(@Param('id') id: string): Promise<unknown> {
    return this.guidesService.getOffer(id);
  }
}
