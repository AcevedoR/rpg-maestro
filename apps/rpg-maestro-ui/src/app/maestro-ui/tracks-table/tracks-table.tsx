import * as React from 'react';
import { useState } from 'react';
import { DataGrid, GridActionsCellItem, GridColDef, GridRowSelectionModel } from '@mui/x-data-grid';
import EditIcon from '@mui/icons-material/Edit';
import PlayCircleIcon from '@mui/icons-material/PlayCircle';
import PauseCircleIcon from '@mui/icons-material/PauseCircle';
import { durationInMsToString } from '../../utils/time';
import { PlayingTrack, Track } from '@rpg-maestro/rpg-maestro-api-contract';
import { EditTrackSideForm } from './edit-track-side-form';
import { createTheme, ThemeProvider } from '@mui/material/styles';

const paginationModel = { page: 0, pageSize: 10 };

export interface TrackFilters {
  trackIdToFilterOn?: string;
  tagsToFilterOn?: string[];
}

export interface TracksTableProps {
  sessionId: string;
  tracks: Track[];
  onSetTrackToPlay: (trackId: string, options?: {paused?: boolean}) => Promise<void>;
  onRefreshRequested: () => unknown;
  filters: TrackFilters;
  currentTrack: PlayingTrack | null
}

export function TracksTable(props: TracksTableProps) {
  const { sessionId, tracks, onSetTrackToPlay, filters, onRefreshRequested, currentTrack } = props;
  const [selectedTrackToEdit, setSelectedTrackToEdit] = useState<Track | null>(null);

  const onClickEditRowButton = (id: string, row: any) => {
    setSelectedTrackToEdit(row as Track);
  };
  const onClickPlayRowButton = async (id: string, row: any) => {
    await onSetTrackToPlay(id);
  };
  const onClickPauseRowButton = async (id: string, row: any) => {
    await onSetTrackToPlay(id, {paused: true});
  };
  const onEditTrackSideFormClose = () => {
    setSelectedTrackToEdit(null);
    onRefreshRequested();
  };
  const onTrackUpdated = () => {
    setSelectedTrackToEdit(null);
    onRefreshRequested();
  };
  const columns: GridColDef[] = [
    { field: 'name', minWidth: 600 },
    {
      field: 'duration',
      type: 'number',
      width: 80,
      valueGetter: (value, row) => durationInMsToString(value) + currentTrack?.id,
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
            icon={<PlayCircleIcon />}
            label="Play"
            className="textPrimary"
            onClick={() => onClickPlayRowButton(id.toString(), row)}
            color="inherit"
          />,
          <GridActionsCellItem
            icon={<PauseCircleIcon />}
            label="Play"
            className="textPrimary"
            onClick={() => onClickPauseRowButton(id.toString(), row)}
            color="inherit"
          />,
          <GridActionsCellItem
            icon={<EditIcon />}
            label="Edit"
            className="textPrimary"
            onClick={() => onClickEditRowButton(id.toString(), row)}
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
  const theme = createTheme({
    palette: {
      mode: 'dark',
    },
  });
  return (
    <div className={'tracks-table'} style={{ height: 650, width: '100%' }}>
      <ThemeProvider theme={theme}>
        <DataGrid
          rows={filter(tracks, filters)}
          columns={columns}
          initialState={{ pagination: { paginationModel } }}
          pageSizeOptions={[10, 25, 50]}
          sx={{ border: 0 }}
          onRowSelectionModelChange={onRowSelection}
          getRowClassName={(params) =>
            currentTrack && currentTrack?.id === params.id ? 'highlighted-row' : ''
          }
        />
        {selectedTrackToEdit ? (
          <EditTrackSideForm
            trackToEdit={selectedTrackToEdit}
            sessionId={sessionId}
            open={true}
            onClose={onEditTrackSideFormClose}
            onTrackUpdated={onTrackUpdated}
          ></EditTrackSideForm>
        ) : (
          <></>
        )}
      </ThemeProvider>
    </div>
  );
}

function filter(tracks: Track[], filters: TrackFilters): Track[] {
  let filteredTracks = [...tracks];
  if (filters.trackIdToFilterOn) {
    const foundTrack = filteredTracks.find((x) => x.id === filters.trackIdToFilterOn);
    return foundTrack ? [foundTrack] : [];
  }
  if (filters.tagsToFilterOn) {
    filteredTracks = filteredTracks.filter((x) =>
      filters.tagsToFilterOn?.every((requiredTag) => x.tags.includes(requiredTag))
    );
  }
  return filteredTracks;
}
