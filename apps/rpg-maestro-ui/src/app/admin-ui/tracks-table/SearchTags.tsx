import * as React from 'react';
import TextField from '@mui/material/TextField';
import Stack from '@mui/material/Stack';
import Autocomplete from '@mui/material/Autocomplete';
import { Tag, Track } from '@rpg-maestro/rpg-maestro-api-contract';

export interface SearchBarProps {
  tracks: Track[];
  onTrackSearchByTagChange: (tags: Tag[] | null) => void;
}

export default function SearchTags(props: SearchBarProps) {
  const { tracks, onTrackSearchByTagChange } = props;
  const onChange = (newValue: Tag[] | null) => {
    onTrackSearchByTagChange(newValue);
  };

  const tags: Tag[] = [...new Set(tracks.flatMap((x) => x.tags))];

  return (
    <Stack spacing={2} sx={{ width: 300 }}>
      <Autocomplete
        disableClearable
        multiple
        options={tags}
        onChange={(event: React.SyntheticEvent, newValue: Tag[]) => onChange(newValue)}
        renderInput={(params) => (
          <TextField
            {...params}
            label="Search tracks by tags"
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
