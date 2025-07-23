import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import Button from '@mui/material/Button';
import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
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

  const navigate = useNavigate();

  const onLogin = async () => {
    // simulate Cloudflare login
    const fakeJwtToken = await generateFakeJwtTokenAndNewUser();
    const appSession = Math.floor(Math.random() * 1_000_000_000).toString();
    document.cookie = `CF_Authorization=${fakeJwtToken.token}; CF_AppSession=${appSession}; path=/;`;

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
