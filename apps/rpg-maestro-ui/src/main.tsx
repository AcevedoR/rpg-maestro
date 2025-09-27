import React from 'react';
import { createRoot } from 'react-dom/client';
import { Auth0Provider } from '@auth0/auth0-react';
import { BrowserRouter } from 'react-router-dom';
import App from './app/app';

const root = createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <Auth0Provider
    domain="dev-8v7iuopd7co3felr.us.auth0.com"
    clientId="Lo5POrpPalq48lKUjItIAMyTY5CDJBjH"
    authorizationParams={{
      redirect_uri: window.location.origin
    }}
  >
    <BrowserRouter>

    <App />
    </BrowserRouter>
  </Auth0Provider>,
);
