import * as React from 'react';
import { DataGrid, GridColDef, GridRowSelectionModel } from '@mui/x-data-grid';
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

const rows: Track[] = [
  {
    id: '76d6ceee-a2b2-4c6b-9709-91a0e63a2b54',
    created_at: 1730457992620,
    updated_at: 1730457992620,
    source: {
      origin_media: 'same-server',
      origin_url: 'http://192.168.1.14:8089/Emotional Music - Veiled.mp3',
      origin_name: 'Emotional%20Music%20-%20Veiled',
    },
    name: 'Emotional%20Music%20-%20Veiled',
    url: 'http://192.168.1.14:8089/Emotional Music - Veiled.mp3',
    duration: 436192.653,
    tags: [],
  },
];

const paginationModel = { page: 0, pageSize: 10 };

export interface TracksTableProps {
  tracks: Track[];
  onSetTrackToPlay: (trackId: string) => Promise<void>;
}

export function TracksTable(props: TracksTableProps) {
  const { tracks, onSetTrackToPlay } = props;
  const onRowSelection = (rowSelection: GridRowSelectionModel) => {
    if (rowSelection.length > 1) {
      throw new Error('multiple tracks selection is not handled');
    }
    if (rowSelection.length === 1) {
      onSetTrackToPlay(String(rowSelection[0]));
    }
  };

  return (
    <Paper sx={{ height: 650, width: '100%' }}>
      <DataGrid
        rows={tracks}
        columns={columns}
        initialState={{ pagination: { paginationModel } }}
        pageSizeOptions={[10, 25, 50]}
        sx={{ border: 0 }}
        onRowSelectionModelChange={onRowSelection}
      />
    </Paper>
  );
}
