import React, { useEffect, useState } from 'react';
import { ToastContainer } from 'react-toastify';
import { SessionPlayingTracks } from '@rpg-maestro/rpg-maestro-api-contract';
import { onboard } from '../maestro-ui/maestro-api';
import { ContentToCopy } from '../ui-components/content-to-copy/content-to-copy';
import { TextLinkWithIconWrapper } from '../ui-components/text-link-with-icon-wrapper';
import SpatialAudioOffIcon from '@mui/icons-material/SpatialAudioOff';
import styled from 'styled-components';

export function SetupSession() {
  const [newlyCreatedSession, setNewlyCreatedSession] = useState<SessionPlayingTracks | null>(null);

  const sendOnboardRequest = () => {
    onboard().then((newSession) => {
      setNewlyCreatedSession(newSession);
    });
  };
  const getURLToShareToPlayers = () => {
    return `${window.location.origin}/${newlyCreatedSession}`;
  };

  useEffect(() => {
    sendOnboardRequest();
  }, []);

  const MaestroLink = styled.div`
    width: 30%;
    min-width: 170px;
    display: flex;
    justify-content: flex-end;
  `;

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
        <h1 style={{ margin: 0 }}>Account created!</h1>
        <h4>Onboarding almost finished</h4>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        {newlyCreatedSession ? (
          <div>
            <p>
              Share this link to your Players so then can join your session:
              <ContentToCopy content={getURLToShareToPlayers()} />
            </p>
            <MaestroLink>
              <TextLinkWithIconWrapper
                link={`/maestro/${newlyCreatedSession.sessionId}`}
                text={'Enter your Maestro Session'}
                materialUiIcon={SpatialAudioOffIcon}
              />
            </MaestroLink>
          </div>
        ) : (
          <div>Loading your new session</div>
        )}
      </div>
      <div></div>
      <ToastContainer limit={5} />
    </div>
  );
}
