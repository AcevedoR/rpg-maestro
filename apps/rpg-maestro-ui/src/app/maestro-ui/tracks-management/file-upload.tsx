import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import Button from '@mui/material/Button';
import React, { useState } from 'react';
import { styled } from '@mui/material/styles';
import axios, { AxiosRequestConfig } from 'axios';

const audioFileUploaderAPI = import.meta.env.VITE_AUDIO_FILE_UPLOADER_API_URL;

const VisuallyHiddenInput = styled('input')({
  clip: 'rect(0 0 0 0)',
  clipPath: 'inset(50%)',
  height: 1,
  overflow: 'hidden',
  position: 'absolute',
  bottom: 0,
  left: 0,
  whiteSpace: 'nowrap',
  width: 1,
});

export interface FileUploadProps {
  onFileUploaded: (uploadedFileURL: string) => void;
}

export function FileUpload(props: FileUploadProps) {
  const { onFileUploaded } = props;
  const [uploadProgress, setUploadProgress] = useState(0);

  const onFileUploadChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      event.preventDefault();
      if (event.target.files.length > 1) {
        throw new Error('Uploading multiple files in UI is not handled yet');
      }

      const formData = new FormData();
      formData.append('file', event.target.files[0]);

      const config: AxiosRequestConfig = {
        headers: {
          'content-type': 'multipart/form-data',
        },
        onUploadProgress: function (progressEvent) {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / (progressEvent.total ?? 0));
          setUploadProgress(percentCompleted);
        },
      };

      axios
        .post(`${audioFileUploaderAPI}/upload/audio`, formData, config)
        .then((response) => {
          console.info(response.data);
          const uploadRes = response.data as { fileURL: string };
          onFileUploaded(`${uploadRes.fileURL}`);
        })
        .catch((error) => {
          console.error('Error uploading file: ', error);
        });
    }
  };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <Button component="label" role={undefined} variant="contained" tabIndex={-1} startIcon={<CloudUploadIcon />}>
        Upload Track
        <VisuallyHiddenInput type="file" multiple onChange={onFileUploadChange} />
      </Button>
      <progress value={uploadProgress} max="100"></progress>
    </div>
  );
}
