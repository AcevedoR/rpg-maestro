import { PlayingTrack, SessionPlayingTracks, TrackToPlay } from '@rpg-maestro/rpg-maestro-api-contract';
import AudioPlayer from 'react-h5-audio-player';
import H5AudioPlayer from 'react-h5-audio-player';
import React, { forwardRef, Ref, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { resyncCurrentTrackIfNeeded } from '../../track-sync/track-sync';
import { displayError } from '../../error-utils';
import './maestro-audio-player.css';

export interface MaestroAudioPlayerRef {
  dispatchTrackWasManuallyChanged: (newTracks: SessionPlayingTracks) => void;
  currentTrack: PlayingTrack | null;
}

export interface MaestroAudioPlayerProps {
  sessionId: string;
  onCurrentTrackEdit: (editedCurrentTrack: TrackToPlay) => Promise<SessionPlayingTracks>;
}

export const MaestroAudioPlayer = forwardRef((props: MaestroAudioPlayerProps, ref: Ref<MaestroAudioPlayerRef>) => {
  const { sessionId, onCurrentTrackEdit } = props;
  const [currentTrack, setCurrentTrack] = useState<PlayingTrack | null>(null);
  const [intervalId, setIntervalId] = useState<NodeJS.Timeout | null>(null);
  const isInResync = useRef(false);
  const audioPlayer = useRef<H5AudioPlayer>();

  const dispatchTrackWasManuallyChanged = (newTracks: SessionPlayingTracks) => {
    resyncCurrentTrackOnUi(newTracks.currentTrack);
  };
  useImperativeHandle(ref, () => ({
    dispatchTrackWasManuallyChanged,
    currentTrack: currentTrack
  }));

  if (audioPlayer.current?.progressBar.current) {
    audioPlayer.current.progressBar.current.onclick = (e) => {
      onTrackTimecodeChange();
    };
    audioPlayer.current.progressBar.current.ontouchend = (e) => {
      onTrackTimecodeChange();
    };
  }

  const resyncCurrentTrackOnUi = useCallback(async (trackFromServer: PlayingTrack | null, forceRun?: boolean) => {
    if (forceRun || !isInResync.current) {
      try {
        isInResync.current = true;
        if (trackFromServer) {
          console.info('synchronizing track');
          setCurrentTrack(trackFromServer);
          if (!trackFromServer) {
            throw new Error('Current track is not defined');
          }
          if (audioPlayer.current?.audio?.current) {
            audioPlayer.current.audio.current.src = trackFromServer.url;
            audioPlayer.current.audio.current.title = trackFromServer.name;
            const currentPlayTime = trackFromServer.getCurrentPlayTime();
            if (currentPlayTime) {
              audioPlayer.current.audio.current.currentTime = currentPlayTime / 1000;
            }
            if (trackFromServer.isPaused) {
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
        } else {
          isInResync.current = false;
        }
      } catch (err) {
        console.error('An unexpected error occurred:', err);
      } finally {
        isInResync.current = false;
      }
    }
  }, []);
  const syncCurrentTrackOnUi = useCallback(async () => {
    const newerServerTrack = await resyncCurrentTrackIfNeeded(
      sessionId,
      audioPlayer.current?.audio?.current?.currentTime ?? null,
      currentTrack
    );
    await resyncCurrentTrackOnUi(newerServerTrack);
  }, [currentTrack, sessionId, resyncCurrentTrackOnUi]);

  useEffect(() => {
    syncCurrentTrackOnUi();
    const id = setInterval(() => {
      syncCurrentTrackOnUi();
    }, 5000);
    setIntervalId(id);
    return () => clearInterval(id);
  }, [syncCurrentTrackOnUi, resyncCurrentTrackOnUi, sessionId, currentTrack]);

  const changePlayingStatus = async (playing: boolean): Promise<void> => {
    if (!isInResync.current) {
      isInResync.current = true;
      if (!currentTrack) {
        throw new Error('this cannot happen');
      }
      const newPausedStatus = !playing;
      if (currentTrack.isPaused !== newPausedStatus) {
        // trying to handle load edge cases
        console.info(`changePlayingStatus newPausedStatus: ${newPausedStatus}`);
        const stoppedTime = currentTrack.getCurrentPlayTime();
        currentTrack.trackStartTime = stoppedTime;
        currentTrack.isPaused = newPausedStatus;
        const newTrack = await onCurrentTrackEdit({
          trackId: currentTrack.id,
          startTime: stoppedTime,
          paused: newPausedStatus,
        });
        await resyncCurrentTrackOnUi(newTrack.currentTrack, true);
      }
    } else {
      console.warn('changePlayingStatus: unhandled concurrency case');
    }
  };

  const onTrackTimecodeChange = async () => {
    if (!isInResync.current) {
      isInResync.current = true;
      if (!audioPlayer.current?.audio.current || !currentTrack) {
        throw new Error('should never happen');
      }
      const newTimecode = audioPlayer.current.audio.current.currentTime * 1000;
      console.info('onTrackTimecodeChange', newTimecode);
      currentTrack.trackStartTime = newTimecode;
      const newTrack = await onCurrentTrackEdit({
        trackId: currentTrack.id,
        startTime: newTimecode,
        paused: currentTrack.isPaused,
      });
      await resyncCurrentTrackOnUi(newTrack.currentTrack, true);
    } else {
      console.warn('onTrackTimecodeChange: unhandled concurrency case');
    }
  };

  return (
    <AudioPlayer
      // @ts-expect-error: No overload matches this call
      ref={audioPlayer}
      loop={true}
      autoPlay={false}
      showJumpControls={false}
      showSkipControls={false}
      onPlay={() => changePlayingStatus(true)}
      onPause={() => changePlayingStatus(false)}
      className={'maestro-audio-player'}
      header={
        <div style={{ width: '100%' }}>
          <h3
            style={{
              fontSize: '1rem',
              lineHeight: '2em',
              maxHeight: '2em',
              textOverflow: 'ellipsis',
              overflow: 'hidden',
              wordBreak: 'break-all'
            }}
          >
            {currentTrack?.name ?? 'No tracks selected to play'}
          </h3>
        </div>
      }
      customIcons={{}}
    />
  );
});
