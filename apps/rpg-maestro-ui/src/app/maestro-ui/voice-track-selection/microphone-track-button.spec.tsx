import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import { MicrophoneTrackButton } from './microphone-track-button';
import { UseVoiceTrackSelection } from './use-voice-track-selection';

const hookMock = vi.hoisted(() => ({ useVoiceTrackSelection: vi.fn() }));

vi.mock('./use-voice-track-selection', () => ({
  useVoiceTrackSelection: hookMock.useVoiceTrackSelection,
}));

// NODE_ENV is 'test' during vitest runs, so isDevModeEnabled is true here — the button
// is gated only by provider support, which is what these tests exercise.
function mockHook(overrides: Partial<UseVoiceTrackSelection>): void {
  hookMock.useVoiceTrackSelection.mockReturnValue({
    status: 'idle',
    partialTranscript: '',
    isSupported: true,
    start: vi.fn(),
    ...overrides,
  });
}

describe('MicrophoneTrackButton', () => {
  it('is enabled and calls start when clicked in a supported environment', () => {
    const start = vi.fn();
    mockHook({ isSupported: true, start });
    render(<MicrophoneTrackButton availableTags={['combat']} onResult={vi.fn()} />);

    const button = screen.getByRole('button', { name: /listen and pick a matching track/i });
    expect((button as HTMLButtonElement).disabled).toBe(false);
    fireEvent.click(button);
    expect(start).toHaveBeenCalledTimes(1);
  });

  it('is disabled when no transcription provider is supported', () => {
    mockHook({ isSupported: false });
    render(<MicrophoneTrackButton availableTags={['combat']} onResult={vi.fn()} />);

    const button = screen.getByRole('button', { name: /listen and pick a matching track/i });
    expect((button as HTMLButtonElement).disabled).toBe(true);
  });

  it('is disabled while a selection is in progress', () => {
    const start = vi.fn();
    mockHook({ status: 'listening', start });
    render(<MicrophoneTrackButton availableTags={['combat']} onResult={vi.fn()} />);

    const button = screen.getByRole('button', { name: /listen and pick a matching track/i });
    expect((button as HTMLButtonElement).disabled).toBe(true);
    expect(screen.getByText('listening…')).toBeTruthy();
  });
});
