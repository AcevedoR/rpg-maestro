import { v4 as uuidv4 } from 'uuid';
import { SignJWT } from 'jose';

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
export async function generateFakeJwtToken(userId: string): Promise<FakeJwtToken> {
  // Cloudflare-like JWT payload
  const email = userId;
  const payload = {
    email: email,
    email_verified: true,
    sub: uuidv4(),
    aud: 'your-audience-value',
    iss: 'https://your-cloudflare-auth.example.com',
    exp: Math.floor(Date.now() / 1000) + 60 * 10, // expires in 10 minutes
    iat: Math.floor(Date.now() / 1000),
  };
  // Use a static test secret for browser compatibility
  const secret = new TextEncoder().encode('test-secret-key');
  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('10m')
    .sign(secret);
  return { token, email };
}

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