import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import { MicrophoneTrackButton } from './microphone-track-button';
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
    start: vi.fn(),
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

  it('is enabled for an admin and calls start when clicked in a supported environment', () => {
    const start = vi.fn();
    mockHook({ isSupported: true, start });
    render(<MicrophoneTrackButton availableTags={['combat']} onResult={vi.fn()} isAdmin={true} />);

    const button = screen.getByRole('button', { name: /listen and pick a matching track/i });
    expect((button as HTMLButtonElement).disabled).toBe(false);
    fireEvent.click(button);
    expect(start).toHaveBeenCalledTimes(1);
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
    expect(tooltip.textContent).toContain('Listen and pick a track that matches the scene');
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
    expect(tooltip.textContent).toBe('Listen and pick a track that matches the scene');
  });

  it('is disabled while a selection is in progress', () => {
    const start = vi.fn();
    mockHook({ status: 'listening', start });
    render(<MicrophoneTrackButton availableTags={['combat']} onResult={vi.fn()} isAdmin={true} />);

    const button = screen.getByRole('button', { name: /listen and pick a matching track/i });
    expect((button as HTMLButtonElement).disabled).toBe(true);
    expect(screen.getByText('listening…')).toBeTruthy();
  });
});
