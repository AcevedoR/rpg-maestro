import { afterEach, describe, expect, it, vi } from 'vitest';
import { startPlayback } from './start-playback';
import { displayError } from '../error-utils';

vi.mock('../error-utils', () => ({ displayError: vi.fn() }));

function audioRejecting(error: unknown): HTMLAudioElement {
  return { play: () => Promise.reject(error) } as unknown as HTMLAudioElement;
}

describe('startPlayback', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.mocked(displayError).mockClear();
  });

  it('plays, and says nothing when that works', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const play = vi.fn().mockResolvedValue(undefined);

    await startPlayback({ play } as unknown as HTMLAudioElement);

    expect(play).toHaveBeenCalledOnce();
    expect(error).not.toHaveBeenCalled();
    expect(displayError).not.toHaveBeenCalled();
  });

  it('asks the user to allow autoplay, which is the one case they can do something about', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);

    await startPlayback(audioRejecting(new DOMException('blocked', 'NotAllowedError')));

    expect(displayError).toHaveBeenCalledOnce();
  });

  it('treats a play superseded by a pause as normal, not as an error', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const info = vi.spyOn(console, 'info').mockImplementation(() => undefined);

    // What the browser throws when the Maestro pauses while a play() is still starting: the pause is the
    // newer intent and has already won.
    await startPlayback(audioRejecting(new DOMException('interrupted by a call to pause()', 'AbortError')));

    expect(error).not.toHaveBeenCalled();
    expect(displayError).not.toHaveBeenCalled();
    expect(info).toHaveBeenCalledOnce();
  });

  it('still reports what it does not recognise', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    await startPlayback(audioRejecting(new Error('decoder exploded')));

    expect(error).toHaveBeenCalledOnce();
  });
});
