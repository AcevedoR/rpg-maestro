import React, { useRef } from 'react';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import CircularProgress from '@mui/material/CircularProgress';
import MicIcon from '@mui/icons-material/Mic';
import { Tag } from '@rpg-maestro/rpg-maestro-api-contract';
import { useVoiceTrackSelection, VoiceSelectionResult } from './use-voice-track-selection';
import { useInterpretationConfig } from './interpretation/use-interpretation-config';
import { describeInterpretationProvider } from './interpretation/provider-label';

export interface MicrophoneTrackButtonProps {
  /** Tags available in the session — the interpreter's allowed output vocabulary. */
  availableTags: Tag[];
  /** Called with the tags (and transcript) derived from the spoken audio. */
  onResult: (result: VoiceSelectionResult) => void;
  /** The feature is admin-only; the button renders nothing unless this is true. */
  isAdmin: boolean;
}

/** A plain click listens for this long, counted from the press. */
export const TAP_LISTENING_MS = 6_000;
/** A press held at least this long is a hold rather than a click. */
export const HOLD_THRESHOLD_MS = 400;
/** After a hold is released, keep listening a bit so the last word is not cut off. */
export const HOLD_RELEASE_TAIL_MS = 500;

const BUTTON_LABEL: Record<'idle' | 'listening' | 'interpreting', string> = {
  idle: 'listen',
  listening: 'listening…',
  interpreting: 'thinking…',
};

/**
 * Microphone button that listens to the maestro, transcribes what is said, and asks
 * the interpretation layer which tags to play. A click listens for {@link TAP_LISTENING_MS};
 * press-and-hold listens while held plus {@link HOLD_RELEASE_TAIL_MS}. The feature is admin-only: for non-admin
 * users the button is not rendered at all. When visible it is enabled as long as a
 * transcription provider is available; otherwise it is disabled with an explanatory tooltip.
 */
export function MicrophoneTrackButton({
  availableTags,
  onResult,
  isAdmin,
}: MicrophoneTrackButtonProps) {
  const { status, partialTranscript, isSupported, start, stopAfter } = useVoiceTrackSelection({
    availableTags,
    onResult,
  });
  // When the current press began, while the button is held down; null otherwise.
  const pressStartedAtRef = useRef<number | null>(null);
  // Only admins ever see the button, so only they need the config fetched.
  const interpretationConfig = useInterpretationConfig(isAdmin);

  if (!isAdmin) {
    return null;
  }

  // Stays enabled while listening: a disabled button would swallow the release of a hold.
  const enabled = isSupported && status !== 'interpreting';

  const handlePointerDown = (event: React.PointerEvent<HTMLButtonElement>): void => {
    if (event.button > 0 || !start()) {
      return; // not the primary button, or a run is already in progress
    }
    pressStartedAtRef.current = Date.now();
    // Keep receiving the release even if the pointer slides off the button.
    event.currentTarget.setPointerCapture?.(event.pointerId);
  };

  const handlePointerRelease = (): void => {
    if (pressStartedAtRef.current === null) {
      return;
    }
    const heldMs = Date.now() - pressStartedAtRef.current;
    pressStartedAtRef.current = null;
    stopAfter(heldMs < HOLD_THRESHOLD_MS ? TAP_LISTENING_MS - heldMs : HOLD_RELEASE_TAIL_MS);
  };

  // Keyboard activation (Enter/Space) has no pointer events: treat it as a click.
  const handleClick = (event: React.MouseEvent<HTMLButtonElement>): void => {
    if (event.detail === 0 && start()) {
      stopAfter(TAP_LISTENING_MS);
    }
  };

  const disabledReason = !isSupported
    ? 'Your browser does not support speech recognition (try Chrome or Edge)'
    : '';

  // While listening, the live transcript is the only thing worth the space.
  const providerLabel = describeInterpretationProvider(interpretationConfig);
  const idleTitle = [disabledReason || 'Click to listen for a few seconds, or hold while you talk, to pick a track that matches the scene', providerLabel]
    .filter((part) => part !== null && part !== '')
    .join(' — ');
  const tooltipTitle = status === 'listening' && partialTranscript !== '' ? partialTranscript : idleTitle;

  return (
    <Tooltip title={tooltipTitle} placement="top" arrow>
      {/* span wrapper keeps the tooltip working while the button is disabled */}
      <span>
        <Button
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerRelease}
          onPointerCancel={handlePointerRelease}
          onClick={handleClick}
          onContextMenu={(event) => event.preventDefault()}
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
            // A long press on touch screens must not scroll, select text or open a menu.
            touchAction: 'none',
            userSelect: 'none',
            WebkitTouchCallout: 'none',
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
