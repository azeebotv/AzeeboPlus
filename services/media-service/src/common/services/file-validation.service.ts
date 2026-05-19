import { Injectable, BadRequestException } from '@nestjs/common';

export interface FileValidationOptions {
  maxSize?: number;
  allowedMimeTypes?: string[];
  allowedExtensions?: string[];
}

const FILE_TYPE_CONFIG: Record<string, { maxSize: number; mimeTypes: string[]; extensions: string[] }> = {
  image: {
    maxSize: 50 * 1024 * 1024, // 50MB
    mimeTypes: [
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/gif',
      'image/bmp',
      'image/tiff',
    ],
    extensions: ['jpg', 'jpeg', 'png', 'webp', 'gif', 'bmp', 'tiff'],
  },
  video: {
    maxSize: 500 * 1024 * 1024, // 500MB
    mimeTypes: ['video/mp4', 'video/webm', 'video/quicktime', 'video/mpeg'],
    extensions: ['mp4', 'webm', 'mov', 'mpeg'],
  },
  audio: {
    maxSize: 100 * 1024 * 1024, // 100MB
    mimeTypes: ['audio/mpeg', 'audio/aac', 'audio/wav', 'audio/ogg'],
    extensions: ['mp3', 'aac', 'wav', 'ogg'],
  },
  document: {
    maxSize: 50 * 1024 * 1024, // 50MB
    mimeTypes: ['application/pdf'],
    extensions: ['pdf'],
  },
};

const EXECUTABLE_MIME_TYPES = [
  'application/x-executable',
  'application/x-mach-binary',
  'application/x-dosexec',
  'application/x-msdownload',
  'application/x-sh',
  'application/x-bat',
  'application/x-com',
];

@Injectable()
export class FileValidationService {
  validateFile(
    file: Express.Multer.File,
    fileType: 'image' | 'video' | 'audio' | 'document'
  ): void {
    const config = FILE_TYPE_CONFIG[fileType];
    if (!config) {
      throw new BadRequestException(`Invalid file type: ${fileType}`);
    }

    this.validateFileExists(file);
    this.validateMimeType(file, config.mimeTypes);
    this.validateFileExtension(file, config.extensions);
    this.validateFileSize(file, config.maxSize);
    this.validateNotExecutable(file);
    this.validateFileHeader(file, fileType);
  }

  private validateFileExists(file: Express.Multer.File): void {
    if (!file || !file.originalname) {
      throw new BadRequestException('No file provided');
    }
  }

  private validateMimeType(file: Express.Multer.File, allowedMimeTypes: string[]): void {
    const mimeType = file.mimetype.toLowerCase();
    
    if (EXECUTABLE_MIME_TYPES.includes(mimeType)) {
      throw new BadRequestException('Executable files are not allowed');
    }

    if (!allowedMimeTypes.includes(mimeType)) {
      throw new BadRequestException(
        `Invalid MIME type: ${mimeType}. Allowed types: ${allowedMimeTypes.join(', ')}`
      );
    }
  }

  private validateFileExtension(file: Express.Multer.File, allowedExtensions: string[]): void {
    const extension = file.originalname.split('.').pop()?.toLowerCase();
    
    if (!extension || !allowedExtensions.includes(extension)) {
      throw new BadRequestException(
        `Invalid file extension: .${extension}. Allowed extensions: ${allowedExtensions.join(', ')}`
      );
    }
  }

  private validateFileSize(file: Express.Multer.File, maxSize: number): void {
    if (file.size > maxSize) {
      const maxSizeMB = (maxSize / (1024 * 1024)).toFixed(1);
      const fileSizeMB = (file.size / (1024 * 1024)).toFixed(1);
      throw new BadRequestException(
        `File size exceeds maximum allowed size. Max: ${maxSizeMB}MB, Provided: ${fileSizeMB}MB`
      );
    }
  }

  private validateNotExecutable(file: Express.Multer.File): void {
    const dangerousExtensions = ['exe', 'dll', 'bat', 'cmd', 'sh', 'py', 'php', 'js', 'node'];
    const extension = file.originalname.split('.').pop()?.toLowerCase();
    
    if (dangerousExtensions.includes(extension)) {
      throw new BadRequestException(`Executable files (.${extension}) are not allowed`);
    }
  }

  private validateFileHeader(file: Express.Multer.File, fileType: string): void {
    const buffer = file.buffer;
    if (!buffer || buffer.length < 4) {
      throw new BadRequestException('Invalid file content: file is too small or empty');
    }

    const signatures: Record<string, Buffer[]> = {
      image: [
        Buffer.from([0xFF, 0xD8, 0xFF]), // JPEG
        Buffer.from([0x89, 0x50, 0x4E, 0x47]), // PNG
        Buffer.from([0x52, 0x49, 0x46, 0x46]), // WebP/RIFF
        Buffer.from([0x47, 0x49, 0x46, 0x38]), // GIF
      ],
      video: [
        Buffer.from([0x00, 0x00, 0x00, 0x18, 0x66, 0x74, 0x79, 0x70]), // MP4
        Buffer.from([0x1A, 0x45, 0xDF, 0xA3]), // WebM
        Buffer.from([0x66, 0x74, 0x79, 0x70]), // QuickTime
      ],
      audio: [
        Buffer.from([0x49, 0x44, 0x33]), // MP3
        Buffer.from([0xFF, 0xF1]), // AAC
        Buffer.from([0x52, 0x49, 0x46, 0x46]), // WAV
        Buffer.from([0x4F, 0x67, 0x67, 0x53]), // OGG
      ],
      document: [
        Buffer.from([0x25, 0x50, 0x44, 0x46]), // PDF
      ],
    };

    const validSignatures = signatures[fileType];
    if (!validSignatures) return;

    const isValid = validSignatures.some((signature) => {
      if (buffer.length < signature.length) return false;
      return buffer.slice(0, signature.length).equals(signature);
    });

    if (!isValid) {
      throw new BadRequestException(
        `Invalid file header for ${fileType} file. File content does not match expected format`
      );
    }
  }

  validatePresignedUpload(
    type: string,
    extension: string,
    contentType: string
  ): void {
    const fileType = type.toLowerCase() as keyof typeof FILE_TYPE_CONFIG;
    const config = FILE_TYPE_CONFIG[fileType];
    
    if (!config) {
      throw new BadRequestException(`Invalid file type: ${type}`);
    }

    if (!config.extensions.includes(extension.toLowerCase())) {
      throw new BadRequestException(
        `Invalid file extension for ${type}: .${extension}. Allowed: ${config.extensions.join(', ')}`
      );
    }

    if (!config.mimeTypes.includes(contentType.toLowerCase())) {
      throw new BadRequestException(
        `Invalid content type for ${type}: ${contentType}. Allowed: ${config.mimeTypes.join(', ')}`
      );
    }
  }
}