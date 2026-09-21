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
  HttpCode,
  HttpStatus,
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import { AgbalaService } from './agbala.service';
import { AuditLogService } from '../../audit/audit.service';
import { CreateStoryworldDto } from './dto/create-storyworld.dto';
import { UpdateStoryworldDto } from './dto/update-storyworld.dto';
import { CreateCharacterDto } from './dto/create-character.dto';
import { UpdateCharacterDto } from './dto/update-character.dto';
import { CreatePathDto } from './dto/create-path.dto';
import { CreateQuizDto } from './dto/create-quiz.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';

interface AdminRequest extends Request {
  user?: { id?: string; sub?: string };
}

function resolveId(result: unknown): string | undefined {
  if (!result || typeof result !== 'object') return undefined;
  const r = result as Record<string, unknown>;
  return (
    (r.id as string | undefined) ||
    ((r.data as Record<string, unknown> | undefined)?.id as string | undefined)
  );
}

@Controller('admin/agbala')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin', 'superadmin')
export class AgbalaController {
  constructor(
    private readonly agbalaService: AgbalaService,
    private readonly auditLogService: AuditLogService
  ) {}

  // === Storyworlds ===
  @Get('storyworlds')
  async getStoryworlds(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string
  ) {
    // Caller identity reaches upstream via UpstreamAuthMiddleware's
    // request-scoped context — no per-handler header plumbing needed.
    return this.agbalaService.getStoryworlds({
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
      search,
    });
  }

  @Get('storyworlds/:id')
  async getStoryworld(@Param('id') id: string) {
    return this.agbalaService.getStoryworld(id);
  }

  @Post('storyworlds')
  async createStoryworld(@Body() dto: CreateStoryworldDto, @Req() req: AdminRequest) {
    const result = await this.agbalaService.createStoryworld(dto);
    this.auditLogService.log({
      action: 'agbala.storyworld.created',
      targetType: 'agbala_storyworld',
      targetId: resolveId(result),
      details: { name: dto.title },
      actorId: resolveActorId(req),
      ipAddress: req.ip || '',
    });
    return result;
  }

  @Patch('storyworlds/:id')
  async updateStoryworld(
    @Param('id') id: string,
    @Body() dto: UpdateStoryworldDto,
    @Req() req: AdminRequest
  ) {
    const result = await this.agbalaService.updateStoryworld(id, dto);
    this.auditLogService.log({
      action: 'agbala.storyworld.updated',
      targetType: 'agbala_storyworld',
      targetId: id,
      details: dto as Record<string, unknown>,
      actorId: resolveActorId(req),
      ipAddress: req.ip || '',
    });
    return result;
  }

  @Delete('storyworlds/:id')
  @HttpCode(HttpStatus.OK)
  async deleteStoryworld(@Param('id') id: string, @Req() req: AdminRequest) {
    const result = await this.agbalaService.deleteStoryworld(id);
    this.auditLogService.log({
      action: 'agbala.storyworld.deleted',
      targetType: 'agbala_storyworld',
      targetId: id,
      details: {},
      actorId: resolveActorId(req),
      ipAddress: req.ip || '',
    });
    return result;
  }

  // === Characters ===
  @Get('storyworlds/:storyworldId/characters')
  async getCharacters(@Param('storyworldId') storyworldId: string) {
    return this.agbalaService.getCharacters(storyworldId);
  }

  @Post('storyworlds/:storyworldId/characters')
  async createCharacter(
    @Param('storyworldId') storyworldId: string,
    @Body() dto: CreateCharacterDto,
    @Req() req: AdminRequest
  ) {
    const result = await this.agbalaService.createCharacter(storyworldId, dto);
    this.auditLogService.log({
      action: 'agbala.character.created',
      targetType: 'agbala_character',
      targetId: resolveId(result),
      details: { name: dto.name, storyworldId },
      actorId: resolveActorId(req),
      ipAddress: req.ip || '',
    });
    return result;
  }

  @Patch('characters/:id')
  async updateCharacter(
    @Param('id') id: string,
    @Body() dto: UpdateCharacterDto,
    @Req() req: AdminRequest
  ) {
    const result = await this.agbalaService.updateCharacter(id, dto);
    this.auditLogService.log({
      action: 'agbala.character.updated',
      targetType: 'agbala_character',
      targetId: id,
      details: dto as Record<string, unknown>,
      actorId: resolveActorId(req),
      ipAddress: req.ip || '',
    });
    return result;
  }

