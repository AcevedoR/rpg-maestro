import { FileUpload } from './file-upload';
import React, { useState } from 'react';
import { TextLinkWithIconWrapper } from '../../ui-components/text-link-with-icon-wrapper';
import KeyboardReturnIcon from '@mui/icons-material/KeyboardReturn';
import { CreateTrackForm } from './create-track-form';
import { ArrowForward } from '@mui/icons-material';
import { ToastContainer } from 'react-toastify';

export function TracksManagement() {
  const [onFileUploadedEvent, setOnFileUploadedEvent] = useState<string|null>(null);
  const createFileUploadedEvent = (uploadedFileURL: string) => {
    setOnFileUploadedEvent(uploadedFileURL);
  }
  const consumeFileUploadedEvent= () => {
    const copy = onFileUploadedEvent;
    setOnFileUploadedEvent(null);
    return copy;
  }

  return (
    <div>
      <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center' }}>
        <TextLinkWithIconWrapper link="/admin" text={'Go back to Admin ui'} materialUiIcon={KeyboardReturnIcon} />
        <h1 style={{ margin: 0, display: 'inline-block' }}>Tracks management</h1>
      </div>
      <hr />
      <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center' }}>
        <div>
          <FileUpload onFileUploaded={createFileUploadedEvent}/>
          <p>upload your track on the common file server</p>
        </div>
        <div style={{display: 'flex',flexDirection: 'column', alignItems: 'center', justifyContent: 'space-around', width: '20%', padding: '0 30px'}}>
          <ArrowForward sx={{fontSize: '50px'}}></ArrowForward>
          <p>Then create it on the default playlist</p>
          <p>Or directly reference a track from a remote and public URL</p>
        </div>
        <CreateTrackForm consumeFileUploadedEvent={consumeFileUploadedEvent} />
      </div>
      <ToastContainer limit={5} />
    </div>
  );
}
