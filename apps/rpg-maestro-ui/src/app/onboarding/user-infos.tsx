import React, { useEffect, useState } from 'react';
import { ToastContainer } from 'react-toastify';
import { Divider, Grid2, List, ListItem, ListItemButton, ListItemText, Typography } from '@mui/material';
import { ContentToCopy } from '../ui-components/content-to-copy/content-to-copy';
import { StyledBox } from './sytled-box';
import { getURLToShareToPlayers } from './setup-session';
import { toastError } from '../ui-components/toast-popup';

import { User } from '@rpg-maestro/rpg-maestro-api-contract';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import DiscordInviteLink from '../ui-components/discord-invite-link/discord-invite-link';
import GithubSourceCodeLink from '../ui-components/github-source-code-link/github-source-code-link';
import LogoutButton from '../auth/LogoutButton';
import { useAuth0, withAuthenticationRequired } from '@auth0/auth0-react';
import { getUserFromAPI } from '../maestro-ui/maestro-api';
import { Loading } from '../auth/Loading';
import { isDevModeEnabled } from '../../FeaturesConfiguration';

function UserInfosComponent() {
  const [rpgMaestroUser, setRpgMaestroUser] = useState<User | null | undefined>(undefined);
  const { user, getAccessTokenSilently } = useAuth0();

  useEffect(() => {
    const fetchUser = async () => {
      const apiUser = await getUserFromAPI();
      setRpgMaestroUser(apiUser);
    };
    fetchUser();
  }, [getAccessTokenSilently, user]);

  function Content() {
    if (rpgMaestroUser === undefined) {
      return <div>Loading...</div>;
    } else if (rpgMaestroUser === null) {
      // TODO redirect 401 ?
      return <p>error we do not see you authenticated</p>;
    } else {
      const userInfos = (
        <StyledBox>
          <Grid2>
            <Typography variant="h6" component="div" style={{ textAlign: 'center' }}>
              Your infos
            </Typography>
            <Divider style={{ borderColor: 'var(--gold-color)' }} />
            <div style={{ textAlign: 'center' }}>
              <p>username: {rpgMaestroUser.id}</p>
              <p>role: {rpgMaestroUser.role}</p>
            </div>
          </Grid2>
        </StyledBox>
      );
      if (rpgMaestroUser.role === 'MAESTRO' || rpgMaestroUser.role === 'MINSTREL' || rpgMaestroUser.role === 'ADMIN') {
        if (!rpgMaestroUser.sessions || Object.keys(rpgMaestroUser.sessions).length === 0) {
          toastError('You have no sessions this should never happen, please contact an admin', 10000);
          return (
            <div>
              {userInfos}
              <div>No sessions</div>
            </div>
          );
        } else {
          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4rem' }}>
              {userInfos}
              <StyledBox>
                <Grid2>
                  <Typography variant="h6" component="div" style={{ textAlign: 'center' }}>
                    Your sessions
                  </Typography>
                  <Divider style={{ borderColor: 'var(--gold-color)' }} />
                  <List dense={true}>
                    {Object.entries(rpgMaestroUser.sessions).map(([sessionId, session]) => (
                      <ListItem
                        key={sessionId}
                        style={{ display: 'flex', justifyContent: 'space-around', gap: '4rem' }}
                      >
                        <ListItemButton key={sessionId} href={`${window.location.origin}/maestro/${sessionId}`}>
                          <ArrowForwardIcon color="secondary" />
                          <ListItemText>{sessionId}</ListItemText>
                        </ListItemButton>
                        <ContentToCopy content={getURLToShareToPlayers(sessionId)} />
                      </ListItem>
                    ))}
                  </List>
                </Grid2>
              </StyledBox>
            </div>
          );
        }
      }
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
        <h1 style={{ margin: 0 }}>Account</h1>
      </div>
      <div>
        <Content></Content>
      </div>
      <div>
        <LogoutButton />
      </div>
      <DiscordInviteLink />
      <GithubSourceCodeLink />
      <ToastContainer limit={5} />
    </div>
  );
}

export const UserInfos = isDevModeEnabled ? UserInfosComponent : withAuthenticationRequired(UserInfosComponent, {
  onRedirecting: () => <Loading/>,
});
