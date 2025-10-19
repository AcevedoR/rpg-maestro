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
import { FakeIDPLoginPage, getFakeToken } from './auth/FakeIDPLoginPage.fixture';
import { SetupSession } from './onboarding/setup-session';
import { WelcomePage } from './welcome-page';
import { isDevModeEnabled } from '../FeaturesConfiguration';
import { HealthStatus } from './misc/health-status';
import { UserInfos } from './onboarding/user-infos';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { AdminBoard } from './admin-ui/admin-board';
import { LoginPage } from './auth/LoginPage';
import { useLayoutEffect, useState } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { initAuthRequirements } from './utils/authenticated-fetch';

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
  const [authReady, setAuthReady] = useState(false);
  const { getAccessTokenSilently } = useAuth0();
  useLayoutEffect(() => {
    initAuthRequirements(isDevModeEnabled ? getFakeToken : getAccessTokenSilently);
    setAuthReady(true);
  }, [getAccessTokenSilently]);
  return (
    // only load the whole app after auth is ready
    !authReady ? null :
    <StyledApp style={{ fontFamily: '"Roboto", "Helvetica", "Arial", "sans-serif"', height: '100vh' }}>
      <ThemeProvider theme={theme}>
        {/* START: routes */}
        {/* These routes and navigation have been generated for you */}
        {/* Feel free to move and update them to fit your needs */}
        <Routes>
          {/*TODO add secured routes*/}
          <Route path="/health" element={<HealthStatus />} />
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/onboarding/setup-session" element={<SetupSession />} />
          {isDevModeEnabled && <Route path="/dev/fake-idp-login-page" element={<FakeIDPLoginPage />} />}
          <Route path=":sessionId" element={<PlayersUi />} />
          <Route path="/" element={<WelcomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/maestro/infos" element={<UserInfos />} />
          <Route path="/maestro/:sessionId" element={<MaestroSoundboard />} />
          <Route path="/maestro/manage/:sessionId" element={<TracksManagement />} />
          <Route path="/maestro/admin" element={<AdminBoard/>}/>
          <Route path="/admin" element={<Navigate to="/maestro" replace />} />
        </Routes>
        {/* END: routes */}
      </ThemeProvider>
    </StyledApp>
  );
}

export default App;
