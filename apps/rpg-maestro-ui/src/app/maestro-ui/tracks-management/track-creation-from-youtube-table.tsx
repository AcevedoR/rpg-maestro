import * as React from 'react';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
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
    <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'center' }}>
      <div style={{ minHeight: 200, height: '40vh', width: '90%' }}>
        <DataGrid
          rows={trackCreationsFromYoutube}
          columns={columns}
          initialState={{
            pagination: { paginationModel },
            sorting: { sortModel: [{ field: 'updatedDate', sort: 'desc' }] },
          }}
          pageSizeOptions={[10, 25, 50]}
          sx={{ border: 0 }}
        />
      </div>
    </div>
  );
}
