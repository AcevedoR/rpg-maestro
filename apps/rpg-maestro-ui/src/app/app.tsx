import styled from 'styled-components';

import { Route, Routes } from 'react-router-dom';
import 'react-h5-audio-player/lib/styles.css';
import 'react-toastify/dist/ReactToastify.css';
import { AdminUi } from './admin-ui/admin-ui';
import { ClientsUi } from './clients/clients-ui';

const StyledApp = styled.div`
  // Your style here
`;

export function App() {
  return (
    <StyledApp>
      {/* START: routes */}
      {/* These routes and navigation have been generated for you */}
      {/* Feel free to move and update them to fit your needs */}
      <br />
      <hr />
      <br />
      <Routes>
        <Route path="/" element={<ClientsUi />} />
        <Route path="/admin" element={<AdminUi />} />
      </Routes>
      {/* END: routes */}
    </StyledApp>
  );
}

export default App;
