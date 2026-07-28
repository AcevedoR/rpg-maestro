import AudioPlayer from 'react-h5-audio-player';
import H5AudioPlayer from 'react-h5-audio-player';
import { ToastContainer } from 'react-toastify';
import React, { LegacyRef, useCallback, useEffect, useRef, useState } from 'react';
import { resolveSync } from '../track-sync/track-sync';
import { subscribeToSessionPlayingTracks } from '../track-sync/session-stream';
import { displayError } from '../error-utils';
import { PlayingTrack, SessionPlayingTracks } from '@rpg-maestro/rpg-maestro-api-contract';
import { getSessionPlayingTracks } from '../tracks-api';
import { serverNow, startServerTimeSync } from '../utils/server-time';
import { startPlayback } from '../utils/start-playback';
import GithubSourceCodeLink from '../ui-components/github-source-code-link/github-source-code-link';
import './audio-player-readonly.css';
import MusicNoteIcon from '@mui/icons-material/MusicNote';
import { TextLinkWithIconWrapper } from '../ui-components/text-link-with-icon-wrapper';
import SpatialAudioOffIcon from '@mui/icons-material/SpatialAudioOff';
import { useParams } from 'react-router';
import { Typography } from '@mui/material';

/** How often the session is polled while the push stream is down. */
export const SYNC_TRACK_INTERVAL_MS = 1000;

/**
 * How often the session is polled while the push stream *is* up. The stream carries every change, so
 * this is only there to close the gap the stream cannot: an event dropped by a proxy, or a fanout that
 * did not reach this instance. Rare enough that a slow poll is the right price — which is the whole
 * point of the stream, since a room of listeners polling every second scales with the room.
 */
export const SYNC_TRACK_FALLBACK_INTERVAL_MS = 15000;

/**
 * How many consecutive 404s before we tell the player the session does not exist and stop polling.
 * More than one, because a 404 does not always mean "no such session": an ingress can serve 404 for
 * a few seconds during a rolling backend deploy, and a misconfigured API URL 404s every route. A
 * single strike would turn those into a permanent, wrong, unrecoverable-without-reload error.
 */
export const CONSECUTIVE_NOT_FOUND_BEFORE_GIVING_UP = 3;

