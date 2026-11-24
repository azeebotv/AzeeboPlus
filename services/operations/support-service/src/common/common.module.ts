import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { JwtConfigModule } from '@azeebo/shared-services';

@Module({
  imports: [PassportModule.register({ defaultStrategy: 'jwt' }), JwtConfigModule],
  exports: [JwtModule],
})
export class CommonModule {}
