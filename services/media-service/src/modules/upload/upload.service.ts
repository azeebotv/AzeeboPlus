import { Injectable } from '@nestjs/common';
import { S3Service } from './s3.service';

export interface UploadResponse {
  key: string;
  url: string;
  cdnUrl: string;
  filename: string;
  mimetype: string;
  size: number;
}

export interface PresignedUploadResponse {
  uploadUrl: string;
  key: string;
  cdnUrl: string;
  expiresIn: number;
}

@Injectable()
export class UploadService {
  constructor(private readonly s3Service: S3Service) {}

  async uploadImage(file: Express.Multer.File): Promise<UploadResponse> {
    const result = await this.s3Service.uploadFile(file, 'images');
    return this.formatUploadResponse(result, file);
  }

  async uploadVideo(file: Express.Multer.File): Promise<UploadResponse> {
    const result = await this.s3Service.uploadFile(file, 'videos');
    return this.formatUploadResponse(result, file);
  }

  async uploadAudio(file: Express.Multer.File): Promise<UploadResponse> {
    const result = await this.s3Service.uploadFile(file, 'audio');
    return this.formatUploadResponse(result, file);
  }

  async uploadDocument(file: Express.Multer.File): Promise<UploadResponse> {
    const result = await this.s3Service.uploadFile(file, 'documents');
    return this.formatUploadResponse(result, file);
  }

  async uploadThumbnail(file: Express.Multer.File): Promise<UploadResponse> {
    const result = await this.s3Service.uploadFile(file, 'thumbnails');
    return this.formatUploadResponse(result, file);
  }

  async uploadAvatar(file: Express.Multer.File): Promise<UploadResponse> {
    const result = await this.s3Service.uploadFile(file, 'avatars');
    return this.formatUploadResponse(result, file);
  }

  async uploadBanner(file: Express.Multer.File): Promise<UploadResponse> {
    const result = await this.s3Service.uploadFile(file, 'banners');
    return this.formatUploadResponse(result, file);
  }

  async getPresignedDownloadUrl(key: string, expiresIn = 3600): Promise<string> {
    return this.s3Service.getSignedDownloadUrl(key, expiresIn);
  }

  async getPresignedUploadUrl(
    type: 'image' | 'video' | 'audio' | 'document',
    fileId: string,
    extension: string,
    contentType: string,
    expiresIn = 3600,
  ): Promise<PresignedUploadResponse> {
    const folder = this.getFolderForType(type);
    const key = this.s3Service.generateKey(folder, fileId, extension);
    const result = await this.s3Service.getSignedUploadUrl(key, contentType, expiresIn);

    return {
      uploadUrl: result.uploadUrl,
      key: result.key,
      cdnUrl: result.key,
      expiresIn,
    };
  }

  async deleteFile(key: string): Promise<void> {
    await this.s3Service.deleteFile(key);
  }

  async getFileMetadata(key: string) {
    return this.s3Service.getFileMetadata(key);
  }

  private formatUploadResponse(
    result: { key: string; url: string; cdnUrl: string },
    file: Express.Multer.File,
  ): UploadResponse {
    return {
      key: result.key,
      url: result.url,
      cdnUrl: result.cdnUrl,
      filename: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
    };
  }

  private getFolderForType(type: string): string {
    const folders: Record<string, string> = {
      image: 'images',
      video: 'videos',
      audio: 'audio',
      document: 'documents',
    };
    return folders[type] || 'misc';
  }
}
