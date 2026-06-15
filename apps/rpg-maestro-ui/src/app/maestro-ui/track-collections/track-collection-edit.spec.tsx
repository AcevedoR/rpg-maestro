import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { TrackCollection } from '@rpg-maestro/rpg-maestro-api-contract';

import { EditableCollectionCard, TrackCollectionEditComponent } from './track-collection-edit';

const navigateMock = vi.hoisted(() => vi.fn());

const apiMocks = vi.hoisted(() => ({
  getTrackCollection: vi.fn(),
  updateTrackCollection: vi.fn(),
  deleteTrackCollection: vi.fn(),
}));

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return { ...actual, useNavigate: () => navigateMock, useParams: () => ({ collectionId: 'collection-1' }) };
});

vi.mock('../maestro-api', () => ({
  getTrackCollection: apiMocks.getTrackCollection,
  updateTrackCollection: apiMocks.updateTrackCollection,
  deleteTrackCollection: apiMocks.deleteTrackCollection,
}));

vi.mock('../../ui-components/toast-popup', () => ({
  toastSuccess: vi.fn(),
  toastError: vi.fn(),
}));

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

describe('EditableCollectionCard', () => {
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

describe('TrackCollectionEditComponent', () => {
  beforeEach(() => {
    navigateMock.mockReset();
    Object.values(apiMocks).forEach((mock) => mock.mockReset());
  });

  it('loads the collection from the route param and renders it', async () => {
    apiMocks.getTrackCollection.mockResolvedValue(collection);

    render(<TrackCollectionEditComponent />);

    await waitFor(() => expect(screen.getByText('id: collection-1')).toBeTruthy());
    expect(apiMocks.getTrackCollection).toHaveBeenCalledWith('collection-1');
  });

  it('shows a not-found message when the collection does not exist', async () => {
    apiMocks.getTrackCollection.mockResolvedValue(null);

    render(<TrackCollectionEditComponent />);

    await waitFor(() => expect(screen.getByText('Track collection not found.')).toBeTruthy());
  });

  it('saves changes then navigates back to the list', async () => {
    apiMocks.getTrackCollection.mockResolvedValue(collection);
    apiMocks.updateTrackCollection.mockResolvedValue(collection);

    render(<TrackCollectionEditComponent />);

    await waitFor(() => expect(screen.getByText('id: collection-1')).toBeTruthy());
    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));

    await waitFor(() => expect(apiMocks.updateTrackCollection).toHaveBeenCalledTimes(1));
    expect(navigateMock).toHaveBeenCalledWith('/maestro/track-collections');
  });

  it('deletes the collection then navigates back to the list', async () => {
    apiMocks.getTrackCollection.mockResolvedValue(collection);
    apiMocks.deleteTrackCollection.mockResolvedValue(undefined);

    render(<TrackCollectionEditComponent />);

    await waitFor(() => expect(screen.getByText('id: collection-1')).toBeTruthy());
    fireEvent.click(screen.getByRole('button', { name: 'Delete collection' }));
    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));

    await waitFor(() => expect(apiMocks.deleteTrackCollection).toHaveBeenCalledWith('collection-1'));
    expect(navigateMock).toHaveBeenCalledWith('/maestro/track-collections');
  });
});
