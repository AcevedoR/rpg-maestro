import { render, screen, waitFor } from '@testing-library/react';
import { vi } from 'vitest';

import { TrackCollectionsComponent } from './track-collections';

const getAllTrackCollectionsMock = vi.fn();

vi.mock('../maestro-api', () => ({
  getAllTrackCollections: () => getAllTrackCollectionsMock(),
}));

describe('TrackCollectionsComponent', () => {
  beforeEach(() => {
    getAllTrackCollectionsMock.mockReset();
  });

  it('renders track collections after loading', async () => {
    getAllTrackCollectionsMock.mockResolvedValue([
      {
        id: 'collection-1',
        name: 'Town Ambience',
        description: 'Busy market loops',
        tracks: [
          {
            id: 'track-1',
            source: { origin_media: 'remote', origin_url: 'http://localhost/1', origin_name: 'Remote' },
            name: 'Market',
            tags: [],
            url: 'http://localhost/1',
            duration: 30,
          },
        ],
        created_at: 0,
        updated_at: 0,
        created_by: 'user-1',
      },
    ]);

    render(<TrackCollectionsComponent />);

    expect(screen.getByText('Loading track collections...')).toBeTruthy();

    await waitFor(() => {
      expect(screen.getByText('Town Ambience')).toBeTruthy();
    });

    expect(screen.getByText('Busy market loops')).toBeTruthy();
    expect(screen.getByText('1')).toBeTruthy();
  });

  it('sorts track collections by updated_at desc', async () => {
    getAllTrackCollectionsMock.mockResolvedValue([
      {
        id: 'collection-1',
        name: 'Older',
        description: null,
        tracks: [],
        created_at: 0,
        updated_at: 100,
        created_by: 'user-1',
      },
      {
        id: 'collection-2',
        name: 'Newer',
        description: null,
        tracks: [],
        created_at: 0,
        updated_at: 200,
        created_by: 'user-1',
      },
    ]);

    render(<TrackCollectionsComponent />);

    await waitFor(() => {
      expect(screen.getByText('Newer')).toBeTruthy();
    });

    const rows = screen.getAllByRole('row');
    const firstDataRow = rows[1];
    expect(firstDataRow.textContent).toContain('Newer');
  });
});
