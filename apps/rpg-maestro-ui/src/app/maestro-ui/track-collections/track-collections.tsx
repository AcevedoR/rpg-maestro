import { useEffect, useState } from 'react';
import { CollectionTrack, TrackCollection } from '@rpg-maestro/rpg-maestro-api-contract';
import { withAuthenticationRequired } from '@auth0/auth0-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import KeyboardReturnIcon from '@mui/icons-material/KeyboardReturn';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import MusicNoteIcon from '@mui/icons-material/MusicNote';
import AddIcon from '@mui/icons-material/Add';
import SettingsIcon from '@mui/icons-material/Settings';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';

import { getAllTrackCollections, importCollectionToSession } from '../maestro-api';
import { Loading } from '../../auth/Loading';
import { TextLinkWithIconWrapper } from '../../ui-components/text-link-with-icon-wrapper';
import { isDevModeEnabled } from '../../../FeaturesConfiguration';
import { durationInMsToString, formatTodayDate } from '../../utils/time';
import { toast, ToastContainer } from 'react-toastify';
import { cardStyle, pageStyle, TRACK_COLLECTIONS_ROUTE } from './track-collection-shared';

function TrackPreviewList({ tracks }: { tracks: CollectionTrack[] }) {
  return (
    <div style={{ marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
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
          {track.tags.length > 0 && <span style={{ fontSize: '0.75rem', opacity: 0.6 }}>{track.tags.join(', ')}</span>}
          <span style={{ fontSize: '0.8rem', opacity: 0.6, whiteSpace: 'nowrap' }}>
            {durationInMsToString(track.duration)}
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
  onManage?: (collectionId: string) => void;
  onCreateNew?: () => void;
};

export function TrackCollectionsContent({
  trackCollections,
  isLoading,
  errorMessage,
  sessionId,
  onImport,
  onManage,
  onCreateNew,
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
    <div style={pageStyle}>
      <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <TextLinkWithIconWrapper link={backLink} text={backText} materialUiIcon={KeyboardReturnIcon} />
        <h1 style={{ margin: 0 }}>Track collections</h1>
      </div>
      <hr style={{ width: '100%', borderColor: 'var(--gold-color)' }} />
      {!sessionId && (
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => onCreateNew?.()}>
            Create new collection
          </Button>
        </div>
      )}
      {isLoading && <p>Loading track collections...</p>}
      {!isLoading && errorMessage && <p>{errorMessage}</p>}
      {!isLoading && !errorMessage && trackCollections.length === 0 && <p>No track collections yet.</p>}
      {!isLoading && !errorMessage && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {[...trackCollections]
            .sort((a, b) => b.updated_at - a.updated_at)
            .map((collection) => {
              const isExpanded = expandedIds.has(collection.id);
              const trackCount = collection.tracks.length;
              return (
                <div key={collection.id} style={cardStyle}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
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
                    {sessionId ? (
                      <Button
                        variant="outlined"
                        onClick={() => handleImport(collection.id)}
                        disabled={importingIds.has(collection.id)}
                        sx={{ whiteSpace: 'nowrap' }}
                      >
                        {importingIds.has(collection.id) ? 'Importing...' : 'Import to session'}
                      </Button>
                    ) : (
                      <Button
                        variant="outlined"
                        startIcon={<SettingsIcon />}
                        onClick={() => onManage?.(collection.id)}
                        sx={{ whiteSpace: 'nowrap' }}
                      >
                        Manage
                      </Button>
                    )}
                    {trackCount > 0 && (
                      <IconButton
                        size="small"
                        onClick={() => toggleExpanded(collection.id)}
                        aria-label={isExpanded ? 'Collapse tracks' : 'Expand tracks'}
                      >
                        {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                      </IconButton>
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
  const navigate = useNavigate();
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
      onManage={(id) => navigate(`${TRACK_COLLECTIONS_ROUTE}/${id}`)}
      onCreateNew={() => navigate(`${TRACK_COLLECTIONS_ROUTE}/new`)}
    />
  );
}

export const TrackCollections = isDevModeEnabled
  ? TrackCollectionsComponent
  : withAuthenticationRequired(TrackCollectionsComponent, {
      onRedirecting: () => <Loading />,
    });
