import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import LoginButton from './LoginButton';

const loginWithRedirectMock = vi.fn();

vi.mock('@auth0/auth0-react', () => ({
  useAuth0: () => ({ loginWithRedirect: loginWithRedirectMock }),
}));

describe('LoginButton', () => {
  beforeEach(() => {
    loginWithRedirectMock.mockReset();
  });

  it('passes returnTo from query param as appState when clicking login', async () => {
    vi.stubGlobal('location', { ...window.location, search: '?returnTo=%2Fmaestro%2Fmanage%2Fabc123' });

    render(<LoginButton />);
    await userEvent.click(screen.getByRole('button', { name: /log in/i }));

    expect(loginWithRedirectMock).toHaveBeenCalledWith({ appState: { returnTo: '/maestro/manage/abc123' } });

    vi.unstubAllGlobals();
  });

  it('defaults returnTo to / when no query param is present', async () => {
    vi.stubGlobal('location', { ...window.location, search: '' });

    render(<LoginButton />);
    await userEvent.click(screen.getByRole('button', { name: /log in/i }));

    expect(loginWithRedirectMock).toHaveBeenCalledWith({ appState: { returnTo: '/' } });

    vi.unstubAllGlobals();
  });
});
