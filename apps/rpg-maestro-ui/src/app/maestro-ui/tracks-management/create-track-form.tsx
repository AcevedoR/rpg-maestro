import React, { useEffect, useState } from 'react';
import TextField from '@mui/material/TextField';
import { Box } from '@mui/material';
import Autocomplete from '@mui/material/Autocomplete';
import Button from '@mui/material/Button';
import { Track } from '@rpg-maestro/rpg-maestro-api-contract';
import { createTrack, createTrackFromYoutube } from '../maestro-api';
import { toastInfo, toastSuccess } from '../../ui-components/toast-popup';

export interface CreateTrackFormProps {
  sessionId: string;
  consumeFileUploadedEvent: () => string | null;
  onSubmitted: () => void;
}

export function CreateTrackForm(props: CreateTrackFormProps) {
  const { sessionId, consumeFileUploadedEvent, onSubmitted } = props;
  const [inputUrl, setInputUrl] = useState<string | null | undefined>(undefined);
  const [inputUrlError, setInputUrlError] = useState<string | null>(null);
  const [inputName, setInputName] = useState<string | undefined>(undefined);
  const [inputTags, setInputTags] = useState<string[] | null>(null);
  const [creatingTrack, setIsCreatingTrack] = useState<boolean>(false);

  useEffect(() => {
    if (inputUrl === null || (inputUrl && inputUrl.length < 3)) {
      setInputUrlError('valid URL is required');
    } else {
      setInputUrlError(null);
    }
    const consumeFileUploadedEventBody = consumeFileUploadedEvent();
    if (consumeFileUploadedEventBody) {
      setInputUrl(consumeFileUploadedEventBody);
    }
  }, [inputUrl, consumeFileUploadedEvent]);

  const isThereAnErrorInTheForm = () => {
    return inputUrlError != null && !!inputUrlError;
  };

  const onSubmit = () => {
    if (!inputUrl) {
      setInputUrl(null);
      throw Error('inputUrl should be present');
    }
    setIsCreatingTrack(true);
    if (inputUrl.startsWith('https://www.youtube.com/')) {
      createTrackFromYoutube(sessionId, inputUrl).then((res) => {
        setIsCreatingTrack(false);
        toastInfo(
          `Trying to upload and create from youtube, this might take some times depending on the track length (1-10min)`,
          10000
        );
        resetform();
        onSubmitted();
      });
    } else {
      createTrack(sessionId, {
        url: inputUrl,
        name: inputName,
        tags: inputTags ?? [],
      }).then((track: Track) => {
        console.info(`track created: ${JSON.stringify(track)}`);
        toastSuccess(`Track created: ${track.name}`, 10000);
        resetform();
        setIsCreatingTrack(false);
        onSubmitted();
      });
    }
  };

  const resetform = () => {
    setInputUrl(undefined);
    setInputName(undefined);
    setInputTags(null);
    setInputUrlError(null);
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
