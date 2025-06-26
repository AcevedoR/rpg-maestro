import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from './roles.guard';
import { DatabaseModule } from '../infrastructure/database.module';
import { JwtAuthGuard } from './jwt-auth.guard';

@Module({
  imports: [DatabaseModule],
  providers: [
    Reflector,
    {
      provide: JwtAuthGuard,
      useClass: JwtAuthGuard,
    },
    {
      provide: JwtAuthGuard,
      useClass: RolesGuard,
    },
  ],
})
export class AuthGuardsModule {}