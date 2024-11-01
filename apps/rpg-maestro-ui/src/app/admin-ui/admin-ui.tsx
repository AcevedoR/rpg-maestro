import { TracksTable } from './tracks-table';
import React, { useEffect, useState } from 'react';
import { Track } from '../Track';
import { getAllTracks } from '../tracks-api';
import { Link } from 'react-router-dom';

export function AdminUi() {
  const [allTracks, setAllTracks] = useState<Track[]|undefined>(undefined);

  useEffect(() => {
    if(allTracks === undefined){
      getAllTracks().then(x => setAllTracks(x));
    }
  })

  return (
    <div>
      <div>
        <h1>Admin UI</h1>
        <p>As the Maestro, control what current track is playing for the session</p>
        <p>WIP under construction</p>
        <Link to="/">see what your players are seeing</Link>
      </div>
      <div>
        <TracksTable tracks={allTracks ?? []}/>
      </div>
    </div>
  );
}
