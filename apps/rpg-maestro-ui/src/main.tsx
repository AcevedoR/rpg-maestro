import React from 'react';
import { createRoot } from 'react-dom/client';
import { Auth0Provider } from '@auth0/auth0-react';
import { BrowserRouter } from 'react-router-dom';
import App from './app/app';
import { isDevModeEnabled } from './FeaturesConfiguration';

const root = createRoot(document.getElementById('root') as HTMLElement);

const app = (
  <BrowserRouter>
    <App />
  </BrowserRouter>
);

root.render(
  isDevModeEnabled ? (
    app
  ) : (
    <Auth0Provider
      domain={import.meta.env.VITE_AUTH0_DOMAIN}
      clientId={import.meta.env.VITE_AUTH0_CLIENT_ID}
      authorizationParams={{
        redirect_uri: window.location.origin,
        audience: import.meta.env.VITE_RPG_MAESTRO_API_URL,
      }}
    >
      {app}
    </Auth0Provider>
  )
);