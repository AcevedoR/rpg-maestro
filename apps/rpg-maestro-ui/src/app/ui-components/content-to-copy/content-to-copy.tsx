import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import React from 'react';
import { Bounce, toast } from 'react-toastify';
import styles from './content-to-copy.module.css';

export interface ContentToCopyProps {
  content: string;
}

export function ContentToCopy(props: ContentToCopyProps) {
  const { content } = props;

  async function copyContentToClipboard(content: string) {
    return navigator.clipboard.writeText(content).then(() =>
      toast.info(`Content ${content} copied to clipboard`, {
        position: 'bottom-left',
        autoClose: 4000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: 'dark',
        transition: Bounce,
      })
    );
  }

  return (
    <button className={`${styles.copyLinkButton}`} onClick={() => copyContentToClipboard(content)}>
      {content}
      <ContentCopyIcon />
    </button>
  );
}
