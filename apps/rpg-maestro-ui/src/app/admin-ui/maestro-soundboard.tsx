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
import { QuickTagSelection } from './tracks-table/quick-tag-selection';
import ShieldIcon from '@mui/icons-material/Shield';
import HolidayVillageIcon from '@mui/icons-material/HolidayVillage';
import CastleIcon from '@mui/icons-material/Castle';
import ForestIcon from '@mui/icons-material/Forest';
import HikingIcon from '@mui/icons-material/Hiking';

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
  const onQuickTagSelection = (tags: Tag[]) => {
    onTrackSearchByTagChange(tags);
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
      <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center' }}>
        <div style={{ display: 'inline-flex', justifyContent: 'flex-start', width: '250px' }}>
          <h5 style={{ textOrientation: 'upright', writingMode: 'vertical-rl', margin: '0' }}>QUICK TAGS</h5>
          <div
            style={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', margin: '0' }}
          >
            <QuickTagSelection
              text={'combat'}
              icon={ShieldIcon}
              color={'#9a0404'}
              tags={['combat']}
              onQuickTagSelection={onQuickTagSelection}
            />
            <QuickTagSelection
              text={'town'}
              icon={HolidayVillageIcon}
              color={'#97723d'}
              tags={['settlement']}
              onQuickTagSelection={onQuickTagSelection}
            />
            <QuickTagSelection
              text={'forest'}
              icon={ForestIcon}
              color={'#0d5e01'}
              tags={['forest']}
              onQuickTagSelection={onQuickTagSelection}
            />
            <QuickTagSelection
              text={'travel'}
              icon={HikingIcon}
              color={'#0d5785'}
              tags={['travel']}
              onQuickTagSelection={onQuickTagSelection}
            />
            <QuickTagSelection
              text={'dungeon'}
              icon={CastleIcon}
              color={'#5c5c5c'}
              tags={['dungeon']}
              onQuickTagSelection={onQuickTagSelection}
            />
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <SearchTags tags={trackFilters.tagsToFilterOn ?? []} tracks={allTracks ?? []} onTrackSearchByTagChange={onTrackSearchByTagChange} />
          <div>or</div>
          <SearchSpecificTrack tracks={allTracks ?? []} onTrackSearchChange={onTrackSearchChange} />
        </div>
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
