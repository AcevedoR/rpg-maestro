import * as React from 'react';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { TrackCreationFromYoutubeDto } from '@rpg-maestro/rpg-maestro-api-contract';
import { formatTime, formatTodayDate } from '../../utils/time';
import { createTheme, ThemeProvider } from '@mui/material/styles';

const paginationModel = { page: 0, pageSize: 10 };

export interface TrackCreationFromYoutubeTableProps {
  trackCreationsFromYoutube: TrackCreationFromYoutubeDto[];
}

export function TrackCreationFromYoutubeTable(props: TrackCreationFromYoutubeTableProps) {
  const { trackCreationsFromYoutube } = props;

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
  return (
    <div style={{ height: 650, width: '100%' }}>
      <ThemeProvider theme={theme}>
        <DataGrid
          rows={[...trackCreationsFromYoutube].sort((a, b) => b.updatedDate.getTime() - a.updatedDate.getTime())}
          columns={columns}
          initialState={{ pagination: { paginationModel } }}
          pageSizeOptions={[10, 25, 50]}
          sx={{ border: 0 }}
        />
      </ThemeProvider>
    </div>
  );
}
