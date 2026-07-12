/**
 * Provider-agnostic contract for turning a short burst of microphone audio into text.
 *
 * The first concrete implementation is the browser-native Web Speech API
 * ({@link WebSpeechTranscriptionProvider}). The abstraction leaves room for future
 * providers (e.g. a local Whisper WASM model, or a cloud transcription API) — each
 * provider owns how it captures audio and produces a transcript.
 */

export interface TranscriptionResult {
  /** The recognised text (may be empty if nothing was understood). */
  transcript: string;
  /** Name of the provider that produced this result. */
  provider: string;
}

export interface TranscriptionListenOptions {
  /** How long to listen to the microphone before resolving, in milliseconds. */
  durationMs: number;
  /** Called with the best-so-far transcript while listening, for live UI feedback. */
  onPartialTranscript?: (partialTranscript: string) => void;
  /** Allows the caller to cancel listening early (e.g. on unmount). */
  signal?: AbortSignal;
}

export interface TranscriptionProvider {
  /** Stable identifier used in logs and results. */
  readonly name: string;
  /** Whether this provider can run in the current environment. */
  isSupported(): boolean;
  /** Listen to the microphone for `durationMs`, then resolve with the transcript. */
  listen(options: TranscriptionListenOptions): Promise<TranscriptionResult>;
}
