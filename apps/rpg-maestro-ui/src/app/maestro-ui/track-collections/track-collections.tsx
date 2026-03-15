import { useEffect, useState } from 'react';
import { TrackCollection } from '@rpg-maestro/rpg-maestro-api-contract';
import { withAuthenticationRequired } from '@auth0/auth0-react';
import KeyboardReturnIcon from '@mui/icons-material/KeyboardReturn';

import { getAllTrackCollections } from '../maestro-api';
import { Loading } from '../../auth/Loading';
import { TextLinkWithIconWrapper } from '../../ui-components/text-link-with-icon-wrapper';
import { isDevModeEnabled } from '../../../FeaturesConfiguration';
import { formatTodayDate } from '../../utils/time';

type TrackCollectionsContentProps = {
  trackCollections: TrackCollection[];
  isLoading: boolean;
  errorMessage: string | null;
};

export function TrackCollectionsContent({ trackCollections, isLoading, errorMessage }: TrackCollectionsContentProps) {
  return (
    <div
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-start',
        gap: '1rem',
        padding: '1rem',
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <TextLinkWithIconWrapper link="/maestro/admin" text="Back to admin" materialUiIcon={KeyboardReturnIcon} />
        <h1 style={{ margin: 0 }}>Track collections</h1>
      </div>
      <hr style={{ width: '100vw', borderColor: 'var(--gold-color)' }} />
      {isLoading && <p>Loading track collections...</p>}
      {!isLoading && errorMessage && <p>{errorMessage}</p>}
      {!isLoading && !errorMessage && trackCollections.length === 0 && <p>No track collections found.</p>}
      {!isLoading && !errorMessage && trackCollections.length > 0 && (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left', padding: '0.5rem' }}>Name</th>
              <th style={{ textAlign: 'left', padding: '0.5rem' }}>Description</th>
              <th style={{ textAlign: 'left', padding: '0.5rem' }}>Updated</th>
              <th style={{ textAlign: 'right', padding: '0.5rem' }}>Tracks</th>
            </tr>
          </thead>
          <tbody>
            {[...trackCollections]
              .sort((a, b) => b.updated_at - a.updated_at)
              .map((collection) => (
                <tr key={collection.id}>
                  <td style={{ padding: '0.5rem' }}>{collection.name}</td>
                  <td style={{ padding: '0.5rem' }}>{collection.description ?? '-'}</td>
                  <td style={{ padding: '0.5rem' }}>{formatTodayDate(collection.updated_at)}</td>
                  <td style={{ padding: '0.5rem', textAlign: 'right' }}>{collection.tracks.length}</td>
                </tr>
              ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export function TrackCollectionsComponent() {
  const [trackCollections, setTrackCollections] = useState<TrackCollection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;
    const loadTrackCollections = async () => {
      setIsLoading(true);
      setErrorMessage(null);
      try {
        const collections = await getAllTrackCollections();
        if (isActive) {
          setTrackCollections(collections);
        }
      } catch (error) {
        if (isActive) {
          setErrorMessage('Unable to load track collections.');
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    };
    loadTrackCollections();
    return () => {
      isActive = false;
    };
  }, []);

  return (
    <TrackCollectionsContent trackCollections={trackCollections} isLoading={isLoading} errorMessage={errorMessage} />
  );
}

export const TrackCollections = isDevModeEnabled
  ? TrackCollectionsComponent
  : withAuthenticationRequired(TrackCollectionsComponent, {
      onRedirecting: () => <Loading />,
    });
