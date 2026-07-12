import { Inject,
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
 } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { FilmmakerService } from './filmmaker.service.js';

@ApiTags('Filmmaker')
@Controller('v1/movies/filmmakers')
export class FilmmakerController {
  constructor(@Inject(FilmmakerService) private readonly filmmakerService: FilmmakerService) {}

  @Get('projects')
  @ApiOperation({ summary: 'Get filmmaker projects' })
  @ApiResponse({ status: 200, description: 'Projects list' })
  async getProjects(
    @Query('page') page = 1,
    @Query('limit') limit = 20,
    @Query('status') status?: string,
    @Query('filmmakerId') filmmakerId?: string
  ): Promise<unknown> {
    return this.filmmakerService.getProjects(Number(page), Number(limit), status, filmmakerId);
  }

  @Get('projects/:id')
  @ApiOperation({ summary: 'Get project by id' })
  @ApiResponse({ status: 200, description: 'Project details' })
  async getProject(@Param('id') id: string): Promise<unknown> {
    return this.filmmakerService.getProjectById(id);
  }

  @Post('projects')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Create project' })
  @ApiResponse({ status: 201, description: 'Project created' })
  async createProject(
    @Body()
    body: {
      title: string;
      description?: string;
      thumbnail?: string;
      fundingGoal?: number;
      targetDate?: string;
    },
    @Request() req: { user: { id: string } }
  ): Promise<unknown> {
    return this.filmmakerService.createProject(req.user.id, body);
  }

  @Patch('projects/:id')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Update project' })
  @ApiResponse({ status: 200, description: 'Project updated' })
  async updateProject(
    @Param('id') id: string,
    @Body()
    body: {
      title?: string;
      description?: string;
      thumbnail?: string;
      status?: string;
      fundingGoal?: number;
      targetDate?: string;
    },
    @Request() req: { user: { id: string } }
  ): Promise<unknown> {
    return this.filmmakerService.updateProject(id, req.user.id, body);
  }

  @Post('projects/:id/updates')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Add project update' })
  @ApiResponse({ status: 201, description: 'Update added' })
  async addUpdate(
    @Param('id') projectId: string,
    @Body() body: { title: string; content: string },
    @Request() req: { user: { id: string } }
  ): Promise<unknown> {
    return this.filmmakerService.addUpdate(projectId, req.user.id, body);
  }

  @Post('back')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Back a project' })
  @ApiResponse({ status: 201, description: 'Backed' })
  async backProject(
    @Body() body: { projectId: string; amount: number },
    @Request() req: { user: { id: string } }
  ): Promise<unknown> {
    return this.filmmakerService.backProject(req.user.id, body.projectId, body.amount);
  }

  @Get('projects/:id/backers')
  @ApiOperation({ summary: 'Get project backers' })
  @ApiResponse({ status: 200, description: 'Backers list' })
  async getBackers(
    @Param('id') projectId: string,
    @Query('page') page = 1,
    @Query('limit') limit = 50
  ): Promise<unknown> {
    return this.filmmakerService.getBackers(projectId, Number(page), Number(limit));
  }
}
