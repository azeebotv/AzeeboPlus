import { IsIn, IsInt, IsString, Max, Min } from 'class-validator';

export class InitChunkedUploadDto {
  @IsString()
  filename!: string;

  @IsString()
  contentType!: string;

  @IsInt()
  @Min(1)
  @Max(10_000)
  totalChunks!: number;

  @IsIn(['image', 'video', 'audio', 'document'])
  uploadType!: 'image' | 'video' | 'audio' | 'document';
}
