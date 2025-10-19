import { IsBoolean, IsIn, IsString } from 'class-validator';
import { Role, RolesList } from '@rpg-maestro/rpg-maestro-api-contract';

export class UpdateUserRole {
  @IsIn(RolesList)
  role: Role;
}