  @Delete('characters/:id')
  @HttpCode(HttpStatus.OK)
  async deleteCharacter(@Param('id') id: string, @Req() req: AdminRequest) {
    const result = await this.agbalaService.deleteCharacter(id);
    this.auditLogService.log({
      action: 'agbala.character.deleted',
      targetType: 'agbala_character',
      targetId: id,
      details: {},
      actorId: resolveActorId(req),
      ipAddress: req.ip || '',
    });
    return result;
  }

  // === Paths ===
  @Get('storyworlds/:storyworldId/paths')
  async getPaths(
    @Param('storyworldId') storyworldId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string
  ) {
    // Caller identity reaches upstream via UpstreamAuthMiddleware's
    // request-scoped context — no per-handler header plumbing needed.
    return this.agbalaService.getPaths({
      storyworldId,
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
      search,
    });
  }

  @Post('storyworlds/:storyworldId/paths')
  async createPath(
    @Param('storyworldId') storyworldId: string,
    @Body() dto: CreatePathDto,
    @Req() req: AdminRequest
  ) {
    const result = await this.agbalaService.createPath(storyworldId, dto);
    this.auditLogService.log({
      action: 'agbala.path.created',
      targetType: 'agbala_path',
      targetId: resolveId(result),
      details: { name: dto.name, storyworldId },
      actorId: resolveActorId(req),
      ipAddress: req.ip || '',
    });
    return result;
  }

  @Patch('paths/:id')
  async updatePath(
    @Param('id') id: string,
    @Body() dto: Partial<CreatePathDto>,
    @Req() req: AdminRequest
  ) {
    const result = await this.agbalaService.updatePath(id, dto);
    this.auditLogService.log({
      action: 'agbala.path.updated',
      targetType: 'agbala_path',
      targetId: id,
      details: dto as Record<string, unknown>,
      actorId: resolveActorId(req),
      ipAddress: req.ip || '',
    });
    return result;
  }

  @Delete('paths/:id')
  @HttpCode(HttpStatus.OK)
  async deletePath(@Param('id') id: string, @Req() req: AdminRequest) {
    const result = await this.agbalaService.deletePath(id);
    this.auditLogService.log({
      action: 'agbala.path.deleted',
      targetType: 'agbala_path',
      targetId: id,
      details: {},
      actorId: resolveActorId(req),
      ipAddress: req.ip || '',
    });
    return result;
  }

  // === Quizzes ===
  @Get('quizzes')
  async getQuizzes(
    @Query('storyworldId') storyworldId?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string
  ) {
    return this.agbalaService.getQuizzes({
      storyworldId,
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
    });
  }

  @Post('quizzes')
  async createQuiz(@Body() dto: CreateQuizDto, @Req() req: AdminRequest) {
    const result = await this.agbalaService.createQuiz(dto);
    this.auditLogService.log({
      action: 'agbala.quiz.created',
      targetType: 'agbala_quiz',
      targetId: resolveId(result),
      details: { title: dto.title },
      actorId: resolveActorId(req),
      ipAddress: req.ip || '',
    });
    return result;
  }

  @Delete('quizzes/:id')
  @HttpCode(HttpStatus.OK)
  async deleteQuiz(@Param('id') id: string, @Req() req: AdminRequest) {
    const result = await this.agbalaService.deleteQuiz(id);
    this.auditLogService.log({
      action: 'agbala.quiz.deleted',
      targetType: 'agbala_quiz',
      targetId: id,
      details: {},
      actorId: resolveActorId(req),
      ipAddress: req.ip || '',
    });
    return result;
  }

  // === Moderation ===
  @Get('moderation/review-queue')
  async getReviewQueue(@Query('page') page?: string, @Query('limit') limit?: string) {
    return this.agbalaService.getPendingReviews({
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
    });
  }

  @Post('moderation/:contentId/approve')
  async approveContent(@Param('contentId') contentId: string, @Req() req: AdminRequest) {
    const result = await this.agbalaService.approveContent(contentId);
    this.auditLogService.log({
      action: 'agbala.content.approved',
      targetType: 'agbala_content',
      targetId: contentId,
      details: {},
      actorId: resolveActorId(req),
      ipAddress: req.ip || '',
    });
    return result;
  }

  @Post('moderation/:contentId/reject')
  async rejectContent(
    @Param('contentId') contentId: string,
    @Body('reason') reason: string,
    @Req() req: AdminRequest
  ) {
    const result = await this.agbalaService.rejectContent(contentId, reason);
    this.auditLogService.log({
      action: 'agbala.content.rejected',
      targetType: 'agbala_content',
      targetId: contentId,
      details: { reason },
      actorId: resolveActorId(req),
      ipAddress: req.ip || '',
    });
    return result;
  }
}

function resolveActorId(req: AdminRequest): string {
  return req.user?.id || req.user?.sub || 'unknown';
}
