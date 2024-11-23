import { TrackFilters, TracksTable } from './tracks-table/tracks-table';
import React, { useEffect, useState } from 'react';
import { getAllTracks } from '../tracks-api';
import { Tag, Track } from '@rpg-maestro/rpg-maestro-api-contract';
import { setTrackToPlay } from './admin-api';
import { ToastContainer } from 'react-toastify';
import SearchSpecificTrack from './tracks-table/SearchSpecificTrack';
import { TextLinkWithIconWrapper } from '../ui-components/text-link-with-icon-wrapper';
import { LyricsTwoTone, Visibility } from '@mui/icons-material';
import SearchTags from './tracks-table/SearchTags';

export function MaestroSoundboard() {
  const [allTracks, setAllTracks] = useState<Track[] | undefined>(undefined);
  const [trackFilters, setTrackFilters] = useState<TrackFilters>({});

  useEffect(() => {
    if (allTracks === undefined) {
      refreshTracks();
    }
  });

  const refreshTracks = () => {
    getAllTracks().then((x) => setAllTracks(x));
  };

  const requestSetTrackToPlay = async (trackId: string) => {
    await setTrackToPlay({ trackId });
  };

  const onTrackSearchChange = (track: Track | null) => {
    setTrackFilters({
      ...trackFilters,
      trackIdToFilterOn: track?.id,
    });
  };
  const onTrackSearchByTagChange = (tags: Tag[] | null) => {
    setTrackFilters({
      ...trackFilters,
      tagsToFilterOn: tags ?? undefined,
    });
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ marginTop: 0 }}>Admin UI</h1>
          <p>As the Maestro, control what current track is playing for the session</p>
          <p>WIP under construction</p>
        </div>
        <TextLinkWithIconWrapper link="/" text={'see what your players are seeing'} materialUiIcon={Visibility} />
        <TextLinkWithIconWrapper link="/admin/manage" text={'Manage your tracks'} materialUiIcon={LyricsTwoTone} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <SearchTags tracks={allTracks ?? []} onTrackSearchByTagChange={onTrackSearchByTagChange} />
        <div style={{ marginLeft: 20, marginRight: 20 }}>or</div>
        <SearchSpecificTrack tracks={allTracks ?? []} onTrackSearchChange={onTrackSearchChange} />
      </div>
      <div>
        <TracksTable
          tracks={allTracks ?? []}
          onSetTrackToPlay={requestSetTrackToPlay}
          filters={trackFilters}
          onRefreshRequested={refreshTracks}
        />
      </div>
      <ToastContainer limit={5} />
    </div>
  );
}
