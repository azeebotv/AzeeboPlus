import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { CharactersService } from './characters.service';
import { CreateCharacterDto } from './dto/create-character.dto';
import { CreateRelationshipDto } from './dto/create-relationship.dto';

@ApiTags('Characters')
@Controller('v1/vertical/characters')
export class CharactersController {
  constructor(private readonly charactersService: CharactersService) {}

  @Get()
  @ApiOperation({ summary: 'Get all characters' })
  @ApiResponse({ status: 200, description: 'List of characters' })
  async getCharacters(
    @Query('page') page = 1,
    @Query('limit') limit = 20,
    @Query('universe') universeSlug?: string
  ): Promise<unknown> {
    return this.charactersService.getCharacters(Number(page), Number(limit), universeSlug);
  }

  @Get(':slug')
  @ApiOperation({ summary: 'Get character by slug' })
  @ApiResponse({ status: 200, description: 'Character details' })
  async getCharacter(@Param('slug') slug: string): Promise<unknown> {
    return this.charactersService.getCharacterBySlug(slug);
  }

  @Get(':slug/relationships')
  @ApiOperation({ summary: 'Get character relationships' })
  @ApiResponse({ status: 200, description: 'Character relationships' })
  async getCharacterRelationships(@Param('slug') slug: string): Promise<unknown> {
    return this.charactersService.getCharacterRelationships(slug);
  }

  @Post()
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Create new character' })
  @ApiResponse({ status: 201, description: 'Character created' })
  async createCharacter(@Body() data: CreateCharacterDto): Promise<unknown> {
    return this.charactersService.createCharacter(data);
  }

  @Patch(':id')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Update character' })
  @ApiResponse({ status: 200, description: 'Character updated' })
  async updateCharacter(
    @Param('id') id: string,
    @Body() data: Partial<{ name: string; description: string; role: string; avatarUrl: string }>
  ): Promise<unknown> {
    return this.charactersService.updateCharacter(id, data);
  }

  @Post(':id/relationships')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Add character relationship' })
  @ApiResponse({ status: 201, description: 'Relationship added' })
  async addRelationship(
    @Param('id') id: string,
    @Body() data: CreateRelationshipDto
  ): Promise<unknown> {
    return this.charactersService.addRelationship(id, data);
  }
}
