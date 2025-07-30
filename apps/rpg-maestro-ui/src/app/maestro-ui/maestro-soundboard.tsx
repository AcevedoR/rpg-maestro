import { filter, TrackFilters, TracksTable } from './tracks-table/tracks-table';
import React, { useEffect, useRef, useState } from 'react';
import { SessionPlayingTracks, Tag, Track, TrackToPlay, User } from '@rpg-maestro/rpg-maestro-api-contract';
import { getAllTracks, setTrackToPlay } from './maestro-api';
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
import { displayError } from '../error-utils';
import { useParams } from 'react-router';
import { ContentToCopy } from '../ui-components/content-to-copy/content-to-copy';
import { MaestroAudioPlayer, MaestroAudioPlayerRef } from './maestro-audio-player/maestro-audio-player';
import { getUser } from '../cache/user.cache';
import { toastError } from '../ui-components/toast-popup';
import BasicMenu from '../ui-components/menu';

export function MaestroSoundboard() {
  const [user, setUser] = useState<User | undefined>(undefined);
  const [allTracks, setAllTracks] = useState<Track[] | undefined>(undefined);
  const [trackFilters, setTrackFilters] = useState<TrackFilters>({});
  const sessionId = useParams().sessionId ?? '';
  if (sessionId === '') {
    displayError('no session found in URL (it should be https://{URL}/maestro/{sessionId})');
    // TODO redirect by generating a sessionId in backend, and redirect on /maestro/{sessionId}
    throw new Error('no session found in URL');
  }
  const maestroAudioPlayerChildRef = useRef<MaestroAudioPlayerRef>(null);
  const dispatchTrackWasManuallyChanged = (newTracks: SessionPlayingTracks): void => {
    maestroAudioPlayerChildRef?.current?.dispatchTrackWasManuallyChanged(newTracks);
  };
  const currentPlayingTrack = maestroAudioPlayerChildRef?.current?.currentTrack ?? null;

  useEffect(() => {
    if (allTracks === undefined) {
      refreshTracks();
    }
    if (user === undefined) {
      getUser().then((user) => {
        if (user === null) {
          toastError('unauthenticated', 5000);
        } else {
          setUser(user);
        }
      });
    }
  });

  const refreshTracks = () => {
    getAllTracks(sessionId).then((x) => setAllTracks(x));
  };

  const requestSetTrackToPlay = async (trackId: string, options?: { paused?: boolean }) => {
    const paused = options?.paused ?? false;
    const changedTracks = await setTrackToPlay(sessionId, { currentTrack: { trackId: trackId, paused: paused } });
    dispatchTrackWasManuallyChanged(changedTracks);
  };
  const requestEditTrackToPlay = async (trackToPlay: TrackToPlay): Promise<SessionPlayingTracks> => {
    return await setTrackToPlay(sessionId, { currentTrack: trackToPlay });
  };

  const onTrackSearchChange = (track: Track | null) => {
    setTrackFilters({
      ...trackFilters,
      trackIdToFilterOn: track?.id,
    });
  };
  const onQuickTagSelection = (tags: Tag[]) => {
    onTrackSearchByTagChange(tags);
  };
  const onTrackSearchByTagChange = (tags: Tag[] | null) => {
    setTrackFilters({
      ...trackFilters,
      tagsToFilterOn: tags ?? undefined,
    });
  };
  const onQuickTagChange = async (tags: Tag[]) => {
    setTrackFilters({
      ...trackFilters,
      tagsToFilterOn: tags ?? undefined,
    });
    await requestRandomTrackToPlay(tags);
  };
  const requestRandomTrackToPlay = async (tags: Tag[]) => {
    if (allTracks) {
      const filtered = filter(allTracks.filter(x => x.id !== currentPlayingTrack?.id), { tagsToFilterOn: tags });
      if (filtered.length > 0) {
        const randomIndex = Math.floor(Math.random() * filtered.length);
        const randomTrack = filtered[randomIndex];
        await requestSetTrackToPlay(randomTrack.id);
      }
    }
  };
  const getURLToShareToPlayers = () => {
    return `${window.location.origin}/${sessionId}`;
  };


  return (
    <div
      style={{
        height: '100vh',
        padding: '1rem',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-around',
        gap: '1rem',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ display: 'flex', gap: '2rem' }}>
            <h1 style={{ marginTop: 0 }}>Maestro UI</h1>
            <BasicMenu></BasicMenu>
          </div>
          <p>As the Maestro, control what current track is playing for the session: {sessionId}</p>
          <p>
            Share this link to your Players so then can join your session:
            <ContentToCopy content={getURLToShareToPlayers()} />
          </p>
        </div>
        <TextLinkWithIconWrapper
          link={`/${sessionId}`}
          text={'see what your players are seeing'}
          materialUiIcon={Visibility}
        />
        {user && (user.role === 'MAESTRO' || user.role === 'ADMIN') ? (
          <TextLinkWithIconWrapper
            link={`/maestro/manage/${sessionId}`}
            text={'Manage your tracks'}
            materialUiIcon={LyricsTwoTone}
          />
        ) : (
          <></>
        )}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center', gap: '1rem' }}>
        <div style={{ display: 'inline-flex', justifyContent: 'flex-start', width: '250px' }}>
          <h5
            style={{
              textOrientation: 'upright',
              writingMode: 'vertical-rl',
              margin: '0',
              color: 'var(--gold-color',
              textAlign: 'center',
            }}
          >
            QUICK TAGS
          </h5>
          <div
            style={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', margin: '0' }}
          >
            <QuickTagSelection
              text={'combat'}
              icon={ShieldIcon}
              color={'#9a0404'}
              tags={['combat']}
              onQuickTagSelection={onQuickTagSelection}
              onQuickTagDoubleClick={onQuickTagChange}
            />
            <QuickTagSelection
              text={'town'}
              icon={HolidayVillageIcon}
              color={'#97723d'}
              tags={['settlement']}
              onQuickTagSelection={onQuickTagSelection}
              onQuickTagDoubleClick={onQuickTagChange}
            />
            <QuickTagSelection
              text={'forest'}
              icon={ForestIcon}
              color={'#0d5e01'}
              tags={['forest']}
              onQuickTagSelection={onQuickTagSelection}
              onQuickTagDoubleClick={onQuickTagChange}
            />
            <QuickTagSelection
              text={'travel'}
              icon={HikingIcon}
              color={'#0d5785'}
              tags={['travel']}
              onQuickTagSelection={onQuickTagSelection}
              onQuickTagDoubleClick={onQuickTagChange}
            />
            <QuickTagSelection
              text={'dungeon'}
              icon={CastleIcon}
              color={'#5c5c5c'}
              tags={['dungeon']}
              onQuickTagSelection={onQuickTagSelection}
              onQuickTagDoubleClick={onQuickTagChange}
            />
          </div>
        </div>
        <div style={{ display: 'inline-flex', justifyContent: 'flex-start', minWidth: '330px' }}>
          <MaestroAudioPlayer
            sessionId={sessionId}
            onCurrentTrackEdit={requestEditTrackToPlay}
            ref={maestroAudioPlayerChildRef}
          />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <SearchTags
            tags={trackFilters.tagsToFilterOn ?? []}
            tracks={allTracks ?? []}
            onTrackSearchByTagChange={onTrackSearchByTagChange}
          />
          <div>or</div>
          <SearchSpecificTrack tracks={allTracks ?? []} onTrackSearchChange={onTrackSearchChange} />
        </div>
      </div>
      <div>
        <TracksTable
          sessionId={sessionId}
          tracks={allTracks ?? []}
          onSetTrackToPlay={requestSetTrackToPlay}
          filters={trackFilters}
          onRefreshRequested={refreshTracks}
          currentTrack={currentPlayingTrack}
        />
      </div>
      <ToastContainer limit={5} />
    </div>
  );
}
