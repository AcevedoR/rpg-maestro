import { PlayingTrack, TrackToPlay } from '@rpg-maestro/rpg-maestro-api-contract';
import AudioPlayer from 'react-h5-audio-player';
import H5AudioPlayer from 'react-h5-audio-player';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { resyncCurrentTrackIfNeeded } from '../../track-sync/track-sync';
import { displayError } from '../../error-utils';
import './maestro-audio-player.css';

export interface MaestroAudioPlayerProps {
  sessionId: string;
  onCurrentTrackEdit: (editedCurrentTrack: TrackToPlay) => void;
}

export function MaestroAudioPlayer(props: MaestroAudioPlayerProps) {
  const { sessionId, onCurrentTrackEdit } = props;
  const [currentTrack, setCurrentTrack] = useState<PlayingTrack | null>(null);
  const [intervalId, setIntervalId] = useState<NodeJS.Timeout | null>(null);
  const isInResync = useRef(false);
  const audioPlayer = useRef<H5AudioPlayer>();

  const resyncCurrentTrackOnUi = useCallback(async () => {
    if (!isInResync.current) {
      try {
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
      } catch (err) {
        console.error('An unexpected error occurred:', err);
      } finally {
        isInResync.current = false;
      }
    }
  }, [currentTrack, sessionId]);

  useEffect(() => {
    resyncCurrentTrackOnUi();
    const id = setInterval(() => {
      resyncCurrentTrackOnUi();
    }, 1000);
    setIntervalId(id);
    return () => clearInterval(id);
  }, [resyncCurrentTrackOnUi, sessionId, currentTrack]);

  const changePlayingStatus = (playing: boolean): void => {
    resyncCurrentTrackOnUi().then(() => {
      isInResync.current = true;
      if (!currentTrack) {
        throw new Error('this cannot happen');
      }
      const newPausedStatus = !playing;
      if (currentTrack.isPaused !== newPausedStatus) {
        // trying to handle load edge cases
        console.log(`changePlayingStatus newPausedStatus: ${newPausedStatus}`);
        const stoppedTime = currentTrack.getCurrentPlayTime();
        if (!stoppedTime) {
          throw new Error('unhandled case yet');
        }
        onCurrentTrackEdit({
          trackId: currentTrack.id,
          startTime: stoppedTime,
          paused: newPausedStatus,
        });
      }
      isInResync.current = false;
      resyncCurrentTrackOnUi();
    });
  };

  return (
    <AudioPlayer
      // @ts-expect-error: No overload matches this call
      ref={audioPlayer}
      loop={true}
      autoPlay={false}
      showJumpControls={false}
      showSkipControls={false}
      customAdditionalControls={undefined}
      onPlay={() => changePlayingStatus(true)}
      onPause={() => changePlayingStatus(false)}
      style={{
        width: '50vw',
        minWidth: '300px',
        overflowWrap: 'break-word'
      }}
      header={<h3 style={{ textAlign: 'center' }}>{currentTrack?.name}</h3>}
      customIcons={{}}
    />
  );
}
