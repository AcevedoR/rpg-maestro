import { FileUpload } from './FileUpload';
import React from 'react';
import { TextLinkWithIconWrapper } from '../../ui-components/text-link-with-icon-wrapper';
import KeyboardReturnIcon from '@mui/icons-material/KeyboardReturn';
import { CreateTrackForm } from './create-track-form';

export function TracksManagement() {
  return (
    <div>
      <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center' }}>
        <TextLinkWithIconWrapper link="/admin" text={'Go back to Admin ui'} materialUiIcon={KeyboardReturnIcon} />
        <h1 style={{ margin: 0, display: 'inline-block' }}>Tracks management</h1>
      </div>
      <hr />
      <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center' }}>
        <FileUpload />
        <CreateTrackForm />
      </div>
    </div>
  );
}
