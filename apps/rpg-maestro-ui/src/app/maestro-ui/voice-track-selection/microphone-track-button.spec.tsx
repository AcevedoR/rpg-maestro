import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import {
  HOLD_RELEASE_TAIL_MS,
  HOLD_THRESHOLD_MS,
  MicrophoneTrackButton,
  TAP_LISTENING_MS,
} from './microphone-track-button';
import { UseVoiceTrackSelection } from './use-voice-track-selection';

const hookMock = vi.hoisted(() => ({
  useVoiceTrackSelection: vi.fn(),
  useInterpretationConfig: vi.fn(() => null),
}));

vi.mock('./use-voice-track-selection', () => ({
  useVoiceTrackSelection: hookMock.useVoiceTrackSelection,
}));

vi.mock('./interpretation/use-interpretation-config', () => ({
  useInterpretationConfig: hookMock.useInterpretationConfig,
}));

function mockHook(overrides: Partial<UseVoiceTrackSelection>): void {
  hookMock.useVoiceTrackSelection.mockReturnValue({
    status: 'idle',
    partialTranscript: '',
    isSupported: true,
    start: vi.fn(() => true),
    stopAfter: vi.fn(),
    ...overrides,
  });
}

describe('MicrophoneTrackButton', () => {
  it('renders nothing for non-admin users', () => {
    mockHook({ isSupported: true });
    const { container } = render(
      <MicrophoneTrackButton availableTags={['combat']} onResult={vi.fn()} isAdmin={false} />
    );
    expect(container.firstChild).toBeNull();
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('is enabled for an admin and listens for the tap duration when activated from the keyboard', () => {
    const start = vi.fn(() => true);
    const stopAfter = vi.fn();
    mockHook({ isSupported: true, start, stopAfter });
    render(<MicrophoneTrackButton availableTags={['combat']} onResult={vi.fn()} isAdmin={true} />);

    const button = screen.getByRole('button', { name: /listen and pick a matching track/i });
    expect((button as HTMLButtonElement).disabled).toBe(false);
    fireEvent.click(button, { detail: 0 });
    expect(start).toHaveBeenCalledTimes(1);
    expect(stopAfter).toHaveBeenCalledWith(TAP_LISTENING_MS);
  });

  describe('click vs hold', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });
    afterEach(() => {
      vi.useRealTimers();
    });

    function pressFor(heldMs: number): { start: ReturnType<typeof vi.fn>; stopAfter: ReturnType<typeof vi.fn> } {
      const start = vi.fn(() => true);
      const stopAfter = vi.fn();
      mockHook({ start, stopAfter });
      render(<MicrophoneTrackButton availableTags={['combat']} onResult={vi.fn()} isAdmin={true} />);
      const button = screen.getByRole('button', { name: /listen and pick a matching track/i });

      fireEvent.pointerDown(button);
      expect(start).toHaveBeenCalledTimes(1);
      expect(stopAfter).not.toHaveBeenCalled();
      vi.advanceTimersByTime(heldMs);
      fireEvent.pointerUp(button);
      // the pointer's own click must not start a second run
      fireEvent.click(button, { detail: 1 });
      expect(start).toHaveBeenCalledTimes(1);
      return { start, stopAfter };
    }

    it('a quick click keeps listening for the tap duration, counted from the press', () => {
      const { stopAfter } = pressFor(100);
      expect(stopAfter).toHaveBeenCalledExactlyOnceWith(TAP_LISTENING_MS - 100);
    });

    it('a hold listens for as long as it is held, plus a short tail', () => {
      const { stopAfter } = pressFor(HOLD_THRESHOLD_MS + 2_000);
      expect(stopAfter).toHaveBeenCalledExactlyOnceWith(HOLD_RELEASE_TAIL_MS);
    });

    it('does not schedule a stop when the press did not start a run', () => {
      const start = vi.fn(() => false);
      const stopAfter = vi.fn();
      mockHook({ status: 'listening', start, stopAfter });
      render(<MicrophoneTrackButton availableTags={['combat']} onResult={vi.fn()} isAdmin={true} />);
      const button = screen.getByRole('button', { name: /listen and pick a matching track/i });

      fireEvent.pointerDown(button);
      fireEvent.pointerUp(button);
      expect(stopAfter).not.toHaveBeenCalled();
    });
  });

  it('is disabled for an admin when no transcription provider is supported', () => {
    mockHook({ isSupported: false });
    render(<MicrophoneTrackButton availableTags={['combat']} onResult={vi.fn()} isAdmin={true} />);

    const button = screen.getByRole('button', { name: /listen and pick a matching track/i });
    expect((button as HTMLButtonElement).disabled).toBe(true);
  });

  it('names the AI provider in the hover once the config is known', async () => {
    mockHook({});
    hookMock.useInterpretationConfig.mockReturnValue({
      provider: 'typesafe-ai',
      isAvailable: true,
      model: 'jev-1.13.0',
      confidenceThreshold: 0.6,
    });
    render(<MicrophoneTrackButton availableTags={['combat']} onResult={vi.fn()} isAdmin={true} />);

    fireEvent.mouseOver(screen.getByRole('button', { name: /listen and pick a matching track/i }));

    const tooltip = await screen.findByRole('tooltip');
    expect(tooltip.textContent).toContain('using TypeSafe AI (jev-1.13.0)');
    expect(tooltip.textContent).toContain('Click to listen for a few seconds, or hold while you talk, to pick a track that matches the scene');
  });

  it('says the fallback is answering when the server has no AI configured', async () => {
    mockHook({});
    hookMock.useInterpretationConfig.mockReturnValue({
      provider: 'typesafe-ai',
      isAvailable: false,
      model: null,
      confidenceThreshold: 0.6,
    });
    render(<MicrophoneTrackButton availableTags={['combat']} onResult={vi.fn()} isAdmin={true} />);

    fireEvent.mouseOver(screen.getByRole('button', { name: /listen and pick a matching track/i }));

    expect((await screen.findByRole('tooltip')).textContent).toContain('using keyword matching');
  });

  it('keeps the plain hover text while the config is unknown', async () => {
    mockHook({});
    hookMock.useInterpretationConfig.mockReturnValue(null);
    render(<MicrophoneTrackButton availableTags={['combat']} onResult={vi.fn()} isAdmin={true} />);

    fireEvent.mouseOver(screen.getByRole('button', { name: /listen and pick a matching track/i }));

    const tooltip = await screen.findByRole('tooltip');
    expect(tooltip.textContent).toBe('Click to listen for a few seconds, or hold while you talk, to pick a track that matches the scene');
  });

  it('stays enabled while listening so the release of a hold is not lost', () => {
    mockHook({ status: 'listening' });
    render(<MicrophoneTrackButton availableTags={['combat']} onResult={vi.fn()} isAdmin={true} />);

    const button = screen.getByRole('button', { name: /listen and pick a matching track/i });
    expect((button as HTMLButtonElement).disabled).toBe(false);
    expect(screen.getByText('listening…')).toBeTruthy();
  });

  it('is disabled while the transcript is being interpreted', () => {
    mockHook({ status: 'interpreting' });
    render(<MicrophoneTrackButton availableTags={['combat']} onResult={vi.fn()} isAdmin={true} />);

    const button = screen.getByRole('button', { name: /listen and pick a matching track/i });
    expect((button as HTMLButtonElement).disabled).toBe(true);
  });
});
