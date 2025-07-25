import React, { useEffect, useState } from 'react';
import { ToastContainer } from 'react-toastify';
import { Divider, Grid2, List, ListItem, ListItemButton, ListItemText, Typography } from '@mui/material';
import { ContentToCopy } from '../ui-components/content-to-copy/content-to-copy';
import { StyledBox } from './sytled-box';
import { getURLToShareToPlayers } from './setup-session';
import { toastError } from '../ui-components/toast-popup';
import { getUser } from '../cache/user.cache';
import { User } from '@rpg-maestro/rpg-maestro-api-contract';

export function UserInfos() {
  const [user, setUser] = useState<User | null | undefined>(undefined);
  const fetchUser = async () => {
    const user = await getUser();
    setUser(user);
  };
  useEffect(() => {
    fetchUser();
  }, []);

  function Content() {
    if (user === undefined) {
      return <div>Loading...</div>;
    } else if (user === null) {
      // TODO redirect 401 ?
      return <p>error we do not see you authenticated</p>
    } else {
      const userInfos = (
        // TODO centralize this styledbox
        <StyledBox>
          <Grid2>
            <Typography variant="h6" component="div" style={{ textAlign: 'center' }}>
              Your infos
            </Typography>
            <Divider style={{ borderColor: 'var(--gold-color)' }} />
            <List>
              <ListItem>
                <ListItemButton style={{ display: 'flex', gap: '2rem' }}>
                  <ListItemText secondary={'username'} />
                  <ListItemText primary={user.id} />
                </ListItemButton>
              </ListItem>
              <ListItem>
                <ListItemButton>
                  <ListItemText secondary={'role'} />
                  <ListItemText primary={user.role} />
                </ListItemButton>
              </ListItem>
            </List>
          </Grid2>
        </StyledBox>
      );
      if (user.role === 'MAESTRO' || user.role === 'MINSTREL') {
        if (!user.sessions || Object.keys(user.sessions).length === 0) {
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
                    {Object.entries(user.sessions).map(([sessionId, session]) => (
                      <ListItem
                        key={sessionId}
                        style={{ display: 'flex', justifyContent: 'space-around', gap: '4rem' }}
                      >
                        <ListItemButton key={sessionId} href={`${window.location.origin}/${sessionId}`}>
                          {sessionId}
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
      <ToastContainer limit={5} />
    </div>
  );
}
