import { useEffect, useState } from 'react';
import {
  SessionPlayingTracks,
  TrackCollectionCreation,
  TrackCollectionImportFromSession,
} from '@rpg-maestro/rpg-maestro-api-contract';
import { withAuthenticationRequired } from '@auth0/auth0-react';
import { useNavigate } from 'react-router-dom';
import KeyboardReturnIcon from '@mui/icons-material/KeyboardReturn';
import TextField from '@mui/material/TextField';
import Autocomplete from '@mui/material/Autocomplete';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';

import { createTrackCollection, importTrackCollectionFromSession } from '../maestro-api';
import { getAllSessions } from '../../admin-ui/admin-api';
import { TextLinkWithIconWrapper } from '../../ui-components/text-link-with-icon-wrapper';
import { toastError, toastSuccess } from '../../ui-components/toast-popup';
import { isDevModeEnabled } from '../../../FeaturesConfiguration';
import { Loading } from '../../auth/Loading';
import { ToastContainer } from 'react-toastify';
import { cardStyle, pageStyle, TRACK_COLLECTIONS_ROUTE as COLLECTIONS_LIST_ROUTE } from './track-collection-shared';

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

type TrackCollectionCreateContentProps = {
  sessionIds: string[];
  onCreate: (creation: TrackCollectionCreation) => Promise<void>;
  onImportFromSession: (request: TrackCollectionImportFromSession) => Promise<void>;
};

export function TrackCollectionCreateContent({
  sessionIds,
  onCreate,
  onImportFromSession,
}: TrackCollectionCreateContentProps) {
  return (
    <div style={pageStyle}>
      <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <TextLinkWithIconWrapper
          link={COLLECTIONS_LIST_ROUTE}
          text="Back to collections"
          materialUiIcon={KeyboardReturnIcon}
        />
        <h1 style={{ margin: 0 }}>Create a track collection</h1>
      </div>
      <hr style={{ width: '100%', borderColor: 'var(--gold-color)' }} />
      <CreateCollectionForm onCreate={onCreate} />
      <ImportFromSessionForm sessionIds={sessionIds} onImport={onImportFromSession} />
      <ToastContainer limit={5} />
    </div>
  );
}

export function TrackCollectionCreateComponent() {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<SessionPlayingTracks[]>([]);

  useEffect(() => {
    getAllSessions()
      .then(setSessions)
      .catch(() => undefined);
  }, []);

  const handleCreate = async (creation: TrackCollectionCreation) => {
    try {
      const created = await createTrackCollection(creation);
      toastSuccess(`Collection "${created.name}" created`, 5000);
      navigate(`${COLLECTIONS_LIST_ROUTE}/${created.id}`);
    } catch {
      toastError('Failed to create collection. The id may already be in use.', 8000);
    }
  };

  const handleImportFromSession = async (request: TrackCollectionImportFromSession) => {
    try {
      const imported = await importTrackCollectionFromSession(request);
      toastSuccess(`Collection "${imported.name}" imported from session`, 5000);
      navigate(`${COLLECTIONS_LIST_ROUTE}/${imported.id}`);
    } catch {
      toastError('Failed to import from session. Check the session id and that the collection id is unique.', 8000);
    }
  };

  return (
    <TrackCollectionCreateContent
      sessionIds={sessions.map((session) => session.sessionId)}
      onCreate={handleCreate}
      onImportFromSession={handleImportFromSession}
    />
  );
}

export const TrackCollectionCreate = isDevModeEnabled
  ? TrackCollectionCreateComponent
  : withAuthenticationRequired(TrackCollectionCreateComponent, {
      onRedirecting: () => <Loading />,
    });
