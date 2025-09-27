import { generateFakeJwtToken, getJWKS } from '@rpg-maestro/test-utils';
import { createLocalJWKSet } from 'jose';
import { validateJWT } from './jwt-helper';

describe('validate test utils', () => {
  it('should sign/decode a token', async () => {
    const userId = 'user-id-1';
    const token = await generateFakeJwtToken(userId, {audience: 'http://localhost:3000', issuer: 'http://localhost:3001'});
    const jwks = await getJWKS();
    const localjwkSet = await createLocalJWKSet(jwks)({ alg: 'RS256' });
    const jwtPayload = await validateJWT(token.token, localjwkSet, {
      algorithms: ['RS256'],
      issuer: 'http://localhost:3001',
      audience: 'http://localhost:3000',
    });
    expect(jwtPayload.email).toEqual(userId);
  });
});
