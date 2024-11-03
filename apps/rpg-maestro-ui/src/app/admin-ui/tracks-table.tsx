import * as React from 'react';
import { DataGrid, GridColDef, GridFilterModel, GridRowSelectionModel } from '@mui/x-data-grid';
import Paper from '@mui/material/Paper';
import { durationInMsToString } from '../utils/time';
import { Track } from '@rpg-maestro/rpg-maestro-api-contract';

const columns: GridColDef[] = [
  { field: 'id', width: 130 },
  { field: 'name', width: 700 },
  {
    field: 'duration',
    type: 'number',
    width: 130,
    valueGetter: (value, row) => durationInMsToString(value),
  },
];

const paginationModel = { page: 0, pageSize: 10 };

export interface TracksTableProps {
  tracks: Track[];
  onSetTrackToPlay: (trackId: string) => Promise<void>;
  trackIdToFilterOn?: string;
}

export function TracksTable(props: TracksTableProps) {
  const { tracks, onSetTrackToPlay, trackIdToFilterOn } = props;
  const onRowSelection = (rowSelection: GridRowSelectionModel) => {
    if (rowSelection.length > 1) {
      throw new Error('multiple tracks selection is not handled');
    }
    if (rowSelection.length === 1) {
      onSetTrackToPlay(String(rowSelection[0]));
    }
  };

  const filterModel: GridFilterModel = trackIdToFilterOn
    ? {
        items: [
          {
            field: 'id',
            operator: 'contains',
            value: trackIdToFilterOn,
          },
        ],
      }
    : { items: [] };

  return (
    <Paper sx={{ height: 650, width: '100%' }}>
      <DataGrid
        rows={tracks}
        columns={columns}
        initialState={{ pagination: { paginationModel } }}
        pageSizeOptions={[10, 25, 50]}
        sx={{ border: 0 }}
        onRowSelectionModelChange={onRowSelection}
        filterModel={filterModel}
      />
    </Paper>
  );
}
