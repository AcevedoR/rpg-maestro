import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import React from 'react';
import styles from './content-to-copy.module.css';
import { toastInfo } from '../toast-popup';

export interface ContentToCopyProps {
  content: string;
}

export function ContentToCopy(props: ContentToCopyProps) {
  const { content } = props;

  async function copyContentToClipboard(content: string) {
    return navigator.clipboard.writeText(content).then(() => toastInfo(`Content ${content} copied to clipboard`, 4000));
  }

  return (
    <button className={`${styles.copyLinkButton}`} onClick={() => copyContentToClipboard(content)}>
      {content}
      <ContentCopyIcon />
    </button>
  );
}
