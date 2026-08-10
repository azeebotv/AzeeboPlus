import { Test, TestingModule } from '@nestjs/testing';
import { UploadService } from './upload.service.js';
import { S3Service } from './s3.service';
import { ConfigService } from '@nestjs/config';
import { RedisService } from '@azeebo/shared-services';
import { FileValidationService } from '../../common/services/file-validation.service';
import { CdnPurgeService } from './cdn-purge.service';
import { FeatureFlagService } from '@azeebo/feature-flags';

describe('UploadService Integration', () => {
  let service: UploadService;

  const mockS3Service = {
    uploadFile: jest.fn(),
    getSignedDownloadUrl: jest.fn(),
    getSignedUploadUrl: jest.fn(),
    deleteFile: jest.fn(),
    getFileMetadata: jest.fn(),
    generateKey: jest.fn(),
    cleanupOrphanedFiles: jest.fn(),
  };

  const mockFileValidationService = {
    validateFile: jest.fn(),
    validatePresignedUpload: jest.fn(),
  };

  const mockRedisService = {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    scanKeys: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UploadService,
        { provide: S3Service, useValue: mockS3Service },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockImplementation((key: string, defaultValue?: unknown) => {
              const config: Record<string, unknown> = {
                CDN_URL: 'https://cdn.azeebo.com',
                TRANSCODING_ENABLED: true,
                ANALYTICS_SERVICE_URL: 'http://analytics-service',
              };
              return config[key] ?? defaultValue;
            }),
          },
        },
        { provide: RedisService, useValue: mockRedisService },
        { provide: FileValidationService, useValue: mockFileValidationService },
        { provide: FeatureFlagService, useValue: { isEnabled: jest.fn().mockResolvedValue(true) } },
        { provide: CdnPurgeService, useValue: { purgeKeys: jest.fn(), purgePrefix: jest.fn() } },
      ],
    }).compile();

    service = module.get<UploadService>(UploadService);

    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('uploadImage', () => {
    it('should upload image and return formatted response', async () => {
      const mockFile = {
        originalname: 'photo.jpg',
        mimetype: 'image/jpeg',
        size: 1024000,
        buffer: Buffer.from('test'),
      } as Express.Multer.File;

      const mockS3Result = {
        key: 'images/uuid-photo.jpg',
        url: 'https://s3.amazonaws.com/bucket/images/uuid-photo.jpg',
        cdnUrl: 'https://cdn.azeebo.com/images/uuid-photo.jpg',
      };

      mockFileValidationService.validateFile.mockReturnValue(undefined);
      mockS3Service.uploadFile.mockResolvedValue(mockS3Result);

      const result = await service.uploadImage(mockFile);

      expect(mockFileValidationService.validateFile).toHaveBeenCalledWith(mockFile, 'image');
      expect(mockS3Service.uploadFile).toHaveBeenCalledWith(mockFile, 'images');
      expect(result.key).toBe('images/uuid-photo.jpg');
      expect(result.filename).toBe('photo.jpg');
      expect(result.mimetype).toBe('image/jpeg');
      expect(result.size).toBe(1024000);
    });

    it('should throw when file validation fails', async () => {
      const mockFile = {
        originalname: 'malicious.exe',
        mimetype: 'application/x-executable',
        size: 1024,
      } as Express.Multer.File;

      mockFileValidationService.validateFile.mockImplementation(() => {
        throw new Error('Invalid file type');
      });

      await expect(service.uploadImage(mockFile)).rejects.toThrow('Invalid file type');
      expect(mockS3Service.uploadFile).not.toHaveBeenCalled();
    });
  });

  describe('uploadVideo', () => {
    it('should upload video and schedule transcoding', async () => {
      const mockFile = {
        originalname: 'video.mp4',
        mimetype: 'video/mp4',
        size: 50000000,
        buffer: Buffer.from('test'),
      } as Express.Multer.File;

      const mockS3Result = {
        key: 'videos/uuid-video.mp4',
        url: 'https://s3.amazonaws.com/bucket/videos/uuid-video.mp4',
        cdnUrl: 'https://cdn.azeebo.com/videos/uuid-video.mp4',
        duration: 120,
      };

      mockFileValidationService.validateFile.mockReturnValue(undefined);
      mockS3Service.uploadFile.mockResolvedValue(mockS3Result);
      mockRedisService.set.mockResolvedValue('OK');

      const result = await service.uploadVideo(mockFile);

      expect(mockFileValidationService.validateFile).toHaveBeenCalledWith(mockFile, 'video');
      expect(mockS3Service.uploadFile).toHaveBeenCalledWith(mockFile, 'videos');
      expect(result.key).toBe('videos/uuid-video.mp4');
      expect(result.duration).toBe(120);
      expect(mockRedisService.set).toHaveBeenCalled();
    });

    it('should not schedule transcoding when disabled', async () => {
      const module = await Test.createTestingModule({
        providers: [
          UploadService,
          { provide: S3Service, useValue: mockS3Service },
          {
            provide: ConfigService,
            useValue: {
              get: jest.fn().mockImplementation((key: string, defaultValue?: unknown) => {
                const config: Record<string, unknown> = {
                  CDN_URL: 'https://cdn.azeebo.com',
                  TRANSCODING_ENABLED: false,
                };
                return config[key] ?? defaultValue;
              }),
            },
          },
          { provide: RedisService, useValue: mockRedisService },
          { provide: FileValidationService, useValue: mockFileValidationService },
          { provide: FeatureFlagService, useValue: { isEnabled: jest.fn().mockResolvedValue(true) } },
          { provide: CdnPurgeService, useValue: { purgeKeys: jest.fn(), purgePrefix: jest.fn() } },
        ],
      }).compile();

      const disabledService = module.get<UploadService>(UploadService);

      const mockFile = {
        originalname: 'video.mp4',
        mimetype: 'video/mp4',
        size: 50000000,
      } as Express.Multer.File;

      mockS3Service.uploadFile.mockResolvedValue({
        key: 'videos/uuid-video.mp4',
        url: 'https://s3.amazonaws.com/bucket/videos/uuid-video.mp4',
        cdnUrl: 'https://cdn.azeebo.com/videos/uuid-video.mp4',
        duration: 120,
      });

      await disabledService.uploadVideo(mockFile);

      expect(mockRedisService.set).not.toHaveBeenCalled();
    });
  });

  describe('getPresignedUploadUrl', () => {
    it('should return presigned upload URL with CDN link', async () => {
      const mockS3Result = {
        uploadUrl: 'https://s3.amazonaws.com/bucket/images/file123.jpg?signature=xxx',
        key: 'images/file123.jpg',
      };

      mockFileValidationService.validatePresignedUpload.mockReturnValue(undefined);
      mockS3Service.generateKey.mockReturnValue('images/file123.jpg');
      mockS3Service.getSignedUploadUrl.mockResolvedValue(mockS3Result);

      const result = await service.getPresignedUploadUrl('image', 'file123', 'jpg', 'image/jpeg');

      expect(mockFileValidationService.validatePresignedUpload).toHaveBeenCalledWith(
        'image',
        'jpg',
        'image/jpeg'
      );
      expect(result.uploadUrl).toContain('signature=xxx');
      expect(result.key).toBe('images/file123.jpg');
      expect(result.cdnUrl).toBe('https://cdn.azeebo.com/images/file123.jpg');
      expect(result.expiresIn).toBe(3600);
    });
  });

  describe('getTranscodingJobStatus', () => {
    it('should return transcoding job status', async () => {
      const now = new Date().toISOString();
      const mockJob = {
        jobId: 'transcode_123_video',
        status: 'processing',
        progress: 50,
        outputKeys: [],
        createdAt: now,
        updatedAt: now,
      };

      mockRedisService.get.mockResolvedValue(JSON.stringify(mockJob));

      const result = await service.getTranscodingJobStatus('transcode_123_video');

      expect(result).toMatchObject(mockJob);
      expect(mockRedisService.get).toHaveBeenCalledWith('transcoding_job:transcode_123_video');
    });

    it('should return null for non-existent job', async () => {
      mockRedisService.get.mockResolvedValue(null);

      const result = await service.getTranscodingJobStatus('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('deleteFile', () => {
    it('should delete file from S3', async () => {
      mockS3Service.deleteFile.mockResolvedValue(undefined);

      await service.deleteFile('images/file.jpg');

      expect(mockS3Service.deleteFile).toHaveBeenCalledWith('images/file.jpg');
    });
  });

  describe('cleanupOrphanedFiles', () => {
    it('should cleanup orphaned files and return count', async () => {
      mockS3Service.cleanupOrphanedFiles.mockResolvedValue(5);

      const result = await service.cleanupOrphanedFiles('images/', 30);

      expect(result).toBe(5);
      expect(mockS3Service.cleanupOrphanedFiles).toHaveBeenCalledWith('images/', 30);
    });
  });
});
