import { Inject, Controller, Get, Post, Patch, Body, Param, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { KnowledgeService } from './knowledge.service.js';
import { CreateCanonicalEventDto } from './dto/create-canonical-event.dto.js';
import { CreateKnowledgeUnitDto } from './dto/create-knowledge-unit.dto.js';
import { GrantKnowledgeDto } from './dto/grant-knowledge.dto.js';
import { CorrectKnowledgeUnitDto } from './dto/correct-knowledge-unit.dto.js';

@ApiTags('Knowledge')
@Controller('knowledge')
export class KnowledgeController {
  constructor(@Inject(KnowledgeService) private readonly knowledgeService: KnowledgeService) {}

  // ========================
  // Canonical Events (TAA §16)
  // ========================

  @Post('events')
  @ApiOperation({ summary: 'Create a canonical event' })
  @ApiResponse({ status: 201, description: 'Canonical event created' })
  async createCanonicalEvent(@Body() dto: CreateCanonicalEventDto) {
    const event = await this.knowledgeService.createCanonicalEvent({
      eventCode: dto.eventCode,
      title: dto.title,
      description: dto.description,
      universeId: dto.universeId,
      eventDate: new Date(dto.eventDate),
      metadata: dto.metadata,
    });
    return { success: true, data: event };
  }

  @Get('events/:id')
  @ApiOperation({ summary: 'Get canonical event by ID' })
  @ApiResponse({ status: 200, description: 'Canonical event' })
  async getCanonicalEvent(@Param('id', ParseUUIDPipe) id: string) {
    const event = await this.knowledgeService.getCanonicalEvent(id);
    return { success: true, data: event };
  }

  @Patch('events/:id/supersede')
  @ApiOperation({ summary: 'Supersede a canonical event (increment version)' })
  @ApiResponse({ status: 200, description: 'Event superseded' })
  async supersedeCanonicalEvent(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { metadata?: Record<string, unknown> }
  ) {
    const event = await this.knowledgeService.updateCanonicalEventVersion(id, body.metadata);
    return { success: true, data: event };
  }

  // ========================
  // Knowledge Units (TAA §16)
  // ========================

  @Post('units')
  @ApiOperation({ summary: 'Create a knowledge unit' })
  @ApiResponse({ status: 201, description: 'Knowledge unit created' })
  async createKnowledgeUnit(@Body() dto: CreateKnowledgeUnitDto) {
    const unit = await this.knowledgeService.createKnowledgeUnit({
      canonicalEventId: dto.canonicalEventId,
      title: dto.title,
      description: dto.description,
      knowledgeType: dto.knowledgeType,
      spoilerLevel: dto.spoilerLevel,
      metadata: dto.metadata,
    });
    return { success: true, data: unit };
  }

  @Get('units/:id')
  @ApiOperation({ summary: 'Get knowledge unit by ID' })
  @ApiResponse({ status: 200, description: 'Knowledge unit' })
  async getKnowledgeUnit(@Param('id', ParseUUIDPipe) id: string) {
    const unit = await this.knowledgeService.getKnowledgeUnit(id);
    return { success: true, data: unit };
  }

  @Post('units/:id/correct')
  @ApiOperation({ summary: 'Correct a knowledge unit (creates new version with audit trail)' })
  @ApiResponse({ status: 201, description: 'Corrected knowledge unit' })
  async correctKnowledgeUnit(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CorrectKnowledgeUnitDto
  ) {
    const unit = await this.knowledgeService.correctKnowledgeUnit(id, {
      title: dto.title,
      description: dto.description,
      metadata: dto.metadata,
    });
    return { success: true, data: unit };
  }

  // ========================
  // User Knowledge Grants (TAA §16)
  // ========================

  @Post('grants')
  @ApiOperation({ summary: 'Grant knowledge to a user' })
  @ApiResponse({ status: 201, description: 'Knowledge grant created' })
  async grantKnowledge(@Body() dto: GrantKnowledgeDto) {
    const grant = await this.knowledgeService.grantKnowledge({
      userId: dto.userId,
      knowledgeUnitId: dto.knowledgeUnitId,
      grantSource: dto.grantSource,
      sourceId: dto.sourceId,
      expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : undefined,
      metadata: dto.metadata,
    });
    return { success: true, data: grant };
  }

  @Get('users/:userId/grants')
  @ApiOperation({ summary: 'Get all knowledge grants for a user' })
  @ApiResponse({ status: 200, description: 'User knowledge grants' })
  async getUserGrants(@Param('userId') userId: string) {
    const grants = await this.knowledgeService.getUserKnowledge(userId);
    return { success: true, data: grants };
  }

  @Get('users/:userId/known-ids')
  @ApiOperation({ summary: 'Get known unit IDs for a user' })
  @ApiResponse({ status: 200, description: 'Known unit IDs' })
  async getUserKnownUnitIds(@Param('userId') userId: string) {
    const ids = await this.knowledgeService.getUserKnownUnitIds(userId);
    return { success: true, data: { knownUnitIds: ids } };
  }

  // ========================
  // Knowledge Projection (TAA §16)
  // ========================

  @Get('users/:userId/projection')
  @ApiOperation({ summary: 'Get knowledge projection for a user' })
  @ApiResponse({ status: 200, description: 'Knowledge projection' })
  async getKnowledgeProjection(@Param('userId') userId: string) {
    const projection = await this.knowledgeService.getKnowledgeProjection(userId);
    return { success: true, data: projection };
  }

  @Post('users/:userId/projection/rebuild')
  @ApiOperation({ summary: 'Rebuild knowledge projection for a user' })
  @ApiResponse({ status: 200, description: 'Projection rebuilt' })
  async rebuildKnowledgeProjection(@Param('userId') userId: string) {
    const projection = await this.knowledgeService.rebuildKnowledgeProjection(userId);
    return { success: true, data: projection };
  }

  // ========================
  // Equivalence Sets (TAA §18)
  // ========================

  @Post('equivalence-sets')
  @ApiOperation({ summary: 'Create an equivalence set linking knowledge units across formats' })
  @ApiResponse({ status: 201, description: 'Equivalence set created' })
  async createEquivalenceSet(
    @Body() body: { setCode: string; name: string; knowledgeUnitIds: string[] }
  ) {
    const set = await this.knowledgeService.createEquivalenceSet(
      body.setCode,
      body.name,
      body.knowledgeUnitIds
    );
    return { success: true, data: set };
  }

  @Get('equivalence-sets/:setCode')
  @ApiOperation({ summary: 'Get equivalence set by code' })
  @ApiResponse({ status: 200, description: 'Equivalence set' })
  async getEquivalenceSet(@Param('setCode') setCode: string) {
    const set = await this.knowledgeService.getEquivalenceSet(setCode);
    return { success: true, data: set };
  }

  // ========================
  // Content Checkpoints (TAA §16-17)
  // ========================

  @Post('checkpoints')
  @ApiOperation({ summary: 'Create a content checkpoint' })
  @ApiResponse({ status: 201, description: 'Checkpoint created' })
  async createContentCheckpoint(
    @Body()
    body: {
      contentId: string;
      canonicalEventId: string;
      checkpointType?: string;
      title: string;
      description?: string;
      triggerCondition?: Record<string, unknown>;
    }
  ) {
    const checkpoint = await this.knowledgeService.createContentCheckpoint(body);
    return { success: true, data: checkpoint };
  }

  @Post('checkpoints/:id/trigger')
  @ApiOperation({ summary: 'Trigger a checkpoint for a user (grants knowledge)' })
  @ApiResponse({ status: 200, description: 'Checkpoint triggered, knowledge granted' })
  async triggerCheckpoint(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { userId: string }
  ) {
    const result = await this.knowledgeService.triggerCheckpoint(id, body.userId);
    return { success: true, data: result };
  }

  // ========================
  // Spoiler Control (TAA §18)
  // ========================

  @Post('spoiler-filter')
  @ApiOperation({ summary: 'Filter knowledge unit IDs by spoiler level' })
  @ApiResponse({ status: 200, description: 'Filtered unit IDs' })
  async filterBySpoilerLevel(@Body() body: { unitIds: string[]; maxSpoilerLevel: string }) {
    const filtered = await this.knowledgeService.filterBySpoilerLevel(
      body.unitIds,
      body.maxSpoilerLevel
    );
    return { success: true, data: { filteredUnitIds: filtered } };
  }
}
