import React, { useEffect, useState } from 'react';
import { ToastContainer } from 'react-toastify';
import { User } from '@rpg-maestro/rpg-maestro-api-contract';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { formatTime, formatTodayDate } from '../utils/time';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { clearUserFromSessionStorage } from '../cache/session-storage.service';
import { getUser } from '../cache/user.cache';

export function AdminBoard() {
  const [user, setUser] = useState<User | null | undefined>(undefined);
  const fetchUser = async () => {
    const user = await getUser();
    setUser(user);
  };

  useEffect(() => {
    clearUserFromSessionStorage();
    fetchUser();
  }, []);

  const columns: GridColDef[] = [
    { field: 'youtubeUrlToUpload', minWidth: 600 },
    { field: 'status' },
    {
      field: 'createdDate',
      type: 'string',
      width: 120,
      valueGetter: (value: number, row) => formatTodayDate(value),
    },
    {
      field: 'updatedDate',
      type: 'string',
      width: 120,
      valueGetter: (value: number, row) => formatTodayDate(value),
    },
    {
      field: 'upload duration',
      type: 'string',
      width: 120,
      valueGetter: (value, row) => {
        return `${formatTime(row.updatedDate.getTime() - row.createdDate.getTime())}`;
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
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-around',
        gap: '1rem',
        padding: '1rem',
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center' }}>
        <h1 style={{ margin: 0, display: 'inline-block' }}>Admin board</h1>
        <h4>connected as: {user?.id}</h4>
      </div>
      <hr style={{ width: '100vw', borderColor: 'var(--gold-color)' }} />
      <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center' }}>
        <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'center' }}>
          <div style={{ minHeight: 200, height: '40vh', width: '90%' }}>
            <ThemeProvider theme={theme}>
              <DataGrid
                rows={[]}
                columns={columns}
                initialState={{ pagination: { paginationModel } }}
                pageSizeOptions={[10, 25, 50]}
                sx={{ border: 0 }}
              />
            </ThemeProvider>
          </div>
        </div>
      </div>
      <ToastContainer limit={5} />
    </div>
  );
}
