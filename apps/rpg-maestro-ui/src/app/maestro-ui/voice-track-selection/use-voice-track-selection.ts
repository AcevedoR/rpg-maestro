import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Tag } from '@rpg-maestro/rpg-maestro-api-contract';
import { toastError, toastInfo } from '../../ui-components/toast-popup';
import { resolveTranscriptionProvider } from './transcription/transcription-provider-registry';
import { resolveInterpretationProvider } from './interpretation/interpretation-provider-registry';

export const DEFAULT_LISTENING_DURATION_MS = 15_000;

export type VoiceSelectionStatus = 'idle' | 'listening' | 'interpreting';

export interface VoiceSelectionResult {
  tags: Tag[];
  transcript: string;
}

export interface UseVoiceTrackSelectionParams {
  /** Tags available in the session — the vocabulary the interpreter may output. */
  availableTags: Tag[];
  /** Called once tags have been derived from the spoken transcript. */
  onResult: (result: VoiceSelectionResult) => void;
  /** How long to listen to the microphone. Defaults to {@link DEFAULT_LISTENING_DURATION_MS}. */
  listeningDurationMs?: number;
}

export interface UseVoiceTrackSelection {
  status: VoiceSelectionStatus;
  /** Best-so-far transcript while listening, for live UI feedback. */
  partialTranscript: string;
  /** Whether a supported transcription provider exists in this environment. */
  isSupported: boolean;
  /** Begin the listen → interpret → onResult flow. No-op if already running. */
  start: () => void;
}

/**
 * Orchestrates the voice-driven track selection flow: listen to the microphone,
 * transcribe, interpret the transcript into session tags, and hand the tags back to
 * the caller. Provider selection is delegated to the transcription/interpretation
 * registries so the concrete implementations can evolve independently.
 */
export function useVoiceTrackSelection({
  availableTags,
  onResult,
  listeningDurationMs = DEFAULT_LISTENING_DURATION_MS,
}: UseVoiceTrackSelectionParams): UseVoiceTrackSelection {
  const [status, setStatus] = useState<VoiceSelectionStatus>('idle');
  const [partialTranscript, setPartialTranscript] = useState('');

  const transcriptionProvider = useMemo(() => resolveTranscriptionProvider(), []);
  const interpretationProvider = useMemo(() => resolveInterpretationProvider(), []);

  // Keep the latest values without forcing `start` to be re-created every render.
  const availableTagsRef = useRef(availableTags);
  availableTagsRef.current = availableTags;
  const onResultRef = useRef(onResult);
  onResultRef.current = onResult;

  const abortControllerRef = useRef<AbortController | null>(null);
  const isMountedRef = useRef(true);
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      abortControllerRef.current?.abort();
    };
  }, []);

  const isSupported = transcriptionProvider !== null;

  const start = useCallback((): void => {
    if (!transcriptionProvider) {
      toastError('Voice track selection is not supported in this browser.', 5000);
      return;
    }
    if (abortControllerRef.current) {
      return; // a run is already in progress
    }

    const abortController = new AbortController();
    abortControllerRef.current = abortController;
    setPartialTranscript('');
    setStatus('listening');

    const run = async (): Promise<void> => {
      const { transcript } = await transcriptionProvider.listen({
        durationMs: listeningDurationMs,
        signal: abortController.signal,
        onPartialTranscript: (partial) => {
          if (isMountedRef.current) {
            setPartialTranscript(partial);
          }
        },
      });

      if (!isMountedRef.current) {
        return;
      }
      setStatus('interpreting');

      if (transcript.trim() === '') {
        toastInfo('Did not catch anything — try speaking a bit louder.', 4000);
        return;
      }

      const { tags } = await interpretationProvider.interpret({
        transcript,
        availableTags: availableTagsRef.current,
      });
      onResultRef.current({ tags, transcript });
    };

    run()
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === 'AbortError') {
          return; // cancelled (e.g. component unmounted) — nothing to report
        }
        console.error('Voice track selection failed', error);
        toastError('Could not select a track from your voice. Please try again.', 5000);
      })
      .finally(() => {
        abortControllerRef.current = null;
        if (isMountedRef.current) {
          setStatus('idle');
          setPartialTranscript('');
        }
      });
  }, [transcriptionProvider, interpretationProvider, listeningDurationMs]);

  return { status, partialTranscript, isSupported, start };
}
