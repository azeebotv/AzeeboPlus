import { Controller, Get, Post, Put, Patch, Delete, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CharactersService } from './characters.service';

@ApiTags('Characters')
@Controller('characters')
export class CharactersController {
  constructor(private readonly charactersService: CharactersService) {}

  @Get()
  @ApiOperation({ summary: 'Get all characters' })
  @ApiResponse({ status: 200, description: 'List of characters' })
  async getCharacters(
    @Query('page') page = 1,
    @Query('limit') limit = 20,
    @Query('universe') universeSlug?: string,
  ) {
    return this.charactersService.getCharacters(Number(page), Number(limit), universeSlug);
  }

  @Get(':slug')
  @ApiOperation({ summary: 'Get character by slug' })
  @ApiResponse({ status: 200, description: 'Character details' })
  async getCharacter(@Param('slug') slug: string) {
    return this.charactersService.getCharacterBySlug(slug);
  }

  @Get(':slug/relationships')
  @ApiOperation({ summary: 'Get character relationships' })
  @ApiResponse({ status: 200, description: 'Character relationships' })
  async getCharacterRelationships(@Param('slug') slug: string) {
    return this.charactersService.getCharacterRelationships(slug);
  }

  @Post()
  @ApiOperation({ summary: 'Create new character' })
  @ApiResponse({ status: 201, description: 'Character created' })
  async createCharacter(
    @Body() data: { name: string; description?: string; universeId: string; role?: string; avatarUrl?: string },
  ) {
    return this.charactersService.createCharacter(data);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update character' })
  @ApiResponse({ status: 200, description: 'Character updated' })
  async updateCharacter(
    @Param('id') id: string,
    @Body() data: Partial<{ name: string; description: string; role: string; avatarUrl: string }>,
  ) {
    return this.charactersService.updateCharacter(id, data);
  }

  @Post(':id/relationships')
  @ApiOperation({ summary: 'Add character relationship' })
  @ApiResponse({ status: 201, description: 'Relationship added' })
  async addRelationship(
    @Param('id') id: string,
    @Body() data: { toId: string; type: string; description?: string },
  ) {
    return this.charactersService.addRelationship(id, data);
  }
}