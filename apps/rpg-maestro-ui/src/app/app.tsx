import styled from 'styled-components';

import { Navigate, Route, Routes } from 'react-router-dom';
import 'react-h5-audio-player/lib/styles.css';
import 'react-toastify/dist/ReactToastify.css';
import { MaestroSoundboard } from './maestro-ui/maestro-soundboard';
import { ClientsUi } from './players-ui/clients-ui';
import { TracksManagement } from './maestro-ui/tracks-management/tracks-management';

const StyledApp = styled.div`
  //  Your style here
`;

export function App() {
  return (
    <StyledApp style={{ fontFamily: '"Roboto", "Helvetica", "Arial", "sans-serif"' }}>
      {/* START: routes */}
      {/* These routes and navigation have been generated for you */}
      {/* Feel free to move and update them to fit your needs */}
      <Routes>
        <Route path="/:sessionId" element={<ClientsUi />} />
        <Route path="/" element={<Navigate to="/default-current-session" replace />} />
        <Route path="/maestro/:sessionId" element={<MaestroSoundboard />} />
        <Route path="/maestro/manage/:sessionId" element={<TracksManagement />} />
        <Route path="/maestro" element={<Navigate to="/maestro/default-current-session" replace />} />
        <Route path="/admin" element={<Navigate to="/maestro" replace />} />
      </Routes>
      {/* END: routes */}
    </StyledApp>
  );
}

export default App;
