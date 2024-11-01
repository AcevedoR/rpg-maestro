import AudioPlayer from 'react-h5-audio-player';
import { ToastContainer } from 'react-toastify';
import { useEffect, useRef, useState } from 'react';
import { PlayingTrack } from '../PlayingTrack';
import H5AudioPlayer from 'react-h5-audio-player';
import { resyncCurrentTrackIfNeeded } from '../track-sync/track-sync';
import { displayError } from '../error-utils';

export function ClientsUi(){
  const [currentTrack, setCurrentTrack] = useState<PlayingTrack | null>(null);
  const [intervalId, setIntervalId] = useState<NodeJS.Timeout | null>(null);
  const audioPlayer = useRef<H5AudioPlayer>();

  useEffect(() => {
    async function resyncCurrentTrackOnUi() {
      const newerServerTrack = await resyncCurrentTrackIfNeeded(audioPlayer.current?.audio?.current?.currentTime ?? null, currentTrack);
      if(newerServerTrack){
        console.log("synchronizing track")
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
            try{
              await audioPlayer.current.audio.current.play();
            }catch (error){
              if (error instanceof DOMException && error.name === "NotAllowedError") {
                console.error(`Play failed: User interaction with the document is required first. Original error: ${error}`);
                displayError('This is your first time using the app, please accept autoplay by hitting play :)');
              } else {
                console.error("An unexpected error occurred:", error);
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

  return <>
    <div>
      <h1>RPG-Maestro player UI</h1>
      <AudioPlayer
        src={currentTrack?.url}
        ref={audioPlayer}
        loop={true}

      />
      <ToastContainer limit={5}
      />
    </div>
  </>
}