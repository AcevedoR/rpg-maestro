import * as React from 'react';
import TextField from '@mui/material/TextField';
import Stack from '@mui/material/Stack';
import Autocomplete from '@mui/material/Autocomplete';
import { Track } from '@rpg-maestro/rpg-maestro-api-contract';

export interface SearchBarProps {
  tracks: Track[];
  onTrackSearchChange: (track: Track | null) => void;
}

export default function SearchSpecificTrack(props: SearchBarProps) {
  const { tracks, onTrackSearchChange } = props;

  const onChange = (newValue: Track | null) => {
    onTrackSearchChange(newValue);
  };

  return (
    <Stack spacing={2} sx={{ width: 300 }}>
      <Autocomplete
        // disableClearable
        options={deduplicateArray(tracks)}
        getOptionLabel={(x) => (typeof x === 'string' ? x : x.name)}
        onChange={(event: React.SyntheticEvent, newValue: Track | null) => onChange(newValue)}
        renderInput={(params) => (
          <TextField
            {...params}
            label="Search specific track"
            slotProps={{
              input: {
                ...params.InputProps,
                type: 'search',
              },
            }}
          />
        )}
      />
    </Stack>
  );
}

function deduplicateArray(arr: Track[]): Track[] {
  const map = new Map<string, Track>();

  arr.forEach((item) => {
    if (!map.has(item.name)) {
      map.set(item.name, item);
    }
  });

  return Array.from(map.values());
}
