import AudioPlayer from 'react-h5-audio-player';
import H5AudioPlayer from 'react-h5-audio-player';
import { ToastContainer } from 'react-toastify';
import React, { LegacyRef, useEffect, useRef, useState } from 'react';
import { resyncCurrentTrackIfNeeded } from '../track-sync/track-sync';
import { displayError } from '../error-utils';
import { PlayingTrack } from '@rpg-maestro/rpg-maestro-api-contract';
import GithubSourceCodeLink from '../ui-components/github-source-code-link/github-source-code-link';
import './audio-player-readonly.css';
import MusicNoteIcon from '@mui/icons-material/MusicNote';
import { TextLinkWithIconWrapper } from '../ui-components/text-link-with-icon-wrapper';
import SpatialAudioOffIcon from '@mui/icons-material/SpatialAudioOff';
import { useParams } from 'react-router';
import { Typography } from '@mui/material';

export const SYNC_TRACK_INTERVAL_MS = 1000;

export function PlayersUi() {
  const [currentTrack, setCurrentTrack] = useState<PlayingTrack | null>(null);
  const audioPlayer = useRef<H5AudioPlayer>();
  const sessionId = useParams().sessionId ?? '';
  if (sessionId === '') {
    displayError('no session found in URL (it should be https://{URL}/session/{sessionId})');
  }

  useEffect(() => {
    async function resyncCurrentTrackOnUi() {
      const newerServerTrack = await resyncCurrentTrackIfNeeded(
        sessionId,
        audioPlayer.current?.audio?.current?.currentTime ?? null,
        currentTrack
      );
      if (newerServerTrack && newerServerTrack !== 'AbortedRequestError') {
        console.info('synchronizing track');
        setCurrentTrack(newerServerTrack);
        if (!newerServerTrack) {
          throw new Error('Current track is not defined');
        }
        if (audioPlayer.current?.audio?.current) {
          if (audioPlayer.current.audio.current.src !== newerServerTrack.url) {
            audioPlayer.current.audio.current.src = newerServerTrack.url;
          }
          audioPlayer.current.audio.current.title = newerServerTrack.name;
          const currentPlayTime = newerServerTrack.getCurrentPlayTime();
          audioPlayer.current.audio.current.currentTime = currentPlayTime / 1000;
          if (newerServerTrack.isPaused) {
            // paused
            audioPlayer.current.audio.current.pause();
          } else {
            // playing
            try {
              await audioPlayer.current.audio.current.play();
            } catch (error) {
              if (error instanceof DOMException && error.name === 'NotAllowedError') {
                console.error(
                  `Play failed: User interaction with the document is required first. Original error: ${error}`
                );
                displayError('This is your first time using the app, please accept autoplay by hitting play :)');
              } else {
                console.error('An unexpected error occurred:', error);
              }
            }
          }
        } else {
          console.warn('audio player not available yet');
        }
      }
    }

    resyncCurrentTrackOnUi();
    const id = setInterval(() => {
      resyncCurrentTrackOnUi();
    }, SYNC_TRACK_INTERVAL_MS);
    return () => clearInterval(id);
  }, [currentTrack, sessionId]);

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

      <div style={{ textAlign: 'center', maxWidth: 800, margin: '2rem auto', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
        <p style={{ margin: '1rem 0', fontSize: '1.1rem' }}>
          Welcome! This app is primarily meant for TTRPG games: a Maestro manages the current track being played, the
          track is synced between all Players on this page.
        </p>
        <p style={{ margin: '1rem 0', fontSize: '1.1rem' }}>To avoid sync issues, Players can only change their volume.</p>
      </div>

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

      <GithubSourceCodeLink />
      <ToastContainer limit={5} />
    </div>
  );
}
