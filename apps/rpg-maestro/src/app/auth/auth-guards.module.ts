import { Module } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from './roles.guard';
import { JwtAuthGuard } from './jwt-auth.guard';
import { UsersManagementModule } from '../users-management/users-management.module';

@Module({
  imports: [UsersManagementModule],
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