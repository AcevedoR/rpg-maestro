import { TracksTable } from './tracks-table';
import React, { useEffect, useState } from 'react';
import { getAllTracks } from '../tracks-api';
import { Link } from 'react-router-dom';
import { Track } from '@rpg-maestro/rpg-maestro-api-contract';
import { setTrackToPlay } from './admin-api';
import { ToastContainer } from 'react-toastify';

export function AdminUi() {
  const [allTracks, setAllTracks] = useState<Track[]|undefined>(undefined);

  useEffect(() => {
    if(allTracks === undefined){
      getAllTracks().then(x => setAllTracks(x));
    }
  })

  const requestSetTrackToPlay = async (trackId: string)=> {
    await setTrackToPlay({ trackId });
  }
  
  return (
    <div>
      <div>
        <h1>Admin UI</h1>
        <p>As the Maestro, control what current track is playing for the session</p>
        <p>WIP under construction</p>
        <Link to="/">see what your players are seeing</Link>
      </div>
      <div>
        <TracksTable tracks={allTracks ?? []} onSetTrackToPlay={requestSetTrackToPlay}/>
      </div>
      <ToastContainer limit={5}/>
    </div>
  );
}
