import * as jwt from 'jsonwebtoken';
import { Request } from 'express';
import { UserID } from '@rpg-maestro/rpg-maestro-api-contract';
import { Logger, UnauthorizedException } from '@nestjs/common';
import { JwtPayload } from 'jsonwebtoken';

export function getUser(req: Request): UserID {
  const token = req.cookies['CF_Authorization'];
  if (!token) {
    throw new UnauthorizedException('No CF_Authorization cookie');
  }

  Logger.warn("req.cookies['CF_Authorization']: ", req.cookies['CF_Authorization']);

  let decoded: null | JwtPayload | string;
  try {
    decoded = jwt.decode(token) as { email?: string };
  } catch (err) {
    throw new UnauthorizedException(`Invalid token, err when decoding jwt: '${err}'`);
  }
  Logger.warn("decoded: ", decoded);

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
