import React from 'react';
import { SvgIconComponent } from '@mui/icons-material';
import Button from '@mui/material/Button';
import { noop } from '../utils/noop';

export interface TextLinkWithIconProps {
  link: string;
  text: string;
  materialUiIcon: SvgIconComponent;
}

export function TextLinkWithIconWrapper(props: TextLinkWithIconProps) {
  const { link, text, materialUiIcon } = props;
  const icon = React.createElement(materialUiIcon, { sx: { fontSize: '60px' } });
  return (
    <Button
      href={link}
      style={{
        display: 'flex',
        textDecoration: 'none',
        color: 'var(--gold-color)',
        height: '100px',
        width: '170px',
        border: '1px solid',
        fontSize: '0.2em',
      }}
      onClick={() => noop()}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
        {icon}
        <p>{text}</p>
      </div>
    </Button>
  );
}
