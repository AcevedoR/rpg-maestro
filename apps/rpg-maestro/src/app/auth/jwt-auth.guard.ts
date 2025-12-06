import { CanActivate, ExecutionContext, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { JwtPayload } from 'jsonwebtoken';
import { Request } from 'express';
import { UserID } from '@rpg-maestro/rpg-maestro-api-contract';
import { createRemoteJWKSet } from 'jose';
import * as process from 'node:process';
import { validateJWT } from './jwt-helper';

const ISSUER = process.env.AUTH_ISSUER;
const JWKS_URL = ISSUER +'/.well-known/jwks.json';
const JWKS = createRemoteJWKSet(new URL(JWKS_URL));

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
  const authorizationHeader = req.header('Authorization');
  if (!authorizationHeader) {
    throw new UnauthorizedException('No Bearer access token in Authorization');
  }

  let decoded: null | JwtPayload | string;
  try {

    const token = authorizationHeader.replace('Bearer ', '');
    decoded = await validateJWT(token, JWKS);
  } catch (err) {
    // Logger.warn(`Invalid token, err when decoding jwt ${err}`); TODO remove
    Logger.warn(`Invalid token, err when decoding jwt ${err}, JWKS: ${JSON.stringify(JWKS.jwks())}`);
    throw new UnauthorizedException(`Invalid token, err when decoding jwt`);
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
