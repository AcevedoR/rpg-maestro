import styled from 'styled-components';

import { Link, Route, Routes } from 'react-router-dom';
import AudioPlayer from 'react-h5-audio-player';
import 'react-h5-audio-player/lib/styles.css';
import { useEffect, useState } from 'react';
import { PlayingTrack } from './PlayingTrack';
import { Bounce, toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const StyledApp = styled.div`
  // Your style here
`;

function displayError(err: string) {
  toast.error(err, {
    position: 'top-right',
    autoClose: 10000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
    progress: undefined,
    theme: 'dark',
    transition: Bounce,
  });
}

export function App() {
  const [currentTrack, setCurrentTrack] = useState<PlayingTrack | null>(null);

  useEffect(() => {
    const getCurrentTrack = async () => {
      try {
        const response = await fetch(
          'http://localhost:3000/sessions/current/tracks'
        );
        if (response.ok) {
          setCurrentTrack(await response.json());
        } else {
          console.log(response.status, response.statusText);
          console.debug(response);
          throw new Error('fetch failed for error: ' + response);
        }
      } catch (error) {
        console.error(error);
        displayError(`Fetch current/tracks error: ${error}`);
      }
    };

    getCurrentTrack();
  });

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
                autoPlay
                src={currentTrack?.url}
                onPlay={(e) => console.log('onPlay')}
                // other props here
              />
              <Link to="/page-2">Click here for page 2.</Link>
              <ToastContainer />
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
