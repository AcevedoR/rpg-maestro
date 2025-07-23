import { FileUpload } from './file-upload';
import React, { useCallback, useEffect, useState } from 'react';
import { TextLinkWithIconWrapper } from '../../ui-components/text-link-with-icon-wrapper';
import KeyboardReturnIcon from '@mui/icons-material/KeyboardReturn';
import { CreateTrackForm } from './create-track-form';
import { ArrowForward } from '@mui/icons-material';
import { ToastContainer } from 'react-toastify';
import { displayError } from '../../error-utils';
import { useParams } from 'react-router';
import { TrackCreationFromYoutubeTable } from './track-creation-from-youtube-table';
import { getTrackCreationFromYoutube } from '../maestro-api';
import { TrackCreationFromYoutubeDto } from '@rpg-maestro/rpg-maestro-api-contract';

export function TracksManagement() {
  const [onFileUploadedEvent, setOnFileUploadedEvent] = useState<string | null>(null);
  const [trackCreationFromYoutube, setTrackCreationFromYoutube] = useState<TrackCreationFromYoutubeDto[]>([]);
  const [intervalId, setIntervalId] = useState<NodeJS.Timeout | null>(null);
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
    try{
      setTrackCreationFromYoutube(await getTrackCreationFromYoutube(sessionId));
    } catch (e){
      console.warn(e);
      // TODO fix, we should check role is MAESTRO
    }
  }, [sessionId]);

  useEffect(() => {
    refreshTrackCreationFromYoutube();
    const id = setInterval(() => {
      refreshTrackCreationFromYoutube();
    }, 5000);
    setIntervalId(id);
    return () => clearInterval(id);
  }, [refreshTrackCreationFromYoutube]);

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-around', gap:'1rem', padding:'1rem' }}>
      <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center' }}>
        <TextLinkWithIconWrapper
          link={`/maestro/${sessionId}`}
          text={'Go back to Maestro ui'}
          materialUiIcon={KeyboardReturnIcon}
        />
        <h1 style={{ margin: 0, display: 'inline-block' }}>Tracks management</h1>
      </div>
      <hr style={{width: '100vw', borderColor: 'var(--gold-color)'}} />
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
