import AudioPlayer from 'react-h5-audio-player';
import H5AudioPlayer from 'react-h5-audio-player';
import { ToastContainer } from 'react-toastify';
import { useEffect, useRef, useState } from 'react';
import { resyncCurrentTrackIfNeeded } from '../track-sync/track-sync';
import { displayError } from '../error-utils';
import { PlayingTrack } from '@rpg-maestro/rpg-maestro-api-contract';
import GithubSourceCodeLink from '../ui-components/github-source-code-link/github-source-code-link';
import './audio-player-readonly.css';
import MusicNoteIcon from '@mui/icons-material/MusicNote';

export function ClientsUi() {
  const [currentTrack, setCurrentTrack] = useState<PlayingTrack | null>(null);
  const [intervalId, setIntervalId] = useState<NodeJS.Timeout | null>(null);
  const audioPlayer = useRef<H5AudioPlayer>();

  useEffect(() => {
    async function resyncCurrentTrackOnUi() {
      const newerServerTrack = await resyncCurrentTrackIfNeeded(
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
        <h1>RPG-Maestro player UI</h1>
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
            src={currentTrack?.url}
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
              pause: <MusicNoteIcon style={{cursor:'not-allowed'}}/>
            }}
          />
        </div>
        <GithubSourceCodeLink />
        <ToastContainer limit={5} />
      </div>
    </>
  );
}
