import React, { useEffect, useState } from 'react';
import { ToastContainer } from 'react-toastify';
import {
  SessionAccess,
  SessionAccessLevel,
  SessionPlayingTracks,
  User,
  UserID,
} from '@rpg-maestro/rpg-maestro-api-contract';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { clearUserFromSessionStorage } from '../cache/session-storage.service';
import { getUser } from '../cache/user.cache';
import { getAllSessions, getAllUsers } from './admin-api';
import { formatTodayDate } from '../utils/time';

export function AdminBoard() {
  const [user, setUser] = useState<User | null | undefined>(undefined);
  const [sessions, setSessions] = useState<SessionPlayingTracks[] | undefined>(undefined);
  const [users, setUsers] = useState<User[] | undefined>(undefined);
  const fetchUser = async () => {
    const user = await getUser();
    setUser(user);
  };
  const fetchAllSessions = async () => {
    const sessions = await getAllSessions();
    setSessions(sessions);
  };
  const fetchAllUsers = async () => {
    const users = await getAllUsers();
    setUsers(users);
  };

  useEffect(() => {
    clearUserFromSessionStorage();
    fetchUser();
    fetchAllSessions();
    fetchAllUsers();
  }, []);

  const usersGridColumns: GridColDef[] = [
    { field: 'id', width: 450 },
    { field: 'created_at', type: 'string', width: 120, valueGetter: (value: number, row) => formatTodayDate(value) },
    {
      field: 'updated_at',
      type: 'string',
      width: 120,
      valueGetter: (value: number, row) => (value ? formatTodayDate(value) : ''),
    },
    { field: 'role' },
    {
      field: 'sessions',
      type: 'string',
      width: 500,
      valueGetter: (value: number, row) => (row.sessions ? [...Object.keys(row.sessions)] : []),
    },
  ];
  const sessionAccessColumns: GridColDef[] = [
    { field: 'userId', width: 450 },
    { field: 'sessionId' },
    { field: 'access' },
    { field: 'created_at', type: 'string', width: 120, valueGetter: (value: number, row) => formatTodayDate(value) },
    {
      field: 'updated_at',
      type: 'string',
      width: 120,
      valueGetter: (value: number, row) => (value ? formatTodayDate(value) : ''),
    },
  ];
  const sessionsGridColumns: GridColDef[] = [
    { field: 'sessionId' },
    {
      field: 'current track',
      type: 'string',
      width: 500,
      valueGetter: (value, row) => {
        return row.currentTrack?.name;
      },
    },
  ];
  const theme = createTheme({
    palette: {
      mode: 'dark',
    },
  });
  const paginationModel = { page: 0, pageSize: 10 };

  return (
    <div
      style={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'start',
        gap: '1rem',
        padding: '1rem',
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center' }}>
        <h1 style={{ margin: 0, display: 'inline-block' }}>Admin board</h1>
        <h4>connected as: {user?.id}</h4>
      </div>
      <hr style={{ width: '100vw', borderColor: 'var(--gold-color)' }} />
      <div style={{ minHeight: 200, margin: '0 auto', width: '90%' }}>
        <ThemeProvider theme={theme}>
          <DataGrid
            rows={users}
            columns={usersGridColumns}
            initialState={{ pagination: { paginationModel } }}
            pageSizeOptions={[10, 25, 50]}
            sx={{ border: 0 }}
          />
          <DataGrid
            rows={getSessionsAccess(users ?? [])}
            columns={sessionAccessColumns}
            initialState={{ pagination: { paginationModel } }}
            pageSizeOptions={[10, 25, 50]}
            sx={{ border: 0 }}
          />
          <DataGrid
            rows={sessions?.map((x) => {
              return { ...x, id: x.sessionId };
            })}
            columns={sessionsGridColumns}
            initialState={{ pagination: { paginationModel } }}
            pageSizeOptions={[10, 25, 50]}
            sx={{ border: 0 }}
          />
        </ThemeProvider>
      </div>
      <ToastContainer limit={5} />
    </div>
  );
}

interface SessionAccessRow {
  id: string;
  sessionId: string;
  userId: UserID;
  created_at: number;
  updated_at: number | undefined;
  access: SessionAccessLevel;
}

function getSessionsAccess(users: User[]): SessionAccessRow[] {
  return users.flatMap((user) =>
    user.sessions
      ? Object.entries(user.sessions).map(([sessionId, sessionAccess]) =>
          createSessionAccessData(sessionId, sessionAccess, user.id)
        )
      : []
  );
}

function createSessionAccessData(sessionId: string, sessionAccess: SessionAccess, userId: string): SessionAccessRow {
  return {
    id: `${sessionId}_${userId}`,
    sessionId: sessionId,
    userId: userId,
    created_at: sessionAccess.created_at,
    updated_at: sessionAccess.updated_at,
    access: sessionAccess.access,
  };
}