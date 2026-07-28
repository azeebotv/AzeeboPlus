import { PartialType } from '@nestjs/swagger';
import { CreateStoryworldDto } from './create-storyworld.dto';

export class UpdateStoryworldDto extends PartialType(CreateStoryworldDto) {}
