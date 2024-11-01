import styled from 'styled-components';

import { Link, Route, Routes } from 'react-router-dom';
import AudioPlayer from 'react-h5-audio-player';
import 'react-h5-audio-player/lib/styles.css';
import { createRef, useEffect, useRef, useState } from 'react';
import { PlayingTrack } from './PlayingTrack';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { resyncCurrentTrackIfNeeded } from './track-sync/track-sync';
import H5AudioPlayer from 'react-h5-audio-player';
import { displayError } from './error-utils';

const StyledApp = styled.div`
  // Your style here
`;

export function App() {
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

  return (
    <StyledApp>
      {/* START: routes */}
      {/* These routes and navigation have been generated for you */}
      {/* Feel free to move and update them to fit your needs */}
      <br />
      <hr />
      <br />
      <div role="navigation">
        <ul>
          <li>
            <Link to="/">Home</Link>
          </li>
          <li>
            <Link to="/page-2">Page 2</Link>
          </li>
        </ul>
      </div>
      <Routes>
        <Route
          path="/"
          element={
            <div>
              <h1>RPG-Maestro player UI</h1>
              <AudioPlayer
                src={currentTrack?.url}
                ref={audioPlayer}
                loop={true}

              />
              <Link to="/page-2">Click here for page 2.</Link>
              <ToastContainer limit={5}
              />
            </div>
          }
        />
        <Route
          path="/page-2"
          element={
            <div>
              <Link to="/">Click here to go back to root page.</Link>
            </div>
          }
        />
      </Routes>
      {/* END: routes */}
    </StyledApp>
  );
}

export default App;
