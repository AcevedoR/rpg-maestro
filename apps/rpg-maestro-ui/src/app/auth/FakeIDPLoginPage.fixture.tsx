import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import Button from '@mui/material/Button';
import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { displayError } from '../error-utils';
import { initUsersFixture, TestUsersFixture } from '@rpg-maestro/test-utils';

const rpgmaestroapiurl = import.meta.env.VITE_RPG_MAESTRO_API_URL;

export async function getFakeToken(): Promise<string> {
  const token = getCookie('FAKE_TOKEN');
  if (!token) {
    throw new Error('no fake token found in query params');
  }
  return Promise.resolve(token);
}

export async function simulateAuthenticated(userFixtureKey: keyof TestUsersFixture) {
  // simulate login
  const testUsersFixture = await initUsersFixture(rpgmaestroapiurl);
  const token = testUsersFixture[userFixtureKey].token;
  document.cookie = `FAKE_TOKEN=${token}; path=/;`;
}

export function FakeIDPLoginPage() {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const routeToRedirectTo = params.get('routeToRedirectTo') ?? '';
  if (routeToRedirectTo === '') {
    displayError('no routeToRedirectTo found in params');
    throw new Error('no routeToRedirectTo found in params');
  }

  const navigate = useNavigate();

  const onLogin = async (userFixtureKey: keyof TestUsersFixture) => {
    await simulateAuthenticated(userFixtureKey);
    // Optionally wait a tick to ensure cookie is set
    setTimeout(() => {
      // simulate Cloudflare login redirection to the original page
      console.info(`simulate redirection to ${routeToRedirectTo}`);
      navigate(routeToRedirectTo);
    }, 1000);
  };
  return (
    <div
      style={{
        height: '100vh',
        padding: '1rem',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-around',
        alignItems: 'center',
        gap: '1rem',
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>This is a fake IDP login page</h1>
        <h4> only used in dev and test environments</h4>
        <Button onClick={() => onLogin('a_new_user') } component="label" variant="contained" tabIndex={-1} startIcon={<CloudUploadIcon />}>
          Log as a new user
        </Button>
        <Button onClick={() => onLogin('an_admin_user') } component="label" variant="contained" tabIndex={-1} startIcon={<CloudUploadIcon />}>
          Log as an admin
        </Button>
        <Button onClick={() => onLogin('a_maestro_user') } component="label" variant="contained" tabIndex={-1} startIcon={<CloudUploadIcon />}>
          Log as a Maestro A
        </Button>
        <Button onClick={() => onLogin('a_maestro_B_user') } component="label" variant="contained" tabIndex={-1} startIcon={<CloudUploadIcon />}>
          Log as a Maestro B
        </Button>
        <Button onClick={() => onLogin('a_minstrel_user') } component="label" variant="contained" tabIndex={-1} startIcon={<CloudUploadIcon />}>
          Log as a Minstrel
        </Button>
      </div>
    </div>
  );
}
function getCookie(key: string) {
  const b = document.cookie.match('(^|;)\\s*' + key + '\\s*=\\s*([^;]+)');
  return b ? b.pop() : undefined;
}