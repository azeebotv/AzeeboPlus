import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  Query,
  Body,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadService } from './upload.service';

@Controller('api/media')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post('upload/image')
  @UseInterceptors(FileInterceptor('file'))
  async uploadImage(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }
    return this.uploadService.uploadImage(file);
  }

  @Post('upload/video')
  @UseInterceptors(FileInterceptor('file'))
  async uploadVideo(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }
    return this.uploadService.uploadVideo(file);
  }

  @Post('upload/audio')
  @UseInterceptors(FileInterceptor('file'))
  async uploadAudio(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }
    return this.uploadService.uploadAudio(file);
  }

  @Post('upload/document')
  @UseInterceptors(FileInterceptor('file'))
  async uploadDocument(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }
    return this.uploadService.uploadDocument(file);
  }

  @Post('upload/thumbnail')
  @UseInterceptors(FileInterceptor('file'))
  async uploadThumbnail(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }
    return this.uploadService.uploadThumbnail(file);
  }

  @Post('upload/avatar')
  @UseInterceptors(FileInterceptor('file'))
  async uploadAvatar(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }
    return this.uploadService.uploadAvatar(file);
  }

  @Post('upload/banner')
  @UseInterceptors(FileInterceptor('file'))
  async uploadBanner(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }
    return this.uploadService.uploadBanner(file);
  }

  @Get('presigned/upload')
  async getPresignedUploadUrl(
    @Query('type') type: 'image' | 'video' | 'audio' | 'document',
    @Query('fileId') fileId: string,
    @Query('extension') extension: string,
    @Query('contentType') contentType: string,
    @Query('expiresIn') expiresIn = 3600,
  ) {
    if (!type || !fileId || !extension || !contentType) {
      throw new BadRequestException('Missing required parameters: type, fileId, extension, contentType');
    }
    return this.uploadService.getPresignedUploadUrl(
      type,
      fileId,
      extension,
      contentType,
      Number(expiresIn),
    );
  }

  @Get('presigned/download')
  async getPresignedDownloadUrl(
    @Query('key') key: string,
    @Query('expiresIn') expiresIn = 3600,
  ) {
    if (!key) {
      throw new BadRequestException('Missing required parameter: key');
    }
    const url = await this.uploadService.getPresignedDownloadUrl(key, Number(expiresIn));
    return { url, expiresIn: Number(expiresIn) };
  }

  @Get('metadata')
  async getFileMetadata(@Query('key') key: string) {
    if (!key) {
      throw new BadRequestException('Missing required parameter: key');
    }
    return this.uploadService.getFileMetadata(key);
  }

  @Delete(':key')
  async deleteFile(@Param('key') key: string) {
    await this.uploadService.deleteFile(decodeURIComponent(key));
    return { success: true, message: 'File deleted successfully' };
  }
}
