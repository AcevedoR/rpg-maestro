import { useEffect, useState } from 'react';
import { CollectionTrackCreation, TrackCollection, TrackCollectionUpdate } from '@rpg-maestro/rpg-maestro-api-contract';
import { withAuthenticationRequired } from '@auth0/auth0-react';
import { useNavigate, useParams } from 'react-router-dom';
import KeyboardReturnIcon from '@mui/icons-material/KeyboardReturn';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogActions from '@mui/material/DialogActions';

import { deleteTrackCollection, getTrackCollection, updateTrackCollection } from '../maestro-api';
import { TextLinkWithIconWrapper } from '../../ui-components/text-link-with-icon-wrapper';
import { toastError, toastSuccess } from '../../ui-components/toast-popup';
import { isDevModeEnabled } from '../../../FeaturesConfiguration';
import { Loading } from '../../auth/Loading';
import { formatTodayDate } from '../../utils/time';
import { ToastContainer } from 'react-toastify';
import {
  AddTrackForm,
  cardStyle,
  pageStyle,
  toCollectionTrackCreation,
  TRACK_COLLECTIONS_ROUTE as COLLECTIONS_LIST_ROUTE,
} from './track-collection-shared';

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

type TrackCollectionEditContentProps = {
  collection: TrackCollection | null;
  isLoading: boolean;
  errorMessage: string | null;
  onSave: (id: string, update: TrackCollectionUpdate) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
};

export function TrackCollectionEditContent({
  collection,
  isLoading,
  errorMessage,
  onSave,
  onDelete,
}: TrackCollectionEditContentProps) {
  return (
    <div style={pageStyle}>
      <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <TextLinkWithIconWrapper
          link={COLLECTIONS_LIST_ROUTE}
          text="Back to collections"
          materialUiIcon={KeyboardReturnIcon}
        />
        <h1 style={{ margin: 0 }}>Manage collection</h1>
      </div>
      <hr style={{ width: '100%', borderColor: 'var(--gold-color)' }} />
      {isLoading && <p>Loading track collection...</p>}
      {!isLoading && errorMessage && <p>{errorMessage}</p>}
      {!isLoading && !errorMessage && collection && (
        <EditableCollectionCard
          key={`${collection.id}-${collection.updated_at}`}
          collection={collection}
          onSave={onSave}
          onDelete={onDelete}
        />
      )}
      <ToastContainer limit={5} />
    </div>
  );
}

export function TrackCollectionEditComponent() {
  const collectionId = useParams().collectionId ?? '';
  const navigate = useNavigate();
  const [collection, setCollection] = useState<TrackCollection | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setIsLoading(true);
    setErrorMessage(null);
    getTrackCollection(collectionId)
      .then((loaded) => {
        if (!active) return;
        if (loaded) {
          setCollection(loaded);
        } else {
          setErrorMessage('Track collection not found.');
        }
      })
      .catch(() => {
        if (active) setErrorMessage('Unable to load track collection.');
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [collectionId]);

  const handleSave = async (id: string, update: TrackCollectionUpdate) => {
    try {
      await updateTrackCollection(id, update);
      toastSuccess(`Collection "${update.name}" saved`, 5000);
      navigate(COLLECTIONS_LIST_ROUTE);
    } catch {
      toastError('Failed to save collection.', 8000);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteTrackCollection(id);
      toastSuccess('Collection deleted', 5000);
      navigate(COLLECTIONS_LIST_ROUTE);
    } catch {
      toastError('Failed to delete collection.', 8000);
    }
  };

  return (
    <TrackCollectionEditContent
      collection={collection}
      isLoading={isLoading}
      errorMessage={errorMessage}
      onSave={handleSave}
      onDelete={handleDelete}
    />
  );
}

export const TrackCollectionEdit = isDevModeEnabled
  ? TrackCollectionEditComponent
  : withAuthenticationRequired(TrackCollectionEditComponent, {
      onRedirecting: () => <Loading />,
    });
