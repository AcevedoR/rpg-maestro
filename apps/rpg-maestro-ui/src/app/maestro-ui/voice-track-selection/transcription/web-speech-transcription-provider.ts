import {
  TranscriptionListenOptions,
  TranscriptionProvider,
  TranscriptionResult,
} from './transcription-provider';
import { getSpeechRecognitionCtor, SpeechRecognitionLike } from './web-speech.types';

/**
 * Transcription provider backed by the browser-native Web Speech API
 * (`SpeechRecognition` / `webkitSpeechRecognition`). Adds no dependencies and needs
 * no model download, but is only available in Chromium-based browsers and relies on
 * the browser's (potentially remote) recognition service.
 */
export class WebSpeechTranscriptionProvider implements TranscriptionProvider {
  readonly name = 'web-speech';

  isSupported(): boolean {
    return getSpeechRecognitionCtor() !== undefined;
  }

  listen({ durationMs, onPartialTranscript, signal }: TranscriptionListenOptions): Promise<TranscriptionResult> {
    const SpeechRecognitionCtor = getSpeechRecognitionCtor();
    if (!SpeechRecognitionCtor) {
      return Promise.reject(new Error('SpeechRecognition is not supported in this browser'));
    }

    return new Promise<TranscriptionResult>((resolve, reject) => {
      const recognition: SpeechRecognitionLike = new SpeechRecognitionCtor();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = navigator.language || 'en-US';

      let finalTranscript = '';
      let settled = false;
      const timers: { stop?: ReturnType<typeof setTimeout> } = {};

      const cleanup = (): void => {
        if (timers.stop) {
          clearTimeout(timers.stop);
        }
        signal?.removeEventListener('abort', onAbort);
        recognition.onresult = null;
        recognition.onerror = null;
        recognition.onend = null;
      };

      const resolveOnce = (): void => {
        if (settled) {
          return;
        }
        settled = true;
        cleanup();
        resolve({ transcript: finalTranscript.trim(), provider: this.name });
      };

      const rejectOnce = (error: Error): void => {
        if (settled) {
          return;
        }
        settled = true;
        cleanup();
        reject(error);
      };

      const onAbort = (): void => {
        try {
          recognition.abort();
        } catch {
          // ignore — we are tearing down anyway
        }
        rejectOnce(new DOMException('Transcription aborted', 'AbortError'));
      };

      recognition.onresult = (event): void => {
        let interim = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          const text = result[0]?.transcript ?? '';
          if (result.isFinal) {
            finalTranscript += text;
          } else {
            interim += text;
          }
        }
        onPartialTranscript?.(`${finalTranscript} ${interim}`.trim());
      };

      recognition.onerror = (event): void => {
        // A silent recording ('no-speech') or a deliberate stop ('aborted') is not a
        // hard failure — resolve with whatever text (if any) we already captured.
        if (event.error === 'no-speech' || event.error === 'aborted') {
          resolveOnce();
          return;
        }
        rejectOnce(new Error(`Speech recognition error: ${event.error}`));
      };

      recognition.onend = (): void => resolveOnce();

      if (signal?.aborted) {
        onAbort();
        return;
      }
      signal?.addEventListener('abort', onAbort);

      try {
        recognition.start();
      } catch (error) {
        rejectOnce(error instanceof Error ? error : new Error(String(error)));
        return;
      }

      timers.stop = setTimeout(() => {
        try {
          recognition.stop();
        } catch {
          // `onend` will still fire and resolve the promise
        }
      }, durationMs);
    });
  }
}
