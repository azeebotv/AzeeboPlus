import { Controller, Get, Post, Patch, Body, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';

import { CreatorsService } from './creators.service';
import { CreatorResponse } from './interfaces/creator-response.interface';

interface UpdateProfileBody {
  displayName?: string;
  bio?: string;
  avatar?: string;
}

interface CreateUploadBody {
  title: string;
  description?: string;
  url: string;
  thumbnail?: string;
}

@ApiTags('Creators')
@Controller('creators')
export class CreatorsController {
  constructor(private readonly creatorsService: CreatorsService) {}

  @Post('onboard')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Creator onboarding' })
  @ApiResponse({ status: 201, description: 'Creator profile created' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async onboard(@Request() req: { user: { sub: string } }): Promise<CreatorResponse> {
    return this.creatorsService.onboard(req.user.sub);
  }

  @Get('me')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Get creator profile' })
  @ApiResponse({ status: 200, description: 'Creator profile' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getMyProfile(@Request() req: { user: { sub: string } }): Promise<CreatorResponse> {
    return this.creatorsService.getMyProfile(req.user.sub);
  }

  @Patch('me')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Update creator profile' })
  @ApiResponse({ status: 200, description: 'Profile updated' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async updateProfile(
    @Request() req: { user: { sub: string } },
    @Body() body: UpdateProfileBody
  ): Promise<CreatorResponse> {
    return this.creatorsService.updateProfile(req.user.sub, body);
  }

  @Post('uploads')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Create upload' })
  @ApiResponse({ status: 201, description: 'Upload created' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async createUpload(
    @Request() req: { user: { sub: string } },
    @Body() body: CreateUploadBody
  ): Promise<CreatorResponse> {
    return this.creatorsService.createUpload(req.user.sub, body);
  }

  @Get('uploads')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'List own uploads' })
  @ApiResponse({ status: 200, description: 'Uploads list' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async listUploads(@Request() req: { user: { sub: string } }): Promise<CreatorResponse> {
    return this.creatorsService.listUploads(req.user.sub);
  }

  @Get('discover')
  @ApiOperation({ summary: 'Creator discovery' })
  @ApiResponse({ status: 200, description: 'Discover creators' })
  async discover(): Promise<CreatorResponse> {
    return this.creatorsService.discover();
  }
}
