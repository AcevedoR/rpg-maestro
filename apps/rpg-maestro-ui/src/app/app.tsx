import styled from 'styled-components';
import { Navigate, Route, Routes } from 'react-router-dom';
import 'react-h5-audio-player/lib/styles.css';
import 'react-toastify/dist/ReactToastify.css';
import { MaestroSoundboard } from './maestro-ui/maestro-soundboard';
import { PlayersUi } from './players-ui/players-ui';
import { TracksManagement } from './maestro-ui/tracks-management/tracks-management';
import './app.css';
import './custom.datagrid.css';
import './custom.autocomplete.css';
import { Onboarding } from './onboarding/onboarding';
import { FakeIDPLoginPage } from './auth/FakeIDPLoginPage.fixture';
import { SetupSession } from './onboarding/setup-session';
import { WelcomePage } from './welcome-page';
import { isDevModeEnabled } from '../FeaturesConfiguration';
import { HealthStatus } from './misc/health-status';
import { UserInfos } from './onboarding/user-infos';
import { createTheme, ThemeProvider } from '@mui/material/styles';

const StyledApp = styled.div`
  //  Your style here
`;
const theme = createTheme({
  colorSchemes :{

  },
  palette: {
    mode: 'dark',

 secondary: {
      main: '#97723d'
    }
  },
});
export function App() {
  return (
    <StyledApp style={{ fontFamily: '"Roboto", "Helvetica", "Arial", "sans-serif"', height: '100vh' }}>
      <ThemeProvider theme={theme}>
        {/* START: routes */}
        {/* These routes and navigation have been generated for you */}
        {/* Feel free to move and update them to fit your needs */}
        <Routes>
          <Route path="/health" element={<HealthStatus />} />
          <Route path="/account/infos" element={<UserInfos />} />
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/onboarding/setup-session" element={<SetupSession />} />
          {isDevModeEnabled && <Route path="/dev/fake-idp-login-page" element={<FakeIDPLoginPage />} />}
          <Route path=":sessionId" element={<PlayersUi />} />
          <Route path="/" element={<WelcomePage />} />
          <Route path="/maestro/:sessionId" element={<MaestroSoundboard />} />
          <Route path="/maestro/manage/:sessionId" element={<TracksManagement />} />
          <Route path="/admin" element={<Navigate to="/maestro" replace />} />
        </Routes>
        {/* END: routes */}
      </ThemeProvider>
    </StyledApp>
  );
}

export default App;
