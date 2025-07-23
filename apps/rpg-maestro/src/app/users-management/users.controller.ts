import { Controller, Get, HttpException, HttpStatus, Request, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { AuthenticatedUser, JwtAuthGuard } from '../auth/jwt-auth.guard';


@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get('/me')
  async me(
    @Request() req: { user: AuthenticatedUser }
  ) {
    const user = await this.usersService.get(req.user.id);
    if (!user) {
      throw new HttpException(`Current user ${req.user.id} not found in db`, HttpStatus.CONFLICT);
    }
    return user;
  }
}
