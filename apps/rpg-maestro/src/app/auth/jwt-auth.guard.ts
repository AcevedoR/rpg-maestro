import { CanActivate, ExecutionContext, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { JwtPayload } from 'jsonwebtoken';
import { Request } from 'express';
import { UserID } from '@rpg-maestro/rpg-maestro-api-contract';
import { createRemoteJWKSet } from 'jose';
import * as process from 'node:process';
import { validateJWT } from './jwt-helper';

const JWT_AUDIENCE = process.env.AUTH_JWT_AUDIENCE;
const ISSUER = process.env.AUTH_ISSUER;

const jwksFunction = createRemoteJWKSet(new URL('.well-known/jwks.json', ISSUER));

export interface AuthenticatedUser {
  id: string;
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<Request>();

    const userId = await getUser(req);

    // Attach user info to request for later use
    const user: AuthenticatedUser = { id: userId };
    req['user'] = user;
    return true;
  }
}

async function getUser(req: Request): Promise<UserID> {
  const token = req.header('Authorization');
  if (!token) {
    throw new UnauthorizedException('No Bearer access token in Authorization');
  }

  let decoded: null | JwtPayload | string;
  try {
    const jwks = await jwksFunction({ alg: 'RS256' });
    decoded = await validateJWT(token.replace('Bearer ', ''), jwks, {
      algorithms: ['RS256'],
      issuer: ISSUER,
      audience: JWT_AUDIENCE,
    });
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
