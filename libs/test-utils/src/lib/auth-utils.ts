import { v4 as uuidv4 } from 'uuid';
import { calculateJwkThumbprint, exportJWK, generateKeyPair, importJWK, JWK, SignJWT } from 'jose';

export interface FakeJwtToken {
  token: string;
  email: string;
}
export interface TestUsersFixture {
  an_admin_user: FakeJwtToken;
  a_maestro_user: FakeJwtToken;
  a_maestro_B_user: FakeJwtToken;
  a_minstrel_user: FakeJwtToken;
}

let FAKE_JWK: { publicKKey: JWK; privateKKey: JWK } | undefined;

export async function initUsersFixture(host: string): Promise<TestUsersFixture> {
  try {
    const res = await fetch(`${host}/test-utils/create-test-users-fixtures`, {
      method: 'POST',
    });
    if (!res.ok) {
      const error = new Error(`Failed to initialize users: ${res.status} ${res.statusText}`);
      console.error(error.message);
      throw error;
    } else {
      console.info('init users using api ok ');
      return (await res.json()) as TestUsersFixture;
    }
  } catch (err) {
    console.error(err);
    throw err;
  }
}

export function randomEmail() {
  const name = uuidv4().slice(0, 8);
  return `${name}@example.com`;
}

export async function getJWKS(): Promise<{ keys: JWK[] }> {
  const { publicKKey } = await getGeneratedJwk();

  // Ensure required JOSE metadata is present for a JWKS publishing context
  publicKKey.alg = 'RS256';
  publicKKey.use = 'sig';
  publicKKey.key_ops = ['verify'];
  publicKKey.kty = 'RSA';
  publicKKey.kid = await calculateJwkThumbprint(publicKKey, 'sha256');

  return { keys: [publicKKey] };
}

export interface FakeIDPConf {
  issuer: string;
  audience: string;
}

export async function generateFakeJwtToken(userId: string, fakeIdpConf: FakeIDPConf): Promise<FakeJwtToken> {
  const email = userId;
  const payload = {
    email: email,
    email_verified: true,
    sub: uuidv4(),
    aud: fakeIdpConf.audience,
    iss: fakeIdpConf.issuer,
    exp: Math.floor(Date.now() / 1000) + 60 * 10, // expires in 10 minutes
    iat: Math.floor(Date.now() / 1000),
  };
  // Use a static test secret for browser compatibility

  const token = await sign(payload);
  return { token, email };
}

async function getGeneratedJwk(): Promise<{ publicKKey: JWK; privateKKey: JWK }> {
  if (FAKE_JWK) {
    return FAKE_JWK;
  }
  const { publicKey, privateKey } = await generateKeyPair('RS256', { modulusLength: 2048 , extractable: true});
  const publicKKeytmp = await exportJWK(publicKey);
  const privateKKeytmp = await exportJWK(privateKey);
  FAKE_JWK = {
    publicKKey: publicKKeytmp,
    privateKKey: privateKKeytmp,
  };
  return FAKE_JWK;
}

async function getSigningKeyJwk() {
  const jwk = await getGeneratedJwk();
  const jwkPriv = jwk.privateKKey;
  const jwkPub = jwk.publicKKey;

  jwkPriv.alg = 'RS256';
  jwkPriv.use = 'sig';
  jwkPriv.key_ops = ['sign'];
  jwkPriv.kty = 'RSA';
  jwkPriv.kid = await calculateJwkThumbprint(jwkPub, 'sha256'); // stable kid from public part

  return jwkPriv;
}

async function sign(payload: Record<string, unknown>) {
  const jwk = await getSigningKeyJwk();
  const key = await importJWK(jwk, 'RS256');
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'RS256', kid: jwk.kid })
    .setIssuedAt()
    .setExpirationTime('10m')
    .sign(key);
}
