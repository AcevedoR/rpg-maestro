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
import { Box, Divider, Grid2, List, ListItem, ListItemButton, Typography } from '@mui/material';
import ArrowCircleDownIcon from '@mui/icons-material/ArrowCircleDown';

const MaestroLink = styled.div`
  width: 30%;
  min-width: 170px;
  display: flex;
  justify-content: flex-end;
`;

const StyledBox = styled(Box)`
    min-width: 300px;
    max-width: 500px;
    width: 50vw;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.22);
  transition: all 0.3s ease;
  background: rgba(26, 11, 46, 0.6);
  border: 1px solid rgba(218, 165, 32, 0.3);
  border-radius: 24px;
  padding: 24px;
  display: flex;
  align-content: center;
  justify-content: center;
  margin: 0;
`;

export function SetupSession() {
  const [newlyCreatedSession, setNewlyCreatedSession] = useState<SessionPlayingTracks | UserAlreadyExistsError | null>(
    null
  );
  const [maestroInfos, setMaestroInfos] = useState<User | undefined>(undefined);

  const sendOnboardRequest = () => {
    if (!newlyCreatedSession) {
      onboard().then((newSession) => {
        if (newSession === 'UserAlreadyExistsError') {
          fetchMaestroInfos();
        } else {
          setNewlyCreatedSession(newSession);
        }
      });
    }
  };
  const fetchMaestroInfos = () => {
    getMaestroInfos().then(setMaestroInfos);
  };
  const getURLToShareToPlayers = (sessionId: string): string => {
    return `${window.location.origin}/${sessionId}`;
  };

  useEffect(() => {
    sendOnboardRequest();
  }, []);

  const getMainContent = () => {
    if (maestroInfos) {
      if (!maestroInfos.sessions || Object.keys(maestroInfos.sessions).length === 0) {
        toastError('You have no sessions this should never happen, please contact an admin', 10000);
        return <div>No sessions</div>;
      }
      return (
        <div>
          <StyledBox>
            <Grid2>
              <Typography variant="h6" component="div" style={{ textAlign: 'center' }}>
                Your sessions
              </Typography>
              <Divider style={{ borderColor: 'var(--gold-color)' }} />
              <List dense={true}>
                {Object.entries(maestroInfos.sessions).map(([sessionId, session]) => (
                  <ListItem key={sessionId}>
                    <ListItemButton key={sessionId} href={`${window.location.origin}/${sessionId}`}>
                      {sessionId}
                    </ListItemButton>
                    <div>
                      <ContentToCopy content={getURLToShareToPlayers(sessionId)} />
                    </div>
                  </ListItem>
                ))}
              </List>
            </Grid2>
          </StyledBox>
        </div>
      );
    } else if (newlyCreatedSession && newlyCreatedSession !== 'UserAlreadyExistsError') {
      return (
        <div style={{ height: '50vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: '1rem' }}>
          <StyledBox>
            <div style={{ textAlign: 'center' }}>
              <p>Share this link to your Players so they can join your session:</p>
              <p><ContentToCopy content={getURLToShareToPlayers(newlyCreatedSession.sessionId)} /></p>
            </div>
          </StyledBox>
          <ArrowCircleDownIcon style={{color: 'var(--gold-color)'}} fontSize={'large'}/>
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
