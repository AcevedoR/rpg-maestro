import { jwtVerify } from 'jose';
import { JwtPayload } from 'jsonwebtoken';

export async function validateJWT(accessToken: string, jwks: any): Promise<JwtPayload> {
  const result = await jwtVerify(accessToken, jwks);
  return result.payload;
}