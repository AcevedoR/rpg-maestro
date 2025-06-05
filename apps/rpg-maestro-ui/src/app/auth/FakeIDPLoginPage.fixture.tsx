import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import Button from '@mui/material/Button';
import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { displayError } from '../error-utils';

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

  const onLogin = () => {
    // simulate Cloudflare login
    const fakeToken =
      'eyJhbGciOiJSUzI1NiIsImtpZCI6IjUyMWQyNDEyZTkyNmZlZThiNGVjOWZjZjVhNGY2ZDQxYTY3MGFjYjYxNTE4YmYxNjEyNGRjMjFhZGJmMzcxZDUifQ.eyJhdWQiOlsiMmEyMDdhZGI2YWYwYWUyMWQ1MmJmM2JkMTk4OTA1MjNhMDk3ZTU3MTgwZDBmMGM4NDI2M2UyOTRjNWMxNmFiZiJdLCJlbWFpbCI6InJvbWFuLmFjZXZlZG82MkBnbWFpbC5jb20iLCJleHAiOjE3NDg4NDIxMTQsImlhdCI6MTc0ODc5ODkxNCwibmJmIjoxNzQ4Nzk4OTE0LCJpc3MiOiJodHRwczovL2ZvdXJnYXRlLmNsb3VkZmxhcmVhY2Nlc3MuY29tIiwidHlwZSI6ImFwcCIsImlkZW50aXR5X25vbmNlIjoiTkZORmp0RVZubkJicUxmcSIsInN1YiI6IjA5OWQxMDFkLTJjOGYtNWZiMC1iYmExLTBiYjZmMDQ5NDBjYyIsImNvdW50cnkiOiJGUiJ9.YufQvMN4cCBnDQPLzwOK5RA1MNoJFACx1U53I_RaRqv_MolOZuWBki8puBibE7C717XFir0VEYqGf07UZKLN_xDrp2K305g9MxjT8zBV3fcD-VXdKiIDwNWe0Fb6qeAAhOwj4zgklvI1-3fi0JzceoOYydoHdC1BJc9I6-boeX78deFLMrk7bcA86ILsyLtmcnKIostPANu668Goqoda98WLr1dMWQhfzwX1TX74aWstieDUq-x-QTS5UcyH8TLE1wTw4qY-iZmzNodaJrnSBwV4h4sn1WWD0ERPs6DTYw9-GSUoNSCcJXz42ntcRcY2tE50dcIwWVCCsWaSCGKHRQ';
    document.cookie = `CF_Authorization=${fakeToken}; path=/;`;
    setUserFixture({
      id: '114081282294683862431',
      name: 'Dev User',
      email: 'dev-user@example.com',
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
          role={undefined}
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
