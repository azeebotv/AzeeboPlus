import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { AdminGuard } from '@azeebo/security';
import { LoreService } from './lore.service';
import { CreateLoreData } from './lore.service';
import { UpdateLoreDto } from './dto/update-lore.dto';

@ApiTags('Lore')
@Controller('v1/vertical/lore')
export class LoreController {
  constructor(private readonly loreService: LoreService) {}

  @Get()
  @ApiOperation({ summary: 'Get lore entries' })
  @ApiResponse({ status: 200, description: 'Entries list' })
  async getEntries(
    @Query('page') page = 1,
    @Query('limit') limit = 20,
    @Query('universe') universeSlug?: string,
    @Query('category') category?: string,
    @Query('importance') importance?: string,
    @Query('status') status?: string
  ): Promise<unknown> {
    return this.loreService.getEntries(
      Number(page),
      Number(limit),
      universeSlug,
      category,
      importance,
      status
    );
  }

  @Get('categories')
  @ApiOperation({ summary: 'Get lore categories' })
  @ApiResponse({ status: 200, description: 'Categories list' })
  async getCategories(@Query('universe') universeSlug?: string): Promise<unknown> {
    return this.loreService.getCategories(universeSlug);
  }

  @Get(':slug')
  @ApiOperation({ summary: 'Get lore entry by slug' })
  @ApiResponse({ status: 200, description: 'Entry details' })
  async getEntry(@Param('slug') slug: string): Promise<unknown> {
    return this.loreService.getEntryBySlug(slug);
  }

  @Post()
  @UseGuards(AuthGuard('jwt'), AdminGuard)
  @ApiOperation({ summary: 'Create lore entry' })
  @ApiResponse({ status: 201, description: 'Entry created' })
  async createEntry(@Body() body: CreateLoreData): Promise<unknown> {
    return this.loreService.createEntry(body);
  }

  @Patch(':id')
  @UseGuards(AuthGuard('jwt'), AdminGuard)
  @ApiOperation({ summary: 'Update lore entry' })
  @ApiResponse({ status: 200, description: 'Entry updated' })
  async updateEntry(@Param('id') id: string, @Body() body: UpdateLoreDto): Promise<unknown> {
    return this.loreService.updateEntry(id, body);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'), AdminGuard)
  @ApiOperation({ summary: 'Delete lore entry' })
  @ApiResponse({ status: 200, description: 'Entry deleted' })
  async deleteEntry(@Param('id') id: string): Promise<unknown> {
    return this.loreService.deleteEntry(id);
  }
}
