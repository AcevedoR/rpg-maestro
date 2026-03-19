import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { authenticatedFetch, initAuthRequirements } from './authenticated-fetch';
import { clearUserFromSessionStorage } from '../cache/session-storage.service';

vi.mock('../cache/session-storage.service', () => ({
  clearUserFromSessionStorage: vi.fn(),
}));

const fetchMock = vi.fn();

describe('authenticatedFetch', () => {
  beforeEach(() => {
    initAuthRequirements(async () => 'token-123');
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('adds bearer token and returns JSON on success', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ ok: true }),
    });

    const data = await authenticatedFetch('/api/ok');

    expect(data).toEqual({ ok: true });
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/ok',
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer token-123',
        }),
      }),
    );
  });

  it('redirects to onboarding when NOT_YET_ONBOARDED', async () => {
    const assignMock = vi.fn();
    vi.stubGlobal('location', { ...window.location, assign: assignMock });
    fetchMock.mockResolvedValue({
      ok: false,
      status: 403,
      json: async () => ({ errorCode: 'NOT_YET_ONBOARDED' }),
    });

    await expect(authenticatedFetch('/api/forbidden')).rejects.toThrow('Redirecting to onboarding');

    expect(assignMock).toHaveBeenCalledWith('/onboarding/setup-session');
  });

  it('redirects to account infos on 403 without onboarding error code', async () => {
    const assignMock = vi.fn();
    vi.stubGlobal('location', { ...window.location, assign: assignMock });
    fetchMock.mockResolvedValue({
      ok: false,
      status: 403,
      json: async () => ({ message: 'Forbidden' }),
    });

    await expect(authenticatedFetch('/api/forbidden')).rejects.toThrow('Forbidden. Redirecting to account infos');

    expect(assignMock).toHaveBeenCalledWith('/maestro/infos');
  });

  it('clears session storage and redirects to login with returnTo on 401', async () => {
    const assignMock = vi.fn();
    vi.stubGlobal('location', { ...window.location, assign: assignMock, pathname: '/maestro/manage/abc123', search: '?foo=bar' });
    fetchMock.mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({ message: 'Unauthorized' }),
    });

    await expect(authenticatedFetch('/api/unauthorized')).rejects.toThrow('Unauthenticated. Redirecting to login');

    expect(clearUserFromSessionStorage).toHaveBeenCalled();
    expect(assignMock).toHaveBeenCalledWith('/login?returnTo=%2Fmaestro%2Fmanage%2Fabc123%3Ffoo%3Dbar');
  });
});
