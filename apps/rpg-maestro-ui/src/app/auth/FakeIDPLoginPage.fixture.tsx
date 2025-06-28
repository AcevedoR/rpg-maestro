import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import Button from '@mui/material/Button';
import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { displayError } from '../error-utils';
import { generateFakeJwtTokenAndNewUser } from '@rpg-maestro/test-utils';

export function FakeIDPLoginPage() {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const routeToRedirectTo = params.get('routeToRedirectTo') ?? '';
  if (routeToRedirectTo === '') {
    displayError('no routeToRedirectTo found in params');
    throw new Error('no routeToRedirectTo found in params');
  }

  const { setUserFixture } = useAuth();
  const navigate = useNavigate();

  const onLogin = async () => {
    // simulate Cloudflare login
    const fakeJwtToken = await generateFakeJwtTokenAndNewUser();
    const appSession = Math.floor(Math.random() * 1_000_000_000).toString();
    document.cookie = `CF_Authorization=${fakeJwtToken.token}; CF_AppSession=${appSession}; path=/;`;
    setUserFixture({
      id: '114081282294683862431',
      name: 'Dev User',
      email: fakeJwtToken.email,
      idp: { id: '1232434-8030-43e0-b180-5bd546775945', type: 'google' },
      geo: { country: 'FR' },
      user_uuid: '44444444-2c8f-5fb0-bba1-0bb6f04940cc',
      account_id: '55555555588e363dde02aa9a71d53fc96f1',
      iat: 1749084972,
      ip: '127.0.0.1',
      auth_status: 'NONE',
      common_name: '',
      service_token_id: '',
      service_token_status: false,
      is_warp: false,
      is_gateway: false,
      version: 0,
    });

    // Optionally wait a tick to ensure cookie is set
    setTimeout(() => {
      // simulate Cloudflare login redirection to the original page
      navigate(routeToRedirectTo);
    }, 10);
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
        <Button
          onClick={onLogin}
          component="label"
          variant="contained"
          tabIndex={-1}
          startIcon={<CloudUploadIcon />}
        >
          Connect with your Fake-IDP account
        </Button>
      </div>
    </div>
  );
}
