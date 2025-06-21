const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { generateKeyPairSync } = require('crypto');

export interface FakeJwtToken {
  token: string;
  email: string;
}

export function generateRandomFakeJwtToken(): FakeJwtToken {
  // Cloudflare-like JWT payload
  const email = randomEmail();
  const payload = {
    email: email,
    email_verified: true,
    sub: uuidv4(),
    aud: 'your-audience-value',
    iss: 'https://your-cloudflare-auth.example.com',
    exp: Math.floor(Date.now() / 1000) + 60 * 10, // expires in 10 minutes
    iat: Math.floor(Date.now() / 1000),
  };
  const { privateKey, publicKey } = generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
  });

  // Sign the token
  const token = jwt.sign(payload, privateKey, {
    algorithm: 'RS256',
    keyid: 'test-key-id',
  });
  return { token, email };
}

function randomEmail() {
  const name = uuidv4().slice(0, 8);
  return `${name}@example.com`;
}
