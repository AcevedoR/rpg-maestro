import React from 'react';
import { SvgIconComponent } from '@mui/icons-material';
import Button from '@mui/material/Button';
import { noop } from '../utils/noop';

export interface TextLinkWithIconProps {
  link: string;
  text: string;
  materialUiIcon: SvgIconComponent;
  theme?: 'error';
}

export function TextLinkWithIconWrapper(props: TextLinkWithIconProps) {
  const { link, text, materialUiIcon, theme } = props;
  const icon = React.createElement(materialUiIcon, { sx: { fontSize: '60px' } });
  return (
    <Button
      href={link}
      style={{
        display: 'flex',
        textDecoration: 'none',
        color: theme ? '#9f2d2d': 'var(--gold-color)',
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
