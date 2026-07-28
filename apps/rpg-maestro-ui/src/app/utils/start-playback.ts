import { displayError } from '../error-utils';

/**
 * Starts an audio element, sorting the ways `play()` can reject into the one the user has to act on and
 * the ones that are business as usual.
 *
 * Shared by the Maestro player and the player page so a rejection means the same thing on both — they
 * had drifted into two copies of the same catch block.
 */
export async function startPlayback(audio: HTMLAudioElement): Promise<void> {
  try {
    await audio.play();
  } catch (error) {
    if (error instanceof DOMException && error.name === 'NotAllowedError') {
      console.error(`Play failed: User interaction with the document is required first. Original error: ${error}`);
      displayError('This is your first time using the app, please accept autoplay by hitting play :)');
      return;
    }
    if (error instanceof DOMException && error.name === 'AbortError') {
      // A pause landed while this play() was still starting up, which is what happens every time the
      // Maestro hits pause during a sync. The pause is the newer intent and it already won, so there is
      // nothing wrong here — and reporting it as an error made it look like there was.
      console.info(`play() was superseded by a pause: ${error.message}`);
      return;
    }
    console.error('An unexpected error occurred:', error);
  }
}
