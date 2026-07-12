import { TranscriptionProvider } from './transcription-provider';
import { WebSpeechTranscriptionProvider } from './web-speech-transcription-provider';

/**
 * Ordered list of known transcription providers, most-preferred first.
 * Add future providers (e.g. a local Whisper WASM model) here.
 */
export function getTranscriptionProviders(): TranscriptionProvider[] {
  return [new WebSpeechTranscriptionProvider()];
}

/** Returns the first provider that is supported in the current environment, or null. */
export function resolveTranscriptionProvider(
  providers: TranscriptionProvider[] = getTranscriptionProviders()
): TranscriptionProvider | null {
  return providers.find((provider) => provider.isSupported()) ?? null;
}
