import { useEffect, useState } from 'react';
import { CollectionTrack, TrackCollection } from '@rpg-maestro/rpg-maestro-api-contract';
import { withAuthenticationRequired } from '@auth0/auth0-react';
import KeyboardReturnIcon from '@mui/icons-material/KeyboardReturn';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import MusicNoteIcon from '@mui/icons-material/MusicNote';

import { getAllTrackCollections, importCollectionToSession } from '../maestro-api';
import { Loading } from '../../auth/Loading';
import { TextLinkWithIconWrapper } from '../../ui-components/text-link-with-icon-wrapper';
import { isDevModeEnabled } from '../../../FeaturesConfiguration';
import { formatTodayDate } from '../../utils/time';
import { useSearchParams } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function TrackPreviewList({ tracks }: { tracks: CollectionTrack[] }) {
  return (
    <div style={{ paddingTop: '0.5rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
      {tracks.map((track) => (
        <div
          key={track.id}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            padding: '0.3rem 0',
            borderBottom: '1px solid rgba(255,255,255,0.05)',
          }}
        >
          <MusicNoteIcon sx={{ fontSize: '1rem', opacity: 0.5 }} />
          <span style={{ flex: 1, fontSize: '0.9rem' }}>{track.name}</span>
          {track.tags.length > 0 && (
            <span style={{ fontSize: '0.75rem', opacity: 0.6 }}>{track.tags.join(', ')}</span>
          )}
          <span style={{ fontSize: '0.8rem', opacity: 0.6, whiteSpace: 'nowrap' }}>
            {formatDuration(track.duration)}
          </span>
        </div>
      ))}
    </div>
  );
}

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
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

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

  const toggleExpanded = (collectionId: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(collectionId)) {
        next.delete(collectionId);
      } else {
        next.add(collectionId);
      }
      return next;
    });
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
      {!isLoading && !errorMessage && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {[...trackCollections]
            .sort((a, b) => b.updated_at - a.updated_at)
            .map((collection) => {
              const isExpanded = expandedIds.has(collection.id);
              const trackCount = collection.tracks.length;
              return (
                <div
                  key={collection.id}
                  style={{
                    border: '1px solid rgba(255,255,255,0.15)',
                    borderRadius: '6px',
                    padding: '0.75rem 1rem',
                    background: 'rgba(255,255,255,0.03)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ flex: 1 }}>
                      <span style={{ fontWeight: 'bold', fontSize: '1.05rem' }}>{collection.name}</span>
                      {collection.description && (
                        <span style={{ marginLeft: '0.75rem', opacity: 0.7, fontSize: '0.9rem' }}>
                          {collection.description}
                        </span>
                      )}
                    </div>
                    <span style={{ opacity: 0.6, fontSize: '0.85rem', whiteSpace: 'nowrap' }}>
                      {trackCount} {trackCount === 1 ? 'track' : 'tracks'}
                    </span>
                    <span style={{ opacity: 0.5, fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                      {formatTodayDate(collection.updated_at)}
                    </span>
                    {sessionId && (
                      <button
                        onClick={() => handleImport(collection.id)}
                        disabled={importingIds.has(collection.id)}
                        style={{ whiteSpace: 'nowrap' }}
                      >
                        {importingIds.has(collection.id) ? 'Importing...' : 'Import to session'}
                      </button>
                    )}
                    {trackCount > 0 && (
                      <button
                        onClick={() => toggleExpanded(collection.id)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.25rem', color: 'inherit' }}
                        aria-label={isExpanded ? 'Collapse tracks' : 'Expand tracks'}
                      >
                        {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                      </button>
                    )}
                  </div>
                  {isExpanded && <TrackPreviewList tracks={collection.tracks} />}
                </div>
              );
            })}
        </div>
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
      } catch {
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
