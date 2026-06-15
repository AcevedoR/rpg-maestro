import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { TrackCollection } from '@rpg-maestro/rpg-maestro-api-contract';

import {
  CreateCollectionForm,
  EditableCollectionCard,
  ImportFromSessionForm,
  TrackCollectionsManagementComponent,
} from './track-collections-management';

const apiMocks = vi.hoisted(() => ({
  getAllTrackCollections: vi.fn(),
  createTrackCollection: vi.fn(),
  importTrackCollectionFromSession: vi.fn(),
  updateTrackCollection: vi.fn(),
  deleteTrackCollection: vi.fn(),
  getAllSessions: vi.fn(),
}));

vi.mock('../maestro-api', () => ({
  getAllTrackCollections: apiMocks.getAllTrackCollections,
  createTrackCollection: apiMocks.createTrackCollection,
  importTrackCollectionFromSession: apiMocks.importTrackCollectionFromSession,
  updateTrackCollection: apiMocks.updateTrackCollection,
  deleteTrackCollection: apiMocks.deleteTrackCollection,
}));

vi.mock('../../admin-ui/admin-api', () => ({
  getAllSessions: apiMocks.getAllSessions,
}));

vi.mock('../../ui-components/toast-popup', () => ({
  toastSuccess: vi.fn(),
  toastError: vi.fn(),
}));

describe('CreateCollectionForm', () => {
  it('creates a fresh empty collection with the entered id and name', async () => {
    const onCreate = vi.fn().mockResolvedValue(undefined);
    render(<CreateCollectionForm onCreate={onCreate} />);

    const createButton = screen.getByRole('button', { name: 'Create collection' }) as HTMLButtonElement;
    expect(createButton.disabled).toBe(true);

    fireEvent.change(screen.getByLabelText('Id (unique)'), { target: { value: 'forest-ambience' } });
    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Forest Ambience' } });
    fireEvent.click(createButton);

    await waitFor(() => expect(onCreate).toHaveBeenCalledTimes(1));
    expect(onCreate).toHaveBeenCalledWith({
      id: 'forest-ambience',
      name: 'Forest Ambience',
      description: undefined,
      tracks: [],
    });
  });
});

describe('ImportFromSessionForm', () => {
  it('imports a collection from a session using the entered ids and name', async () => {
    const onImport = vi.fn().mockResolvedValue(undefined);
    render(<ImportFromSessionForm sessionIds={['session-abc']} onImport={onImport} />);

    fireEvent.change(screen.getByLabelText('Session id'), { target: { value: 'session-abc' } });
    fireEvent.change(screen.getByLabelText('New collection id (unique)'), { target: { value: 'from-session' } });
    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Imported Collection' } });
    fireEvent.click(screen.getByRole('button', { name: 'Import from session' }));

    await waitFor(() => expect(onImport).toHaveBeenCalledTimes(1));
    expect(onImport).toHaveBeenCalledWith({
      sessionId: 'session-abc',
      id: 'from-session',
      name: 'Imported Collection',
      description: undefined,
      override: undefined,
    });
  });

  it('sets override=true when the overwrite checkbox is ticked', async () => {
    const onImport = vi.fn().mockResolvedValue(undefined);
    render(<ImportFromSessionForm sessionIds={[]} onImport={onImport} />);

    fireEvent.change(screen.getByLabelText('Session id'), { target: { value: 'session-abc' } });
    fireEvent.change(screen.getByLabelText('New collection id (unique)'), { target: { value: 'from-session' } });
    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Imported Collection' } });
    fireEvent.click(screen.getByRole('checkbox'));
    fireEvent.click(screen.getByRole('button', { name: 'Import from session' }));

    await waitFor(() => expect(onImport).toHaveBeenCalledTimes(1));
    expect(onImport).toHaveBeenCalledWith({
      sessionId: 'session-abc',
      id: 'from-session',
      name: 'Imported Collection',
      description: undefined,
      override: true,
    });
  });
});

