import React, { useEffect, useState } from 'react';
import { SessionPlayingTracks, User } from '@rpg-maestro/rpg-maestro-api-contract';
import { getMaestroInfos, onboard, UserAlreadyExistsError } from '../maestro-ui/maestro-api';
import { ContentToCopy } from '../ui-components/content-to-copy/content-to-copy';
import { TextLinkWithIconWrapper } from '../ui-components/text-link-with-icon-wrapper';
import SpatialAudioOffIcon from '@mui/icons-material/SpatialAudioOff';
import styled from 'styled-components';
import Button from '@mui/material/Button';
import { ToastContainer } from 'react-toastify';
import ArrowCircleDownIcon from '@mui/icons-material/ArrowCircleDown';
import { StyledBox } from './sytled-box';
import { useNavigate } from 'react-router-dom';
import { getUserAndForceRefresh } from '../cache/user.cache';

const MaestroLink = styled.div`
  width: 30%;
  min-width: 170px;
  display: flex;
  justify-content: flex-end;
`;

export const getURLToShareToPlayers = (sessionId: string): string => {
  return `${window.location.origin}/${sessionId}`;
};
export function SetupSession() {
  const [newlyCreatedSession, setNewlyCreatedSession] = useState<SessionPlayingTracks | UserAlreadyExistsError | null>(
    null
  );
  const [onboardRequestLoading, setOnboardRequestLoading] = useState<boolean>(false);
  const [maestroInfos, setMaestroInfos] = useState<User | undefined>(undefined);
  const navigate = useNavigate();

  const sendOnboardRequest = async () => {
    if (!newlyCreatedSession) {
      setOnboardRequestLoading(true);
      const newSession = await onboard();
      await getUserAndForceRefresh();
      if (newSession === 'UserAlreadyExistsError') {
        fetchMaestroInfos();
      } else {
        setNewlyCreatedSession(newSession);
      }
      setOnboardRequestLoading(false);
    }
  };
  const fetchMaestroInfos = () => {
    getMaestroInfos().then(setMaestroInfos);
  };

  useEffect(() => {
    sendOnboardRequest();
  }, []);

  useEffect(() => {
    if (maestroInfos) {
      navigate('/account/infos');
    }
  }, [maestroInfos, navigate]);

  const getMainContent = () => {
    if (onboardRequestLoading) {
      return <div>Your session is loading</div>;
    }
    if (maestroInfos) {
      return null; // Navigation handled by useEffect
    } else if (newlyCreatedSession && newlyCreatedSession !== 'UserAlreadyExistsError') {
      return (
        <div
          style={{
            height: '50vh',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '1rem',
          }}
        >
          <StyledBox>
            <div style={{ textAlign: 'center' }}>
              <p>Share this link to your Players so they can join your session:</p>
              <p>
                <ContentToCopy content={getURLToShareToPlayers(newlyCreatedSession.sessionId)} />
              </p>
            </div>
          </StyledBox>
          <ArrowCircleDownIcon style={{ color: 'var(--gold-color)' }} fontSize={'large'} />
          <StyledBox>
            <MaestroLink>
              <TextLinkWithIconWrapper
                link={`/maestro/${newlyCreatedSession.sessionId}`}
                text={'Enter your Maestro Session'}
                materialUiIcon={SpatialAudioOffIcon}
              />
            </MaestroLink>
          </StyledBox>
        </div>
      );
    } else {
      return (
        <div>
          Loading your new session <Button onClick={sendOnboardRequest}>retry</Button>{' '}
        </div>
      );
    }
  };
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
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>{getMainContent()}</div>
      <div></div>
      <ToastContainer limit={5} />
    </div>
  );
}
