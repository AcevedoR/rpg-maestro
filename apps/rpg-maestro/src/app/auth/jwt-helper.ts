import { CryptoKey, jwtVerify } from 'jose';
import { JwtPayload } from 'jsonwebtoken';

export async function validateJWT(accessToken: string, jwks: CryptoKey, options: {algorithms: string[], issuer: string, audience: string}): Promise<JwtPayload> {
  const result = await jwtVerify(accessToken, jwks, options);
  return result.payload;
}