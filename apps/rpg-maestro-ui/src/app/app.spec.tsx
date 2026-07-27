import { render, waitFor } from '@testing-library/react';
import { vi } from 'vitest';

import { BrowserRouter } from 'react-router-dom';

import App from './app';

const getAccessTokenSilentlyMock = vi.fn();
const getUserFromAPIMock = vi.fn();
let isAuthenticatedMock = false;

vi.mock('@auth0/auth0-react', () => ({
  useAuth0: () => ({
    getAccessTokenSilently: getAccessTokenSilentlyMock,
    isAuthenticated: isAuthenticatedMock,
  }),
}));

vi.mock('./maestro-ui/maestro-api', () => ({
  getUserFromAPI: () => getUserFromAPIMock(),
}));

describe('App', () => {
  beforeEach(() => {
    getAccessTokenSilentlyMock.mockReset();
    getUserFromAPIMock.mockReset();
    isAuthenticatedMock = false;
  });

  it('should have a greeting as the title', () => {
    const { getByText } = render(
      <BrowserRouter>
        <App />
      </BrowserRouter>,
    );
    expect(getByText(/Welcome to RPG-MAESTRO/gi)).toBeTruthy();
  });

  it('fetches the user when authenticated', async () => {
    isAuthenticatedMock = true;
    getUserFromAPIMock.mockResolvedValue({});

    render(
      <BrowserRouter>
        <App />
      </BrowserRouter>,
    );

    await waitFor(() => {
      expect(getUserFromAPIMock).toHaveBeenCalled();
    });
  });
});
