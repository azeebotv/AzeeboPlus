import { Module } from '@nestjs/common';
import { JwtConfigModule } from '@azeebo/shared-services';
import { GenreController } from './genre.controller.js';
import { GenreService } from './genre.service.js';
import { PrismaService } from '../database/prisma.service.js';

@Module({
  imports: [JwtConfigModule],
  controllers: [GenreController],
  providers: [GenreService, PrismaService],
  exports: [GenreService],
})
export class GenreModule {}
