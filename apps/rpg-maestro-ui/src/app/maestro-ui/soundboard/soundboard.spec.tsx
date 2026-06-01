import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { Soundboard } from './soundboard';
import { Track } from '@rpg-maestro/rpg-maestro-api-contract';

function mockTrack(overrides: Partial<Track> & { id: string; name: string }): Track {
  return {
    tags: ['soundboard'],
    url: 'http://localhost/sound.mp3',
    duration: 5,
    sessionId: 'session-1',
    created_at: 0,
    updated_at: 0,
    source: { origin_media: 'remote', origin_url: '', origin_name: '' },
    ...overrides,
  };
}

const mockTracks = [
  mockTrack({ id: 'track-thunder', name: 'thunder' }),
  mockTrack({ id: 'track-explosion', name: 'explosion' }),
];

describe('Soundboard', () => {
  it('calls onPlay with the correct trackId when a button is clicked', async () => {
    const onPlay = vi.fn();

    render(<Soundboard tracks={mockTracks} onPlay={onPlay} />);

    await userEvent.click(screen.getByText('thunder'));

    expect(onPlay).toHaveBeenCalledOnce();
    expect(onPlay).toHaveBeenCalledWith('track-thunder');
  });

  it('calls onPlay with the correct trackId for a different button', async () => {
    const onPlay = vi.fn();

    render(<Soundboard tracks={mockTracks} onPlay={onPlay} />);

    await userEvent.click(screen.getByText('explosion'));

    expect(onPlay).toHaveBeenCalledOnce();
    expect(onPlay).toHaveBeenCalledWith('track-explosion');
  });

  it('renders a button for each track', () => {
    const allKnownTracks = [
      mockTrack({ id: '1', name: 'thunder' }),
      mockTrack({ id: '2', name: 'scream' }),
      mockTrack({ id: '3', name: 'door open' }),
      mockTrack({ id: '4', name: 'door shut' }),
      mockTrack({ id: '5', name: 'battle' }),
      mockTrack({ id: '6', name: 'explosion' }),
    ];

    render(<Soundboard tracks={allKnownTracks} onPlay={vi.fn()} />);

    for (const track of allKnownTracks) {
      expect(screen.getByText(track.name)).toBeDefined();
    }
    expect(screen.getAllByRole('button')).toHaveLength(6);
  });

  it('renders unknown tracks with a fallback button', () => {
    const unknownTrack = [mockTrack({ id: 'unknown-1', name: 'alien noise' })];

    render(<Soundboard tracks={unknownTrack} onPlay={vi.fn()} />);

    expect(screen.getByText('alien noise')).toBeDefined();
    expect(screen.getAllByRole('button')).toHaveLength(1);
  });

  it('renders nothing when tracks array is empty', () => {
    const { container } = render(<Soundboard tracks={[]} onPlay={vi.fn()} />);

    expect(screen.queryAllByRole('button')).toHaveLength(0);
    expect(container.querySelector('h5')?.textContent).toBe('SOUNDBOARD');
  });

  it('does not call onPlay for other buttons when one is clicked', async () => {
    const onPlay = vi.fn();

    render(<Soundboard tracks={mockTracks} onPlay={onPlay} />);

    await userEvent.click(screen.getByText('thunder'));

    expect(onPlay).toHaveBeenCalledOnce();
    expect(onPlay).not.toHaveBeenCalledWith('track-explosion');
  });
});
