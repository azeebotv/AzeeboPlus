import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { CharactersController } from './characters.controller';
import { CharactersService } from './characters.service';

@Module({
  imports: [DatabaseModule],
  controllers: [CharactersController],
  providers: [CharactersService],
})
export class CharactersModule {}