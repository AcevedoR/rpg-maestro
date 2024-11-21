import React, { useEffect, useState } from 'react';
import TextField from '@mui/material/TextField';
import { Box } from '@mui/material';
import Autocomplete from '@mui/material/Autocomplete';
import Button from '@mui/material/Button';
import { createTrack } from '../admin-api';
import { Track } from '@rpg-maestro/rpg-maestro-api-contract';

export interface CreateTrackFormProps {
  consumeFileUploadedEvent: () => string | null;
}

export function CreateTrackForm(props: CreateTrackFormProps) {
  const { consumeFileUploadedEvent } = props;
  const [inputUrl, setInputUrl] = useState<string | undefined>(undefined);
  const [inputUrlError, setInputUrlError] = useState<string | null>(null);
  const [inputName, setInputName] = useState<string | undefined>(undefined);
  const [inputTags, setInputTags] = useState<string[] | null>(null);
  const [creatingTrack, setIsCreatingTrack] = useState<boolean>(false);

  useEffect(() => {
    if (!inputUrl) {
      setInputUrlError('valid URL is required');
    } else {
      setInputUrlError(null);
    }
    const consumeFileUploadedEventBody = consumeFileUploadedEvent();
    if (consumeFileUploadedEventBody) {
      console.log('received event: ' + consumeFileUploadedEventBody);
      setInputUrl(consumeFileUploadedEventBody);
    }
  }, [inputUrl, consumeFileUploadedEvent]);

  const isThereAnErrorInTheForm = () => {
    return !!inputUrlError;
  };

  const onSubmit = () => {
    if (!inputUrl) {
      throw Error('inputUrl should be present');
    }
    setIsCreatingTrack(true);
    createTrack({
      url: inputUrl,
      name: inputName,
      tags: inputTags ?? [],
    }).then((track: Track) => {
      console.log(`track created: ${JSON.stringify(track)}`);
      setIsCreatingTrack(false);
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <Box component="form" sx={{ '& .MuiTextField-root': { m: 1, width: '25ch' } }} noValidate autoComplete="off">
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <TextField
            label="URL"
            value={inputUrl ?? ''}
            onChange={(x) => setInputUrl(x.target.value)}
            error={!!inputUrlError}
            helperText={inputUrlError}
          />
          <TextField label="Name (optional)" value={inputName ?? ''} onChange={(x) => setInputName(x.target.value)} />
          <Autocomplete
            multiple
            freeSolo
            options={[]}
            value={inputTags ?? []}
            onChange={(event: React.SyntheticEvent, newValue: string[] | null) => setInputTags(newValue)}
            renderInput={(params) => <TextField {...params} label="Tags (optional)" placeholder="Favorites" />}
          />
          <Button variant="contained" onClick={onSubmit} disabled={isThereAnErrorInTheForm() || creatingTrack}>
            Create track
          </Button>
        </div>
      </Box>
    </div>
  );
}
