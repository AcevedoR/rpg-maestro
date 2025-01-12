import * as React from 'react';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import Paper from '@mui/material/Paper';
import { TrackCreationFromYoutubeDto } from '@rpg-maestro/rpg-maestro-api-contract';
import { formatTime, formatTodayDate } from '../../utils/time';

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

  return (
    <Paper sx={{ height: 650, width: '100%' }}>
      <DataGrid
        rows={[...trackCreationsFromYoutube].sort((a, b) => b.updatedDate.getTime() - a.updatedDate.getTime())}
        columns={columns}
        initialState={{ pagination: { paginationModel } }}
        pageSizeOptions={[10, 25, 50]}
        sx={{ border: 0 }}
      />
    </Paper>
  );
}
