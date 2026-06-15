import React, { useState } from 'react';
import { CollectionTrack, CollectionTrackCreation } from '@rpg-maestro/rpg-maestro-api-contract';
import AddIcon from '@mui/icons-material/Add';
import TextField from '@mui/material/TextField';
import Autocomplete from '@mui/material/Autocomplete';
import Button from '@mui/material/Button';

export const TRACK_COLLECTIONS_ROUTE = '/maestro/track-collections';

export const cardStyle: React.CSSProperties = {
  border: '1px solid rgba(255,255,255,0.15)',
  borderRadius: '6px',
  padding: '1rem',
  background: 'rgba(255,255,255,0.03)',
  display: 'flex',
  flexDirection: 'column',
  gap: '0.75rem',
};

export const pageStyle: React.CSSProperties = {
  minHeight: '100%',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'flex-start',
  gap: '1rem',
  padding: '1rem',
};

export function toCollectionTrackCreation(track: CollectionTrack): CollectionTrackCreation {
  return {
    source: track.source,
    name: track.name,
    tags: track.tags,
    url: track.url,
  };
}

export function buildManualTrack(url: string, name: string, tags: string[]): CollectionTrackCreation {
  return {
    url,
    name,
    tags,
    source: { origin_media: 'manual', origin_url: url, origin_name: name || url },
  };
}

type AddTrackFormProps = {
  onAdd: (track: CollectionTrackCreation) => void;
};

export function AddTrackForm({ onAdd }: AddTrackFormProps) {
  const [url, setUrl] = useState('');
  const [name, setName] = useState('');
  const [tags, setTags] = useState<string[]>([]);

  const canAdd = url.trim().length >= 3 && name.trim().length > 0;

  const handleAdd = () => {
    if (!canAdd) return;
    onAdd(buildManualTrack(url.trim(), name.trim(), tags));
    setUrl('');
    setName('');
    setTags([]);
  };

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.5rem' }}>
      <TextField
        label="Track URL"
        size="small"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        sx={{ flex: 2, minWidth: '200px' }}
      />
      <TextField
        label="Track name"
        size="small"
        value={name}
        onChange={(e) => setName(e.target.value)}
        sx={{ flex: 1, minWidth: '150px' }}
      />
      <Autocomplete
        multiple
        freeSolo
        size="small"
        options={[]}
        value={tags}
        onChange={(_event, newValue) => setTags(newValue)}
        sx={{ flex: 1, minWidth: '150px' }}
        renderInput={(params) => <TextField {...params} label="Tags (optional)" />}
      />
      <Button variant="outlined" startIcon={<AddIcon />} onClick={handleAdd} disabled={!canAdd}>
        Add track
      </Button>
    </div>
  );
}
