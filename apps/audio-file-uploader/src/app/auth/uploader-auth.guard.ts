import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  Logger,
  Optional,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { createRemoteJWKSet, jwtVerify, JWTVerifyGetKey } from 'jose';
import { createHash, timingSafeEqual } from 'node:crypto';

export const UPLOADER_JWKS = Symbol('UPLOADER_JWKS');

export const SERVICE_CALLER_ID = 'service::rpg-maestro';

export interface AuthenticatedCaller {
  id: string;
}

/**
 * Protects upload endpoints. Accepts either:
 * - a user access token issued by AUTH_ISSUER (the same issuer rpg-maestro trusts), for direct browser uploads
 * - the shared service token (AUDIO_FILE_UPLOADER_SERVICE_TOKEN), for server-to-server calls from rpg-maestro
 */
@Injectable()
export class UploaderAuthGuard implements CanActivate {
  constructor(@Optional() @Inject(UPLOADER_JWKS) private jwks?: JWTVerifyGetKey) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<Request>();

    const authorizationHeader = req.header('Authorization');
    if (!authorizationHeader || !authorizationHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('No Bearer access token in Authorization');
    }
    const token = authorizationHeader.slice('Bearer '.length);

    const caller: AuthenticatedCaller = isServiceToken(token)
      ? { id: SERVICE_CALLER_ID }
      : { id: await this.validateUserJwt(token) };
    req['user'] = caller;
    return true;
  }

  private async validateUserJwt(token: string): Promise<string> {
    let email: unknown;
    try {
      const { payload } = await jwtVerify(token, this.getJwks());
      email = payload.email;
    } catch (err) {
      Logger.warn('Invalid token, error when decoding jwt', err instanceof Error ? err.stack : undefined);
      throw new UnauthorizedException('Invalid token, err when decoding jwt');
    }
    if (typeof email !== 'string' || !isValidEmail(email)) {
      throw new UnauthorizedException('Valid email not found in token');
    }
    return email;
  }

  private getJwks(): JWTVerifyGetKey {
    if (!this.jwks) {
      const issuer = process.env.AUTH_ISSUER;
      if (!issuer) {
        throw new Error('AUTH_ISSUER is required to validate user access tokens');
      }
      this.jwks = createRemoteJWKSet(new URL(`${issuer}/.well-known/jwks.json`));
    }
    return this.jwks;
  }
}

function isServiceToken(token: string): boolean {
  const serviceToken = process.env.AUDIO_FILE_UPLOADER_SERVICE_TOKEN;
  if (!serviceToken) {
    return false;
  }
  return timingSafeEqual(sha256(token), sha256(serviceToken));
}

function sha256(value: string): Buffer {
  return createHash('sha256').update(value).digest();
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
