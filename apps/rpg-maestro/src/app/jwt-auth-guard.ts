import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import { JwtPayload } from 'jsonwebtoken';
import { Request } from 'express';
import { UserID } from '@rpg-maestro/rpg-maestro-api-contract';

export interface AuthenticatedUser {
  id: string;
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request>();

    const userId = getUser(req);

    // Attach user info to request for later use
    const user: AuthenticatedUser = { id: userId };
    req['user'] = user;
    return true;
  }
}

function getUser(req: Request): UserID {
  const token = req.cookies['CF_Authorization'];
  if (!token) {
    throw new UnauthorizedException('No CF_Authorization cookie');
  }

  let decoded: null | JwtPayload | string;
  try {
    decoded = jwt.decode(token) as { email?: string };
  } catch (err) {
    throw new UnauthorizedException(`Invalid token, err when decoding jwt: '${err}'`);
  }

  if (!decoded?.email) {
    throw new UnauthorizedException('Email not found in token');
  }

  if (!isValidEmail(decoded.email)) {
    throw new UnauthorizedException(`Invalid email address: '${decoded.email}'`);
  }

  return decoded.email as UserID;
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
