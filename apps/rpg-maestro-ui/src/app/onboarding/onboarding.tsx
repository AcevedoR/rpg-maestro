import React from 'react';
import { ToastContainer } from 'react-toastify';
import GoogleButton from 'react-google-button';
import { isDevModeEnabled } from '../../FeaturesConfiguration';

export function Onboarding() {

  const goToLogin = () => {
    if (isDevModeEnabled) {
      const params = new URLSearchParams({ routeToRedirectTo: '/onboarding/setup-session' });
      window.location.href = `/dev/fake-idp-login-page?${params.toString()}`;
    } else {
      // Cloudflare will redirect to the login page since the user is not authenticated yet
      window.location.href = '/onboarding/setup-session';
    }
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
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0 }}>
        <h1 style={{ margin: 0 }}>Your soundboard is one sign-in away</h1>
        <h4>Sign in, and we'll create your session — with the one link your players open</h4>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <p>The free tier needs no card — just a Google account (@gmail) to sign in.</p>
        <p>Your players never need accounts: they just open your link.</p>
        <p>No ads, no tracking, no data collection.</p>
      </div>
      <div>
        <GoogleButton onClick={goToLogin}>Sign in with your Google account</GoogleButton>
      </div>
      <ToastContainer limit={5} />
    </div>
  );
}
