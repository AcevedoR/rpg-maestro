import React, { useEffect, useState } from 'react';
import {
  CollectionTrack,
  CollectionTrackCreation,
  SessionPlayingTracks,
  TrackCollection,
  TrackCollectionCreation,
  TrackCollectionImportFromSession,
  TrackCollectionUpdate,
} from '@rpg-maestro/rpg-maestro-api-contract';
import { withAuthenticationRequired } from '@auth0/auth0-react';
import KeyboardReturnIcon from '@mui/icons-material/KeyboardReturn';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import AddIcon from '@mui/icons-material/Add';
import TextField from '@mui/material/TextField';
import Autocomplete from '@mui/material/Autocomplete';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogActions from '@mui/material/DialogActions';

import {
  createTrackCollection,
  deleteTrackCollection,
  getAllTrackCollections,
  importTrackCollectionFromSession,
  updateTrackCollection,
} from '../maestro-api';
import { getAllSessions } from '../../admin-ui/admin-api';
import { Loading } from '../../auth/Loading';
import { TextLinkWithIconWrapper } from '../../ui-components/text-link-with-icon-wrapper';
import { toastError, toastSuccess } from '../../ui-components/toast-popup';
import { isDevModeEnabled } from '../../../FeaturesConfiguration';
import { formatTodayDate } from '../../utils/time';
import { ToastContainer } from 'react-toastify';

const cardStyle: React.CSSProperties = {
  border: '1px solid rgba(255,255,255,0.15)',
  borderRadius: '6px',
  padding: '1rem',
  background: 'rgba(255,255,255,0.03)',
  display: 'flex',
  flexDirection: 'column',
  gap: '0.75rem',
};

function toCollectionTrackCreation(track: CollectionTrack): CollectionTrackCreation {
  return {
    source: track.source,
    name: track.name,
    tags: track.tags,
    url: track.url,
  };
}

