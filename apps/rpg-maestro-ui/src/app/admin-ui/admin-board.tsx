import React, { useEffect, useState } from 'react';
import { ToastContainer } from 'react-toastify';
import {
  SessionAccess,
  SessionAccessLevel,
  SessionPlayingTracks,
  User,
  UserID,
} from '@rpg-maestro/rpg-maestro-api-contract';
import { DataGrid, GridColDef, GridSortModel } from '@mui/x-data-grid';
import { Tab, Tabs } from '@mui/material';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { clearUserFromSessionStorage } from '../cache/session-storage.service';
import { getUser } from '../cache/user.cache';
import { getAllSessions, getAllUsers } from './admin-api';
import { formatTodayDate } from '../utils/time';
import { withAuthenticationRequired } from '@auth0/auth0-react';
import { Loading } from '../auth/Loading';
import { isDevModeEnabled } from '../../FeaturesConfiguration';

export const usersGridColumns: GridColDef[] = [
  { field: 'id', width: 450 },
  { field: 'created_at', type: 'string', width: 120, valueGetter: (value: number) => formatTodayDate(value) },
  {
    field: 'updated_at',
    width: 120,
    valueFormatter: (value: number) => (value ? formatTodayDate(value) : ''),
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
  { field: 'created_at', type: 'string', width: 120, valueGetter: (value: number) => formatTodayDate(value) },
  {
    field: 'updated_at',
    type: 'string',
    width: 120,
    valueGetter: (value: number) => (value ? formatTodayDate(value) : ''),
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

interface AdminBoardViewProps {
  user: User | null | undefined;
  sessions: SessionPlayingTracks[] | undefined;
  users: User[] | undefined;
  usersSortModel?: GridSortModel;
}

export function AdminBoardView({ user, sessions, users, usersSortModel }: AdminBoardViewProps) {
  const [activeTab, setActiveTab] = useState(0);
  const usersInitialState = usersSortModel
    ? { pagination: { paginationModel }, sorting: { sortModel: usersSortModel } }
    : { pagination: { paginationModel } };
  return (
    <div
      style={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'start',
        gap: '1rem',
        padding: '1rem',
        boxSizing: 'border-box',
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center' }}>
        <h1 style={{ margin: 0, display: 'inline-block' }}>Admin board</h1>
        <h4>connected as: {user?.id}</h4>
      </div>
      <hr style={{ width: '100%', borderColor: 'var(--gold-color)' }} />
      <ThemeProvider theme={theme}>
        <div
          style={{
            flex: 1,
            minHeight: 0,
            margin: '0 auto',
            width: '90%',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem',
          }}
        >
          <Tabs
            value={activeTab}
            onChange={(_event, value) => setActiveTab(value)}
            textColor="inherit"
            indicatorColor="secondary"
          >
            <Tab label="Users" />
            <Tab label="Access" />
            <Tab label="Sessions" />
          </Tabs>
          <div
            style={{
              flex: 1,
              minHeight: 0,
              display: activeTab === 0 ? 'flex' : 'none',
              flexDirection: 'column',
            }}
          >
            <div style={{ flex: 1, minHeight: 0 }}>
              <DataGrid
                rows={users ?? []}
                columns={usersGridColumns}
                initialState={usersInitialState}
                pageSizeOptions={[10, 25, 50]}
                sx={{ border: 0, height: '100%' }}
              />
            </div>
          </div>
          <div style={{ flex: 1, minHeight: 0, display: activeTab === 1 ? 'flex' : 'none', flexDirection: 'column' }}>
            <div style={{ flex: 1, minHeight: 0 }}>
              <DataGrid
                rows={getSessionsAccess(users ?? [])}
                columns={sessionAccessColumns}
                initialState={{ pagination: { paginationModel } }}
                pageSizeOptions={[10, 25, 50]}
                sx={{ border: 0, height: '100%' }}
              />
            </div>
          </div>
          <div style={{ flex: 1, minHeight: 0, display: activeTab === 2 ? 'flex' : 'none', flexDirection: 'column' }}>
            <div style={{ flex: 1, minHeight: 0 }}>
              <DataGrid
                rows={
                  sessions?.map((x) => {
                    return { ...x, id: x.sessionId };
                  }) ?? []
                }
                columns={sessionsGridColumns}
                initialState={{ pagination: { paginationModel } }}
                pageSizeOptions={[10, 25, 50]}
                sx={{ border: 0, height: '100%' }}
              />
            </div>
          </div>
        </div>
      </ThemeProvider>
      <ToastContainer limit={5} />
    </div>
  );
}

function AdminBoardComponent() {
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

  return <AdminBoardView user={user} sessions={sessions} users={users} />;
}

export const AdminBoard = isDevModeEnabled
  ? AdminBoardComponent
  : withAuthenticationRequired(AdminBoardComponent, {
      onRedirecting: () => <Loading />,
    });

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
