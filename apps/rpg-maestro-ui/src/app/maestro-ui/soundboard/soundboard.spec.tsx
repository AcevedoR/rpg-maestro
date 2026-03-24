import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { Soundboard } from './soundboard';

const mockTracks = [
  {
    id: 'track-thunder',
    name: 'thunder',
    tags: ['soundboard'],
    url: 'http://localhost/thunder.mp3',
    duration: 5,
    sessionId: 'session-1',
    created_at: 0,
    updated_at: 0,
    source: { origin_media: 'remote', origin_url: '', origin_name: '' },
  },
  {
    id: 'track-explosion',
    name: 'explosion',
    tags: ['soundboard'],
    url: 'http://localhost/explosion.mp3',
    duration: 4,
    sessionId: 'session-1',
    created_at: 0,
    updated_at: 0,
    source: { origin_media: 'remote', origin_url: '', origin_name: '' },
  },
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
});
