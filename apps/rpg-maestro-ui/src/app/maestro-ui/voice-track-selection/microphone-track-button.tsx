import React from 'react';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import CircularProgress from '@mui/material/CircularProgress';
import MicIcon from '@mui/icons-material/Mic';
import { Tag } from '@rpg-maestro/rpg-maestro-api-contract';
import { useVoiceTrackSelection, VoiceSelectionResult } from './use-voice-track-selection';

export interface MicrophoneTrackButtonProps {
  /** Tags available in the session — the interpreter's allowed output vocabulary. */
  availableTags: Tag[];
  /** Called with the tags (and transcript) derived from the spoken audio. */
  onResult: (result: VoiceSelectionResult) => void;
  /** The feature is admin-only; the button renders nothing unless this is true. */
  isAdmin: boolean;
  /** Overrides how long the microphone listens. */
  listeningDurationMs?: number;
}

const BUTTON_LABEL: Record<'idle' | 'listening' | 'interpreting', string> = {
  idle: 'listen',
  listening: 'listening…',
  interpreting: 'thinking…',
};

/**
 * Microphone button that listens to the maestro, transcribes what is said, and asks
 * the interpretation layer which tags to play. The feature is admin-only: for non-admin
 * users the button is not rendered at all. When visible it is enabled as long as a
 * transcription provider is available; otherwise it is disabled with an explanatory tooltip.
 */
export function MicrophoneTrackButton({
  availableTags,
  onResult,
  isAdmin,
  listeningDurationMs,
}: MicrophoneTrackButtonProps) {
  const { status, partialTranscript, isSupported, start } = useVoiceTrackSelection({
    availableTags,
    onResult,
    listeningDurationMs,
  });

  if (!isAdmin) {
    return null;
  }

  const isBusy = status !== 'idle';
  const enabled = isSupported && !isBusy;

  const disabledReason = !isSupported
    ? 'Your browser does not support speech recognition (try Chrome or Edge)'
    : '';

  const tooltipTitle =
    status === 'listening' && partialTranscript !== ''
      ? partialTranscript
      : disabledReason || 'Listen and pick a track that matches the scene';

  return (
    <Tooltip title={tooltipTitle} placement="top" arrow>
      {/* span wrapper keeps the tooltip working while the button is disabled */}
      <span>
        <Button
          onClick={start}
          disabled={!enabled}
          aria-label="Listen and pick a matching track"
          sx={{
            display: 'flex',
            flexDirection: 'column',
            gap: '2px',
            color: status === 'listening' ? '#d64545' : 'var(--gold-color)',
            height: '60px',
            width: '110px',
            border: '1px solid',
            fontSize: '11px',
            fontWeight: '500',
            backgroundColor: 'rgba(57,57,57,0.15)',
            '@keyframes voice-pulse': {
              '0%': { transform: 'scale(1)', opacity: 1 },
              '50%': { transform: 'scale(1.15)', opacity: 0.6 },
              '100%': { transform: 'scale(1)', opacity: 1 },
            },
          }}
        >
          {status === 'interpreting' ? (
            <CircularProgress size={28} sx={{ color: 'var(--gold-color)' }} />
          ) : (
            <MicIcon
              sx={{
                fontSize: 30,
                animation: status === 'listening' ? 'voice-pulse 1.2s ease-in-out infinite' : 'none',
              }}
            />
          )}
          <span>{BUTTON_LABEL[status]}</span>
        </Button>
      </span>
    </Tooltip>
  );
}
