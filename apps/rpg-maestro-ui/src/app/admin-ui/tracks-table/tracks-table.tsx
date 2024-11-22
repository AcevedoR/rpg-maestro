import * as React from 'react';
import { useState } from 'react';
import { DataGrid, GridActionsCellItem, GridColDef, GridFilterModel, GridRowSelectionModel } from '@mui/x-data-grid';
import Paper from '@mui/material/Paper';
import EditIcon from '@mui/icons-material/Edit';
import { durationInMsToString } from '../../utils/time';
import { Track } from '@rpg-maestro/rpg-maestro-api-contract';
import { EditTrackSideForm } from './edit-track-side-form';

const paginationModel = { page: 0, pageSize: 10 };

export interface TracksTableProps {
  tracks: Track[];
  onSetTrackToPlay: (trackId: string) => Promise<void>;
  onRefreshRequested: () => unknown;
  trackIdToFilterOn?: string;
}

export function TracksTable(props: TracksTableProps) {
  const { tracks, onSetTrackToPlay, trackIdToFilterOn, onRefreshRequested } = props;
  const [selectedTrackToEdit, setSelectedTrackToEdit] = useState<Track | null>(null);

  const onClickEditButton = (id: string, row: any) => {
    setSelectedTrackToEdit(row as Track);
  };
  const onEditTrackSideFormClose = () => {
    setSelectedTrackToEdit(null);
    onRefreshRequested();
  };
  const onTrackUpdated = () =>{
    setSelectedTrackToEdit(null);
    onRefreshRequested();
  }
  const columns: GridColDef[] = [
    { field: 'id', width: 130 },
    { field: 'name', minWidth: 600 },
    {
      field: 'duration',
      type: 'number',
      width: 80,
      valueGetter: (value, row) => durationInMsToString(value),
    },
    { field: 'tags' },
    {
      field: 'actions',
      type: 'actions',
      headerName: 'actions',
      width: 100,
      cellClassName: 'actions',
      getActions: ({ id, row }) => {
        return [
          <GridActionsCellItem
            icon={<EditIcon />}
            label="Edit"
            className="textPrimary"
            onClick={() => onClickEditButton(id.toString(), row)}
            color="inherit"
          />,
        ];
      },
    },
  ];

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
      {selectedTrackToEdit ? (
        <EditTrackSideForm
          trackToEdit={selectedTrackToEdit}
          open={true}
          onClose={onEditTrackSideFormClose}
          onTrackUpdated={onTrackUpdated}
        ></EditTrackSideForm>
      ) : (
        <></>
      )}
    </Paper>
  );
}
