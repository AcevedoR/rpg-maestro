import React from 'react';
import { ToastContainer } from 'react-toastify';
import GoogleButton from 'react-google-button';
import { useNavigate } from 'react-router-dom';
import { isDevModeEnabled } from '../../FeaturesConfiguration';

export function Onboarding() {
  const navigate = useNavigate();

  const goToLogin = () => {
    if(isDevModeEnabled){
      const params = new URLSearchParams({ routeToRedirectTo: '/onboarding/setup-session'});
      navigate(`/dev/fake-idp-login-page?${params.toString()}`);
    } else {
    // Cloudflare will redirect to the login page since the user is not authenticated yet
    navigate('/onboarding/setup-session');
    }
  }

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
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0' }}>
        <h1 style={{ margin: 0 }}>Welcome to RPG-MAESTRO!</h1>
        <h4>A web app to broadcast music to your players during your TTRPG sessions</h4>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <p>This app is currently in Beta and free to use.</p>
        <p>You just need to authenticate with a Google account (@gmail) for now.</p>
        <p>There is no ads, no tracking and no data collection.</p>
      </div>
      <div>
        <GoogleButton onClick={goToLogin}>
          Login with your Google account
        </GoogleButton>

      </div>
      <ToastContainer limit={5} />
    </div>
  );
}
