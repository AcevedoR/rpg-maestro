import React, { useEffect, useState } from 'react';
import { SessionPlayingTracks, User } from '@rpg-maestro/rpg-maestro-api-contract';
import { getMaestroInfos, onboard, UserAlreadyExistsError } from '../maestro-ui/maestro-api';
import { ContentToCopy } from '../ui-components/content-to-copy/content-to-copy';
import { TextLinkWithIconWrapper } from '../ui-components/text-link-with-icon-wrapper';
import SpatialAudioOffIcon from '@mui/icons-material/SpatialAudioOff';
import styled from 'styled-components';
import Button from '@mui/material/Button';
import { toastError } from '../ui-components/toast-popup';
import { ToastContainer } from 'react-toastify';

export function SetupSession() {
  const [newlyCreatedSession, setNewlyCreatedSession] = useState<SessionPlayingTracks | UserAlreadyExistsError | null>(null);
  const [maestroInfos, setMaestroInfos] = useState<User | undefined>(undefined);

  const sendOnboardRequest = () => {
    onboard().then((newSession) => {
      if(newSession === 'UserAlreadyExistsError'){
        fetchMaestroInfos();
      } else {
        setNewlyCreatedSession(newSession);
      }
    });
  };
  const fetchMaestroInfos = () => {
    getMaestroInfos().then(setMaestroInfos);
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

  const getMainContent = () => {
    if(maestroInfos){
      if(!maestroInfos.sessions || Object.keys(maestroInfos.sessions).length === 0)
      {
        toastError("You have no sessions this should never happen, please contact an admin", 10000);
        return <div>No sessions</div>
      }
      return <div>
        <div>Your sessions:</div>
        {Object.entries(maestroInfos.sessions).map(([sessionId, session]) => (
          <div key={sessionId}>
            {sessionId} <Button href={`${window.location.origin}/${sessionId}`}>{`${window.location.origin}/${sessionId}`}</Button>
          </div>
        ))}
      </div>
    } else if (newlyCreatedSession && newlyCreatedSession !== 'UserAlreadyExistsError'){
      return <div>
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
    } else {
      return <div>Loading your new session <Button onClick={sendOnboardRequest}>retry</Button> </div>
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
        <h1 style={{ margin: 0 }}>Account created!</h1>
        <h4>Onboarding almost finished</h4>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        {getMainContent()}
      </div>
      <div></div>
      <ToastContainer limit={5} />
    </div>
  );
}
