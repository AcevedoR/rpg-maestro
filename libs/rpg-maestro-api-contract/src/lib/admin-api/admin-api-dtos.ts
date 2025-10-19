import { IsIn } from 'class-validator';
import { Role, RolesList } from '../User';

export class UpdateUserRole {
  @IsIn(RolesList)
  role: Role;

  constructor(role: Role) {
    this.role = role;
  }
}
