import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { generateFakeJwtToken, getJWKS } from '@rpg-maestro/test-utils';
import { createLocalJWKSet } from 'jose';
import { SERVICE_CALLER_ID, UploaderAuthGuard } from './uploader-auth.guard';

const SERVICE_TOKEN = 'test-service-token';

interface FakeRequest {
  headers: Record<string, string>;
  header: (name: string) => string | undefined;
  user?: { id: string };
}

function fakeContext(authorizationHeader?: string): { context: ExecutionContext; request: FakeRequest } {
  const request: FakeRequest = {
    headers: authorizationHeader ? { Authorization: authorizationHeader } : {},
    header(name: string) {
      return this.headers[name];
    },
  };
  const context = {
    switchToHttp: () => ({ getRequest: () => request }),
  } as unknown as ExecutionContext;
  return { context, request };
}

describe('UploaderAuthGuard', () => {
  let guard: UploaderAuthGuard;

  beforeEach(async () => {
    process.env.AUDIO_FILE_UPLOADER_SERVICE_TOKEN = SERVICE_TOKEN;
    guard = new UploaderAuthGuard(createLocalJWKSet(await getJWKS()));
  });

  it('should reject requests without an Authorization header', async () => {
    const { context } = fakeContext();
    await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
  });

  it('should reject requests with an invalid token', async () => {
    const { context } = fakeContext('Bearer not-a-valid-jwt');
    await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
  });

  it('should accept a valid user JWT and attach the user email', async () => {
    const { token, email } = await generateFakeJwtToken('a-maestro@example.com', {
      audience: 'http://localhost:3000',
      issuer: 'http://localhost:3000/test-utils/fake-idp',
    });
    const { context, request } = fakeContext(`Bearer ${token}`);

    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(request.user).toEqual({ id: email });
  });

  it('should reject a valid JWT without a valid email claim', async () => {
    const { token } = await generateFakeJwtToken('not-an-email', {
      audience: 'http://localhost:3000',
      issuer: 'http://localhost:3000/test-utils/fake-idp',
    });
    const { context } = fakeContext(`Bearer ${token}`);

    await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
  });

  it('should accept the shared service token and attach the service identity', async () => {
    const { context, request } = fakeContext(`Bearer ${SERVICE_TOKEN}`);

    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(request.user).toEqual({ id: SERVICE_CALLER_ID });
  });

  it('should reject a wrong service token when it is not a valid JWT either', async () => {
    const { context } = fakeContext('Bearer wrong-service-token');
    await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
  });

  it('should not accept the service token when none is configured', async () => {
    delete process.env.AUDIO_FILE_UPLOADER_SERVICE_TOKEN;
    const { context } = fakeContext(`Bearer ${SERVICE_TOKEN}`);
    await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
  });
});
