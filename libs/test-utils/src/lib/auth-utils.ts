import { v4 as uuidv4 } from 'uuid';
import { SignJWT } from 'jose';

export interface FakeJwtToken {
  token: string;
  email: string;
}

export async function generateFakeJwtTokenAndNewUser(): Promise<FakeJwtToken> {
  const mail = randomEmail();
  return generateFakeJwtToken(mail);
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

function randomEmail() {
  const name = uuidv4().slice(0, 8);
  return `${name}@example.com`;
}