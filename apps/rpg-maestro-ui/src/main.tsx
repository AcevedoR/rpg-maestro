import { StrictMode } from 'react';
import * as ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';

import App from './app/app';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  // <StrictMode> TODO see if it would be useful to re-enable ?
    <BrowserRouter>
      <App />
    </BrowserRouter>
  // </StrictMode>
);