function buildManualTrack(url: string, name: string, tags: string[]): CollectionTrackCreation {
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

function AddTrackForm({ onAdd }: AddTrackFormProps) {
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

type EditableCollectionCardProps = {
  collection: TrackCollection;
  onSave: (id: string, update: TrackCollectionUpdate) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
};

export function EditableCollectionCard({ collection, onSave, onDelete }: EditableCollectionCardProps) {
  const [name, setName] = useState(collection.name);
  const [description, setDescription] = useState(collection.description ?? '');
  const [tracks, setTracks] = useState<CollectionTrackCreation[]>(collection.tracks.map(toCollectionTrackCreation));
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

  const removeTrack = (index: number) => {
    setTracks((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(collection.id, {
        id: collection.id,
        name: name.trim(),
        description: description.trim() === '' ? undefined : description.trim(),
        tracks,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    setConfirmDeleteOpen(false);
    setIsDeleting(true);
    try {
      await onDelete(collection.id);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div style={cardStyle}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
        <span style={{ fontWeight: 'bold' }}>id: {collection.id}</span>
        <span style={{ opacity: 0.5, fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
          updated {formatTodayDate(collection.updated_at)}
        </span>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
        <TextField
          label="Name"
          size="small"
          value={name}
          onChange={(e) => setName(e.target.value)}
          sx={{ flex: 1, minWidth: '180px' }}
        />
        <TextField
          label="Description"
          size="small"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          sx={{ flex: 2, minWidth: '220px' }}
        />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
        {tracks.length === 0 && (
          <span style={{ opacity: 0.6, fontSize: '0.9rem' }}>No tracks in this collection yet.</span>
        )}
        {tracks.map((track, index) => (
          <div
            key={`${track.url}-${index}`}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '0.25rem 0',
              borderBottom: '1px solid rgba(255,255,255,0.05)',
            }}
          >
            <span style={{ flex: 1, fontSize: '0.9rem' }}>{track.name}</span>
            {track.tags.length > 0 && (
              <span style={{ fontSize: '0.75rem', opacity: 0.6 }}>{track.tags.join(', ')}</span>
            )}
            <IconButton size="small" aria-label={`Remove ${track.name}`} onClick={() => removeTrack(index)}>
              <DeleteOutlineIcon fontSize="small" />
            </IconButton>
          </div>
        ))}
      </div>
      <AddTrackForm onAdd={(track) => setTracks((prev) => [...prev, track])} />
      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
        <Button
          variant="outlined"
          color="error"
          startIcon={<DeleteOutlineIcon />}
          onClick={() => setConfirmDeleteOpen(true)}
          disabled={isDeleting || isSaving}
        >
          {isDeleting ? 'Deleting...' : 'Delete collection'}
        </Button>
        <Button variant="contained" onClick={handleSave} disabled={isSaving || isDeleting || name.trim().length === 0}>
          {isSaving ? 'Saving...' : 'Save changes'}
        </Button>
      </div>
      <Dialog open={confirmDeleteOpen} onClose={() => setConfirmDeleteOpen(false)}>
        <DialogTitle>Delete collection?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            This permanently deletes "{collection.name}" and its {tracks.length}{' '}
            {tracks.length === 1 ? 'track' : 'tracks'}. This cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDeleteOpen(false)}>Cancel</Button>
          <Button color="error" onClick={handleDelete}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}

type CreateCollectionFormProps = {
  onCreate: (creation: TrackCollectionCreation) => Promise<void>;
};

export function CreateCollectionForm({ onCreate }: CreateCollectionFormProps) {
  const [id, setId] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const canCreate = id.trim().length > 0 && name.trim().length > 0;

  const handleCreate = async () => {
    if (!canCreate) return;
    setIsCreating(true);
    try {
      await onCreate({
        id: id.trim(),
        name: name.trim(),
        description: description.trim() === '' ? undefined : description.trim(),
        tracks: [],
      });
      setId('');
      setName('');
      setDescription('');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div style={cardStyle}>
      <h3 style={{ margin: 0 }}>Create a fresh collection</h3>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
        <TextField
          label="Id (unique)"
          size="small"
          value={id}
          onChange={(e) => setId(e.target.value)}
          sx={{ flex: 1, minWidth: '160px' }}
        />
        <TextField
          label="Name"
          size="small"
          value={name}
          onChange={(e) => setName(e.target.value)}
          sx={{ flex: 1, minWidth: '160px' }}
        />
        <TextField
          label="Description (optional)"
          size="small"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          sx={{ flex: 2, minWidth: '220px' }}
        />
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Button variant="contained" onClick={handleCreate} disabled={!canCreate || isCreating}>
          {isCreating ? 'Creating...' : 'Create collection'}
        </Button>
      </div>
    </div>
  );
}

type ImportFromSessionFormProps = {
  sessionIds: string[];
  onImport: (request: TrackCollectionImportFromSession) => Promise<void>;
};

export function ImportFromSessionForm({ sessionIds, onImport }: ImportFromSessionFormProps) {
  const [sessionId, setSessionId] = useState('');
  const [id, setId] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [override, setOverride] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  const canImport = sessionId.trim().length > 0 && id.trim().length > 0 && name.trim().length > 0;

  const handleImport = async () => {
    if (!canImport) return;
    setIsImporting(true);
    try {
      await onImport({
        sessionId: sessionId.trim(),
        id: id.trim(),
        name: name.trim(),
        description: description.trim() === '' ? undefined : description.trim(),
        override: override ? true : undefined,
      });
      setSessionId('');
      setId('');
      setName('');
      setDescription('');
      setOverride(false);
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div style={cardStyle}>
      <h3 style={{ margin: 0 }}>Import tracks from an existing session</h3>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
        <Autocomplete
          freeSolo
          size="small"
          options={sessionIds}
          value={sessionId}
          onChange={(_event, newValue) => setSessionId(newValue ?? '')}
          onInputChange={(_event, newValue) => setSessionId(newValue)}
          sx={{ flex: 1, minWidth: '200px' }}
          renderInput={(params) => <TextField {...params} label="Session id" />}
        />
        <TextField
          label="New collection id (unique)"
          size="small"
          value={id}
          onChange={(e) => setId(e.target.value)}
          sx={{ flex: 1, minWidth: '180px' }}
        />
        <TextField
          label="Name"
          size="small"
          value={name}
          onChange={(e) => setName(e.target.value)}
          sx={{ flex: 1, minWidth: '160px' }}
        />
        <TextField
          label="Description (optional)"
          size="small"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          sx={{ flex: 2, minWidth: '220px' }}
        />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem' }}>
        <FormControlLabel
          control={<Checkbox checked={override} onChange={(e) => setOverride(e.target.checked)} />}
          label="Overwrite if a collection with this id already exists"
        />
        <Button variant="contained" onClick={handleImport} disabled={!canImport || isImporting}>
          {isImporting ? 'Importing...' : 'Import from session'}
        </Button>
      </div>
    </div>
  );
}

type TrackCollectionsManagementContentProps = {
  trackCollections: TrackCollection[];
  sessionIds: string[];
  isLoading: boolean;
  errorMessage: string | null;
  onCreate: (creation: TrackCollectionCreation) => Promise<void>;
  onImportFromSession: (request: TrackCollectionImportFromSession) => Promise<void>;
  onUpdate: (id: string, update: TrackCollectionUpdate) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
};

export function TrackCollectionsManagementContent({
  trackCollections,
  sessionIds,
  isLoading,
  errorMessage,
  onCreate,
  onImportFromSession,
  onUpdate,
  onDelete,
}: TrackCollectionsManagementContentProps) {
  return (
    <div
      style={{
        minHeight: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-start',
        gap: '1rem',
        padding: '1rem',
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <TextLinkWithIconWrapper link="/maestro/admin" text="Back to admin" materialUiIcon={KeyboardReturnIcon} />
        <h1 style={{ margin: 0 }}>Manage track collections</h1>
      </div>
      <hr style={{ width: '100%', borderColor: 'var(--gold-color)' }} />
      <CreateCollectionForm onCreate={onCreate} />
      <ImportFromSessionForm sessionIds={sessionIds} onImport={onImportFromSession} />
      <h2 style={{ margin: '0.5rem 0 0' }}>Existing collections</h2>
      {isLoading && <p>Loading track collections...</p>}
      {!isLoading && errorMessage && <p>{errorMessage}</p>}
      {!isLoading && !errorMessage && trackCollections.length === 0 && <p>No track collections yet.</p>}
      {!isLoading && !errorMessage && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {[...trackCollections]
            .sort((a, b) => b.updated_at - a.updated_at)
            .map((collection) => (
              <EditableCollectionCard
                key={`${collection.id}-${collection.updated_at}`}
                collection={collection}
                onSave={onUpdate}
                onDelete={onDelete}
              />
            ))}
        </div>
      )}
      <ToastContainer limit={5} />
    </div>
  );
}

export function TrackCollectionsManagementComponent() {
  const [trackCollections, setTrackCollections] = useState<TrackCollection[]>([]);
  const [sessions, setSessions] = useState<SessionPlayingTracks[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadTrackCollections = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const collections = await getAllTrackCollections();
      setTrackCollections(collections);
    } catch {
      setErrorMessage('Unable to load track collections.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTrackCollections();
    getAllSessions()
      .then(setSessions)
      .catch(() => undefined);
  }, []);

  const handleCreate = async (creation: TrackCollectionCreation) => {
    try {
      await createTrackCollection(creation);
      toastSuccess(`Collection "${creation.name}" created`, 5000);
      await loadTrackCollections();
    } catch {
      toastError('Failed to create collection. The id may already be in use.', 8000);
    }
  };

  const handleImportFromSession = async (request: TrackCollectionImportFromSession) => {
    try {
      await importTrackCollectionFromSession(request);
      toastSuccess(`Collection "${request.name}" imported from session`, 5000);
      await loadTrackCollections();
    } catch {
      toastError('Failed to import from session. Check the session id and that the collection id is unique.', 8000);
    }
  };

  const handleUpdate = async (id: string, update: TrackCollectionUpdate) => {
    try {
      await updateTrackCollection(id, update);
      toastSuccess(`Collection "${update.name}" saved`, 5000);
      await loadTrackCollections();
    } catch {
      toastError('Failed to save collection.', 8000);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteTrackCollection(id);
      toastSuccess('Collection deleted', 5000);
      await loadTrackCollections();
    } catch {
      toastError('Failed to delete collection.', 8000);
    }
  };

  return (
    <TrackCollectionsManagementContent
      trackCollections={trackCollections}
      sessionIds={sessions.map((session) => session.sessionId)}
      isLoading={isLoading}
      errorMessage={errorMessage}
      onCreate={handleCreate}
      onImportFromSession={handleImportFromSession}
      onUpdate={handleUpdate}
      onDelete={handleDelete}
    />
  );
}

export const TrackCollectionsManagement = isDevModeEnabled
  ? TrackCollectionsManagementComponent
  : withAuthenticationRequired(TrackCollectionsManagementComponent, {
      onRedirecting: () => <Loading />,
    });