export function PlayersUi() {
  const [currentTrack, setCurrentTrack] = useState<PlayingTrack | null>(null);
  const [sessionNotFound, setSessionNotFound] = useState(false);
  const [streamConnected, setStreamConnected] = useState(false);
  const consecutiveNotFound = useRef(0);
  const audioPlayer = useRef<H5AudioPlayer>();
  const effectAudioRef = useRef<HTMLAudioElement>(null);
  const sessionId = useParams().sessionId ?? '';
  const latestSessionId = useRef(sessionId);
  // What is playing here right now, as a ref and not just as state: the stream's handler is registered
  // once per session and would otherwise keep comparing against whatever was playing when it was
  // registered.
  const localCurrentTrack = useRef<PlayingTrack | null>(null);
  const localShortEffectTrack = useRef<PlayingTrack | null>(null);
  if (sessionId === '') {
    displayError('no session found in URL (it should be https://{URL}/session/{sessionId})');
  }

  // A new session id deserves a fresh attempt, even if the previous one did not exist.
  useEffect(() => {
    latestSessionId.current = sessionId;
    setSessionNotFound(false);
    consecutiveNotFound.current = 0;
  }, [sessionId]);

  // Playback positions are timestamps on the server's clock, so this browser's own clock is not a
  // usable reference for them, see utils/server-time.ts.
  useEffect(() => startServerTimeSync(), []);

  /**
   * Brings the audio in line with a state the server reported — whether it was pushed over the stream
   * or fetched by the fallback poll below. Both go through here so that a change sounds the same
   * whichever way it arrived.
   */
  const applyServerState = useCallback(async (serverState: SessionPlayingTracks) => {
    const syncResult = resolveSync(
      serverState,
      audioPlayer.current?.audio?.current?.currentTime ?? null,
      localCurrentTrack.current,
      localShortEffectTrack.current,
      serverNow()
    );

    // Handle current track sync
    const newerServerTrack = syncResult.currentTrack;
    if (newerServerTrack) {
      console.info('synchronizing track');
      localCurrentTrack.current = newerServerTrack;
      setCurrentTrack(newerServerTrack);
      if (audioPlayer.current?.audio?.current) {
        if (audioPlayer.current.audio.current.src !== newerServerTrack.url) {
          audioPlayer.current.audio.current.src = newerServerTrack.url;
        }
        audioPlayer.current.audio.current.title = newerServerTrack.name;
        const currentPlayTime = newerServerTrack.getCurrentPlayTime(serverNow());
        audioPlayer.current.audio.current.currentTime = currentPlayTime / 1000;
        if (newerServerTrack.isPaused) {
          audioPlayer.current.audio.current.pause();
        } else {
          await startPlayback(audioPlayer.current.audio.current);
        }
      } else {
        console.warn('audio player not available yet');
      }
    }

    // Handle short effect track
    const newEffect = syncResult.shortEffectTrack;
    if (newEffect && effectAudioRef.current) {
      console.info('playing short effect track:', newEffect.name);
      localShortEffectTrack.current = newEffect;
      effectAudioRef.current.src = newEffect.url;
      effectAudioRef.current.currentTime = 0;
      try {
        await effectAudioRef.current.play();
      } catch (error) {
        console.error('Failed to play short effect track:', error);
      }
    }
  }, []);

  // The push channel: one connection per listener, fed by the Maestro's writes wherever they landed.
  useEffect(() => {
    // A session that does not exist has nothing to push, and its stream would only 404 in a loop.
    if (sessionNotFound) {
      return;
    }
    return subscribeToSessionPlayingTracks(sessionId, {
      onTracks: (tracks) => {
        // Pushed state cannot tell us a session is missing — that is what the poll's 404s are for — so
        // the strike counter is left alone here.
        applyServerState(tracks);
      },
      onStatusChange: (status) => setStreamConnected(status === 'connected'),
    });
  }, [sessionId, sessionNotFound, applyServerState]);

  useEffect(() => {
    // Polling a session that does not exist can never succeed, so no interval is set up at all.
    if (sessionNotFound) {
      return;
    }

    async function resyncOnUi() {
      // Keyed on the session the request was issued for, not on effect teardown: dropping a response
      // on every re-run could starve the consecutive-404 counter below and leave a missing session
      // undetected forever.
      const requestedFor = sessionId;
      const serverState = await getSessionPlayingTracks(sessionId);
      if (requestedFor !== latestSessionId.current) {
        return;
      }
      if (serverState === 'AbortedRequestError') {
        return;
      }
      if (serverState === 'SessionNotFoundError') {
        consecutiveNotFound.current += 1;
        if (consecutiveNotFound.current >= CONSECUTIVE_NOT_FOUND_BEFORE_GIVING_UP) {
          // Flipping this re-runs both effects, whose cleanups stop the interval and the stream.
          setSessionNotFound(true);
        }
        return;
      }
      consecutiveNotFound.current = 0;
      await applyServerState(serverState);
    }

    resyncOnUi();
    const id = setInterval(() => {
      resyncOnUi();
    }, streamConnected ? SYNC_TRACK_FALLBACK_INTERVAL_MS : SYNC_TRACK_INTERVAL_MS);
    return () => clearInterval(id);
  }, [sessionId, sessionNotFound, streamConnected, applyServerState]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-around', alignItems: 'center', minHeight: '100vh', padding: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%' }}>
        <div style={{ width: '30%', minWidth: 0 }} />
        <Typography
          variant="h1"
          sx={{
            textAlign: 'center',
            fontSize: '2.5rem',
            fontWeight: 700,
            background: 'linear-gradient(to bottom, #daa520 0%, #f4e4bc 30%, #8b4513 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            textShadow: '0 4px 20px rgba(218, 165, 32, 0.2)',
          }}
        >
          RPG-Maestro player UI
        </Typography>
        <div style={{ width: '30%', minWidth: '170px', display: 'flex', justifyContent: 'flex-end' }}>
          <TextLinkWithIconWrapper
            link={`/maestro/${sessionId}`}
            text={'Maestro interface is available here'}
            materialUiIcon={SpatialAudioOffIcon}
          />
        </div>
      </div>

      {sessionNotFound ? (
        <div
          // deliberately not role="alert": that role is how tests target react-toastify toasts, and
          // a second match would break strict-mode locators. This is page content, not a toast.
          role="status"
          style={{ textAlign: 'center', maxWidth: 800, margin: '2rem auto', color: 'var(--text-secondary)', lineHeight: 1.6 }}
        >
          <p style={{ margin: '1rem 0', fontSize: '1.1rem' }}>
            Session &apos;{sessionId}&apos; does not exist. Double-check the link your Maestro shared with you.
          </p>
        </div>
      ) : (
        <div style={{ textAlign: 'center', maxWidth: 800, margin: '2rem auto', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
          <p style={{ margin: '1rem 0', fontSize: '1.1rem' }}>
            Welcome! This app is primarily meant for TTRPG games: a Maestro manages the current track being played, the
            track is synced between all Players on this page.
          </p>
          <p style={{ margin: '1rem 0', fontSize: '1.1rem' }}>To avoid sync issues, Players can only change their volume.</p>
        </div>
      )}

      <AudioPlayer
        ref={audioPlayer as LegacyRef<H5AudioPlayer>}
        loop={true}
        showJumpControls={false}
        showSkipControls={false}
        customAdditionalControls={undefined}
        className={'audio-player-readonly'}
        header={
          <div>
            <span>You are listening to:</span>
            <h3
              style={{
                fontSize: '1rem',
                lineHeight: '2em',
                maxHeight: '4em',
                textOverflow: 'revert',
                overflow: 'hidden',
                wordBreak: 'break-all',
                margin: 0,
              }}
            >
              {currentTrack?.name}
            </h3>
          </div>
        }
        customIcons={{
          pause: <MusicNoteIcon sx={{ cursor: 'not-allowed' }} />,
        }}
      />

      <audio ref={effectAudioRef} style={{ display: 'none' }} />
      <GithubSourceCodeLink />
      <ToastContainer limit={5} />
    </div>
  );
}
