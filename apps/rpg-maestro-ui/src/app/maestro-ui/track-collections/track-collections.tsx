import { useEffect, useState } from 'react';
import { TrackCollection } from '@rpg-maestro/rpg-maestro-api-contract';
import { withAuthenticationRequired } from '@auth0/auth0-react';
import KeyboardReturnIcon from '@mui/icons-material/KeyboardReturn';

import { getAllTrackCollections, importCollectionToSession } from '../maestro-api';
import { Loading } from '../../auth/Loading';
import { TextLinkWithIconWrapper } from '../../ui-components/text-link-with-icon-wrapper';
import { isDevModeEnabled } from '../../../FeaturesConfiguration';
import { formatTodayDate } from '../../utils/time';
import { useSearchParams } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';

type TrackCollectionsContentProps = {
  trackCollections: TrackCollection[];
  isLoading: boolean;
  errorMessage: string | null;
  sessionId?: string;
  onImport?: (collectionId: string) => Promise<void>;
};

export function TrackCollectionsContent({
  trackCollections,
  isLoading,
  errorMessage,
  sessionId,
  onImport,
}: TrackCollectionsContentProps) {
  const [importingIds, setImportingIds] = useState<Set<string>>(new Set());

  const handleImport = async (collectionId: string) => {
    if (!onImport) return;
    setImportingIds((prev) => new Set(prev).add(collectionId));
    try {
      await onImport(collectionId);
      toast.success('Collection imported successfully');
    } catch {
      toast.error('Failed to import collection');
    } finally {
      setImportingIds((prev) => {
        const next = new Set(prev);
        next.delete(collectionId);
        return next;
      });
    }
  };

  const backLink = sessionId ? `/maestro/${sessionId}` : '/maestro/admin';
  const backText = sessionId ? 'Back to session' : 'Back to admin';

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
        <TextLinkWithIconWrapper link={backLink} text={backText} materialUiIcon={KeyboardReturnIcon} />
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
              {sessionId && <th style={{ textAlign: 'right', padding: '0.5rem' }}>Actions</th>}
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
                  {sessionId && (
                    <td style={{ padding: '0.5rem', textAlign: 'right' }}>
                      <button
                        onClick={() => handleImport(collection.id)}
                        disabled={importingIds.has(collection.id)}
                      >
                        {importingIds.has(collection.id) ? 'Importing...' : 'Import to session'}
                      </button>
                    </td>
                  )}
                </tr>
              ))}
          </tbody>
        </table>
      )}
      <ToastContainer limit={5} />
    </div>
  );
}

export function TrackCollectionsComponent() {
  const [trackCollections, setTrackCollections] = useState<TrackCollection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('sessionId') ?? undefined;

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

  const handleImport = async (collectionId: string) => {
    if (!sessionId) return;
    await importCollectionToSession(sessionId, collectionId);
  };

  return (
    <TrackCollectionsContent
      trackCollections={trackCollections}
      isLoading={isLoading}
      errorMessage={errorMessage}
      sessionId={sessionId}
      onImport={sessionId ? handleImport : undefined}
    />
  );
}

export const TrackCollections = isDevModeEnabled
  ? TrackCollectionsComponent
  : withAuthenticationRequired(TrackCollectionsComponent, {
      onRedirecting: () => <Loading />,
    });
