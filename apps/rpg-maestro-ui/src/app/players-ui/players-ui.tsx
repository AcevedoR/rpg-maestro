import AudioPlayer from 'react-h5-audio-player';
import H5AudioPlayer from 'react-h5-audio-player';
import { ToastContainer } from 'react-toastify';
import React, { useEffect, useRef, useState } from 'react';
import { resyncCurrentTrackIfNeeded } from '../track-sync/track-sync';
import { displayError } from '../error-utils';
import { PlayingTrack } from '@rpg-maestro/rpg-maestro-api-contract';
import GithubSourceCodeLink from '../ui-components/github-source-code-link/github-source-code-link';
import './audio-player-readonly.css';
import MusicNoteIcon from '@mui/icons-material/MusicNote';
import { TextLinkWithIconWrapper } from '../ui-components/text-link-with-icon-wrapper';
import SpatialAudioOffIcon from '@mui/icons-material/SpatialAudioOff';
import { useParams } from 'react-router';

export function PlayersUi() {
  const [currentTrack, setCurrentTrack] = useState<PlayingTrack | null>(null);
  const [intervalId, setIntervalId] = useState<NodeJS.Timeout | null>(null);
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
      if (newerServerTrack) {
        console.log('synchronizing track');
        setCurrentTrack(newerServerTrack);
        if (!newerServerTrack) {
          throw new Error('Current track is not defined');
        }
        if (audioPlayer.current?.audio?.current) {
          audioPlayer.current.audio.current.src = newerServerTrack.url;
          audioPlayer.current.audio.current.title = newerServerTrack.name;
          const currentPlayTime = newerServerTrack.getCurrentPlayTime();
          if (currentPlayTime) {
            audioPlayer.current.audio.current.currentTime = currentPlayTime / 1000;
          }
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
    }, 1000);
    setIntervalId(id);
    return () => clearInterval(id);
  }, [currentTrack]);

  return (
    <>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          rowGap: '10vh',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'center', alignContent: 'center', width: '100%' }}>
          <div style={{ width: '30%', minWidth: '0' }}></div>
          <h1 style={{ textAlign: 'center' }}>RPG-Maestro player UI</h1>
          <div style={{ width: '30%', minWidth: '170px' }}>
            <div style={{ justifySelf: 'end' }}>
              <TextLinkWithIconWrapper
                link={`/maestro/${sessionId}`}
                text={'Maestro interface is available here'}
                materialUiIcon={SpatialAudioOffIcon}
              />
            </div>
          </div>
        </div>

        <div style={{ textAlign: 'center' }}>
          <p>
            Welcome! This app is primarily meant for TTRPG games: a Maestro manages the current track being played, the
            track is synced between all Players on this page.
          </p>
          <p>To avoid sync issues, Players can only change their volume.</p>
        </div>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-around',
            alignItems: 'center',
            height: '20vh',
          }}
        >
          <AudioPlayer
            // @ts-expect-error: No overload matches this call
            ref={audioPlayer}
            loop={true}
            showJumpControls={false}
            showSkipControls={false}
            customAdditionalControls={undefined}
            style={{
              width: '50vw',
              minWidth: '300px',
            }}
            header={<h3 style={{ textAlign: 'center' }}>{currentTrack?.name}</h3>}
            customIcons={{
              pause: <MusicNoteIcon style={{ cursor: 'not-allowed' }} />,
            }}
          />
        </div>
        <GithubSourceCodeLink />
        <ToastContainer limit={5} />
      </div>
    </>
  );
}