describe('EditableCollectionCard', () => {
  const collection: TrackCollection = {
    id: 'collection-1',
    name: 'Town Ambience',
    description: 'Busy market loops',
    tracks: [
      {
        id: 'track-1',
        source: { origin_media: 'remote', origin_url: 'http://localhost/1', origin_name: 'Remote' },
        name: 'Market',
        tags: ['ambient'],
        url: 'http://localhost/1',
        duration: 90,
      },
    ],
    created_at: 0,
    updated_at: 0,
    created_by: 'user-1',
  };

  it('adds a manual track and saves the full update payload', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    const onDelete = vi.fn().mockResolvedValue(undefined);
    render(<EditableCollectionCard collection={collection} onSave={onSave} onDelete={onDelete} />);

    expect(screen.getByText('Market')).toBeTruthy();

    fireEvent.change(screen.getByLabelText('Track URL'), { target: { value: 'http://localhost/2' } });
    fireEvent.change(screen.getByLabelText('Track name'), { target: { value: 'Tavern' } });
    fireEvent.click(screen.getByRole('button', { name: 'Add track' }));

    expect(screen.getByText('Tavern')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));

    await waitFor(() => expect(onSave).toHaveBeenCalledTimes(1));
    expect(onSave).toHaveBeenCalledWith('collection-1', {
      id: 'collection-1',
      name: 'Town Ambience',
      description: 'Busy market loops',
      tracks: [
        { source: collection.tracks[0].source, name: 'Market', tags: ['ambient'], url: 'http://localhost/1' },
        {
          source: { origin_media: 'manual', origin_url: 'http://localhost/2', origin_name: 'Tavern' },
          name: 'Tavern',
          tags: [],
          url: 'http://localhost/2',
        },
      ],
    });
  });

  it('removes a track before saving', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    const onDelete = vi.fn().mockResolvedValue(undefined);
    render(<EditableCollectionCard collection={collection} onSave={onSave} onDelete={onDelete} />);

    fireEvent.click(screen.getByLabelText('Remove Market'));
    expect(screen.queryByText('Market')).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));

    await waitFor(() => expect(onSave).toHaveBeenCalledTimes(1));
    expect(onSave).toHaveBeenCalledWith('collection-1', {
      id: 'collection-1',
      name: 'Town Ambience',
      description: 'Busy market loops',
      tracks: [],
    });
  });

  it('deletes the collection only after confirming the dialog', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    const onDelete = vi.fn().mockResolvedValue(undefined);
    render(<EditableCollectionCard collection={collection} onSave={onSave} onDelete={onDelete} />);

    fireEvent.click(screen.getByRole('button', { name: 'Delete collection' }));
    // Dialog is open but nothing deleted yet.
    expect(onDelete).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));

    await waitFor(() => expect(onDelete).toHaveBeenCalledTimes(1));
    expect(onDelete).toHaveBeenCalledWith('collection-1');
  });

  it('does not delete when the confirmation is cancelled', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    const onDelete = vi.fn().mockResolvedValue(undefined);
    render(<EditableCollectionCard collection={collection} onSave={onSave} onDelete={onDelete} />);

    fireEvent.click(screen.getByRole('button', { name: 'Delete collection' }));
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(onDelete).not.toHaveBeenCalled();
  });
});

describe('TrackCollectionsManagementComponent', () => {
  const sampleCollection: TrackCollection = {
    id: 'collection-1',
    name: 'Town Ambience',
    description: 'Busy market loops',
    tracks: [],
    created_at: 0,
    updated_at: 0,
    created_by: 'user-1',
  };

  beforeEach(() => {
    Object.values(apiMocks).forEach((mock) => mock.mockReset());
    apiMocks.getAllSessions.mockResolvedValue([]);
  });

  it('loads and renders existing collections on mount', async () => {
    apiMocks.getAllTrackCollections.mockResolvedValue([sampleCollection]);

    render(<TrackCollectionsManagementComponent />);

    await waitFor(() => expect(screen.getByText('id: collection-1')).toBeTruthy());
    expect(apiMocks.getAllSessions).toHaveBeenCalledTimes(1);
  });

  it('shows an error message when loading fails', async () => {
    apiMocks.getAllTrackCollections.mockRejectedValue(new Error('boom'));

    render(<TrackCollectionsManagementComponent />);

    await waitFor(() => expect(screen.getByText('Unable to load track collections.')).toBeTruthy());
  });

  it('creates a collection then reloads the list', async () => {
    apiMocks.getAllTrackCollections.mockResolvedValue([]);
    apiMocks.createTrackCollection.mockResolvedValue(sampleCollection);

    render(<TrackCollectionsManagementComponent />);

    await waitFor(() => expect(screen.getByText('No track collections yet.')).toBeTruthy());

    fireEvent.change(screen.getByLabelText('Id (unique)'), { target: { value: 'new-collection' } });
    fireEvent.change(screen.getAllByLabelText('Name')[0], { target: { value: 'New Collection' } });
    fireEvent.click(screen.getByRole('button', { name: 'Create collection' }));

    await waitFor(() =>
      expect(apiMocks.createTrackCollection).toHaveBeenCalledWith({
        id: 'new-collection',
        name: 'New Collection',
        description: undefined,
        tracks: [],
      })
    );
    // initial load + reload after create
    await waitFor(() => expect(apiMocks.getAllTrackCollections).toHaveBeenCalledTimes(2));
  });

  it('deletes a collection then reloads the list', async () => {
    apiMocks.getAllTrackCollections.mockResolvedValueOnce([sampleCollection]).mockResolvedValueOnce([]);
    apiMocks.deleteTrackCollection.mockResolvedValue(undefined);

    render(<TrackCollectionsManagementComponent />);

    await waitFor(() => expect(screen.getByText('id: collection-1')).toBeTruthy());

    fireEvent.click(screen.getByRole('button', { name: 'Delete collection' }));
    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));

    await waitFor(() => expect(apiMocks.deleteTrackCollection).toHaveBeenCalledWith('collection-1'));
    await waitFor(() => expect(apiMocks.getAllTrackCollections).toHaveBeenCalledTimes(2));
  });
});
