import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
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

    render(
      <MemoryRouter>
        <TrackCollectionsComponent />
      </MemoryRouter>,
    );

    expect(screen.getByText('Loading track collections...')).toBeTruthy();

    await waitFor(() => {
      expect(screen.getByText('Town Ambience')).toBeTruthy();
    });

    expect(screen.getByText('Busy market loops')).toBeTruthy();
    expect(screen.getByText('1 track')).toBeTruthy();
  });

  it('expands to show track names when expand button is clicked', async () => {
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
            tags: ['ambient'],
            url: 'http://localhost/1',
            duration: 90,
          },
        ],
        created_at: 0,
        updated_at: 0,
        created_by: 'user-1',
      },
    ]);

    render(
      <MemoryRouter>
        <TrackCollectionsComponent />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText('Town Ambience')).toBeTruthy();
    });

    expect(screen.queryByText('Market')).toBeNull();

    fireEvent.click(screen.getByLabelText('Expand tracks'));

    expect(screen.getByText('Market')).toBeTruthy();
    expect(screen.getByText('ambient')).toBeTruthy();
    expect(screen.getByText('1:30')).toBeTruthy();
  });
});
