import { FileUpload } from './file-upload';
import React, { useCallback, useEffect, useState } from 'react';
import { TextLinkWithIconWrapper } from '../../ui-components/text-link-with-icon-wrapper';
import KeyboardReturnIcon from '@mui/icons-material/KeyboardReturn';
import { ArrowForward, CollectionsBookmarkTwoTone } from '@mui/icons-material';
import { CreateTrackForm } from './create-track-form';
import { ToastContainer } from 'react-toastify';
import { displayError } from '../../error-utils';
import { useParams } from 'react-router';
import { TrackCreationFromYoutubeTable } from './track-creation-from-youtube-table';
import { getTrackCreationFromYoutube } from '../maestro-api';
import { TrackCreationFromYoutubeDto, User } from '@rpg-maestro/rpg-maestro-api-contract';
import { withAuthenticationRequired } from '@auth0/auth0-react';
import { Loading } from '../../auth/Loading';
import { isDevModeEnabled } from '../../../FeaturesConfiguration';
import { getUser } from '../../cache/user.cache';

function TracksManagementComponent() {
  const [onFileUploadedEvent, setOnFileUploadedEvent] = useState<string | null>(null);
  const [trackCreationFromYoutube, setTrackCreationFromYoutube] = useState<TrackCreationFromYoutubeDto[]>([]);
  const [user, setUser] = useState<User | undefined>(undefined);
  const sessionId = useParams().sessionId ?? '';

  if (sessionId === '') {
    displayError('no session found in URL');
    throw new Error('no session found in URL');
  }
  const createFileUploadedEvent = (uploadedFileURL: string) => {
    setOnFileUploadedEvent(uploadedFileURL);
  };
  const consumeFileUploadedEvent = () => {
    const copy = onFileUploadedEvent;
    setOnFileUploadedEvent(null);
    return copy;
  };
  const onTrackCreated = () => {
    refreshTrackCreationFromYoutube();
  };
  const refreshTrackCreationFromYoutube = useCallback(async () => {
    try {
      setTrackCreationFromYoutube(await getTrackCreationFromYoutube(sessionId));
    } catch (e) {
      console.warn(e);
    }
  }, [sessionId]);

  useEffect(() => {
    refreshTrackCreationFromYoutube();
    const id = setInterval(() => {
      refreshTrackCreationFromYoutube();
    }, 5000);
    return () => clearInterval(id);
  }, [refreshTrackCreationFromYoutube]);

  useEffect(() => {
    getUser().then((fetchedUser) => {
      if (fetchedUser !== null) setUser(fetchedUser);
    });
  }, []);

  return (
    <div
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-around',
        gap: '1rem',
        padding: '1rem',
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center' }}>
        <TextLinkWithIconWrapper
          link={`/maestro/${sessionId}`}
          text={'Go back to Maestro ui'}
          materialUiIcon={KeyboardReturnIcon}
        />
        <h1 style={{ margin: 0, display: 'inline-block' }}>Tracks management</h1>
        {user && (user.role === 'MAESTRO' || user.role === 'ADMIN') ? (
          <TextLinkWithIconWrapper
            link={`/maestro/track-collections?sessionId=${sessionId}`}
            text={'Track collections'}
            materialUiIcon={CollectionsBookmarkTwoTone}
          />
        ) : (
          <div />
        )}
      </div>
      <hr style={{ width: '100vw', borderColor: 'var(--gold-color)' }} />
      <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center' }}>
        <div>
          <FileUpload onFileUploaded={createFileUploadedEvent} />
          <p>upload your track on the common file server</p>
        </div>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'space-around',
            width: '20%',
            padding: '0 30px',
          }}
        >
          <ArrowForward sx={{ fontSize: '50px' }}></ArrowForward>
          <p>Then create it on the default playlist</p>
          <p>Or directly reference a track from a remote and public URL</p>
        </div>
        <CreateTrackForm
          sessionId={sessionId}
          consumeFileUploadedEvent={consumeFileUploadedEvent}
          onSubmitted={onTrackCreated}
        />
      </div>
      <div>
        {trackCreationFromYoutube.length > 0 && (
          <TrackCreationFromYoutubeTable trackCreationsFromYoutube={trackCreationFromYoutube} />
        )}
      </div>
      <ToastContainer limit={5} />
    </div>
  );
}

export const TracksManagement = isDevModeEnabled ? TracksManagementComponent : withAuthenticationRequired(TracksManagementComponent, {
  onRedirecting: () => <Loading />,
});