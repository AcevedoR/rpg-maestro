import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';
import { TrackCollection } from '@rpg-maestro/rpg-maestro-api-contract';

import { TrackCollectionsComponent } from './track-collections';

const navigateMock = vi.hoisted(() => vi.fn());

const apiMocks = vi.hoisted(() => ({
  getAllTrackCollections: vi.fn(),
  importCollectionToSession: vi.fn(),
}));

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return { ...actual, useNavigate: () => navigateMock };
});

vi.mock('../maestro-api', () => ({
  getAllTrackCollections: apiMocks.getAllTrackCollections,
  importCollectionToSession: apiMocks.importCollectionToSession,
}));

const sampleCollection: TrackCollection = {
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
      duration: 90000,
    },
  ],
  created_at: 0,
  updated_at: 0,
  created_by: 'user-1',
};

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <TrackCollectionsComponent />
    </MemoryRouter>
  );
}

describe('TrackCollectionsComponent — management mode', () => {
  beforeEach(() => {
    navigateMock.mockReset();
    apiMocks.getAllTrackCollections.mockReset();
    apiMocks.importCollectionToSession.mockReset();
  });

  it('loads and renders collections, showing the create button', async () => {
    apiMocks.getAllTrackCollections.mockResolvedValue([sampleCollection]);

    renderAt('/maestro/track-collections');

    expect(screen.getByText('Loading track collections...')).toBeTruthy();
    await waitFor(() => expect(screen.getByText('Town Ambience')).toBeTruthy());
    expect(screen.getByText('Busy market loops')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Create new collection' })).toBeTruthy();
  });

  it('shows an error message when loading fails', async () => {
    apiMocks.getAllTrackCollections.mockRejectedValue(new Error('boom'));

    renderAt('/maestro/track-collections');

    await waitFor(() => expect(screen.getByText('Unable to load track collections.')).toBeTruthy());
  });

  it('shows an empty state when there are no collections', async () => {
    apiMocks.getAllTrackCollections.mockResolvedValue([]);

    renderAt('/maestro/track-collections');

    await waitFor(() => expect(screen.getByText('No track collections yet.')).toBeTruthy());
  });

  it('navigates to the edit page when Manage is clicked', async () => {
    apiMocks.getAllTrackCollections.mockResolvedValue([sampleCollection]);

    renderAt('/maestro/track-collections');

    await waitFor(() => expect(screen.getByText('Town Ambience')).toBeTruthy());
    fireEvent.click(screen.getByRole('button', { name: 'Manage' }));

    expect(navigateMock).toHaveBeenCalledWith('/maestro/track-collections/collection-1');
  });

  it('navigates to the create page when Create new collection is clicked', async () => {
    apiMocks.getAllTrackCollections.mockResolvedValue([]);

    renderAt('/maestro/track-collections');

    await waitFor(() => expect(screen.getByText('No track collections yet.')).toBeTruthy());
    fireEvent.click(screen.getByRole('button', { name: 'Create new collection' }));

    expect(navigateMock).toHaveBeenCalledWith('/maestro/track-collections/new');
  });

  it('expands to show track names when the expand button is clicked', async () => {
    apiMocks.getAllTrackCollections.mockResolvedValue([sampleCollection]);

    renderAt('/maestro/track-collections');

    await waitFor(() => expect(screen.getByText('Town Ambience')).toBeTruthy());
    expect(screen.queryByText('Market')).toBeNull();

    fireEvent.click(screen.getByLabelText('Expand tracks'));

    expect(screen.getByText('Market')).toBeTruthy();
    expect(screen.getByText('ambient')).toBeTruthy();
    expect(screen.getByText('01:30')).toBeTruthy();
  });
});

describe('TrackCollectionsComponent — session import mode', () => {
  beforeEach(() => {
    navigateMock.mockReset();
    apiMocks.getAllTrackCollections.mockReset();
    apiMocks.importCollectionToSession.mockReset();
  });

  it('shows import buttons and hides the create button', async () => {
    apiMocks.getAllTrackCollections.mockResolvedValue([sampleCollection]);

    renderAt('/maestro/track-collections?sessionId=session-123');

    await waitFor(() => expect(screen.getByText('Town Ambience')).toBeTruthy());
    expect(screen.getByRole('button', { name: 'Import to session' })).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Create new collection' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Manage' })).toBeNull();
  });

  it('imports the collection into the current session', async () => {
    apiMocks.getAllTrackCollections.mockResolvedValue([sampleCollection]);
    apiMocks.importCollectionToSession.mockResolvedValue([]);

    renderAt('/maestro/track-collections?sessionId=session-123');

    await waitFor(() => expect(screen.getByText('Town Ambience')).toBeTruthy());
    fireEvent.click(screen.getByRole('button', { name: 'Import to session' }));

    await waitFor(() => expect(apiMocks.importCollectionToSession).toHaveBeenCalledWith('session-123', 'collection-1'));
  });
});
