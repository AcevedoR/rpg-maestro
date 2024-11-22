import * as React from 'react';
import { useEffect, useState } from 'react';
import { Drawer } from '../../ui-components/drawer/drawer';
import TextField from '@mui/material/TextField';
import Autocomplete from '@mui/material/Autocomplete';
import Button from '@mui/material/Button';
import { Track } from '@rpg-maestro/rpg-maestro-api-contract';
import { updateTrack } from '../admin-api';

export interface EditTrackSideFormProps {
  open: boolean;
  onClose: () => unknown;
  trackToEdit: Track;
  onTrackUpdated: () => unknown;
}

export function EditTrackSideForm(props: EditTrackSideFormProps) {
  const { open, onClose, trackToEdit, onTrackUpdated } = props;
  const [inputUrl, setInputUrl] = useState<string | undefined>(trackToEdit.url);
  const [inputUrlError, setInputUrlError] = useState<string | null>(null);
  const [inputName, setInputName] = useState<string | undefined>(trackToEdit.name);
  const [inputTags, setInputTags] = useState<string[] | null>(trackToEdit.tags);
  const [waitingForTrackEdition, setIsWaitingForTrackEdition] = useState<boolean>(false);

  useEffect(() => {
    if (!inputUrl) {
      setInputUrlError('valid URL is required');
    } else {
      setInputUrlError(null);
    }
  }, [inputUrl]);

  const isThereAnErrorInTheForm = () => {
    return !!inputUrlError;
  };

  const onSubmit = () => {
    if (!inputUrl) {
      throw Error('inputUrl should be present');
    }
    setIsWaitingForTrackEdition(true);
    updateTrack(trackToEdit.id, {
      name: inputName,
      tags: inputTags ?? [],
    }).then((track: Track) => {
      console.log(`track updated: ${JSON.stringify(track)}`);
      setIsWaitingForTrackEdition(false);
      onTrackUpdated();

    });
  };
  return (
    <div>
      <Drawer open={open} width={600} onClose={onClose}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', padding: '20px' }}>
          <h3>Update track: {trackToEdit.id}</h3>
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
          <Button variant="contained" onClick={onSubmit} disabled={isThereAnErrorInTheForm() || waitingForTrackEdition}>
            Update track
          </Button>
        </div>
      </Drawer>
    </div>
  );
}
