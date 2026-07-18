import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { JwtConfigModule } from '@azeebo/shared-services';
import { AuthGuard } from './guards/auth.guard';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtConfigModule,
  ],
  providers: [AuthGuard],
  exports: [AuthGuard, JwtModule],
})
export class CommonModule {}
