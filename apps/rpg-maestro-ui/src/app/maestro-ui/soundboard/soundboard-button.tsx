import { SvgIconComponent } from '@mui/icons-material';
import React from 'react';
import Button from '@mui/material/Button';
import { Color } from '../tracks-table/quick-tag-selection';

interface SoundboardButtonProps {
  text: string;
  icon: SvgIconComponent;
  color: Color;
  onPlay: () => void;
}

export function SoundboardButton({ text, icon, color, onPlay }: SoundboardButtonProps) {
  const iconInstance = React.createElement(icon, { sx: { fontSize: 50 } });

  return (
    <Button
      style={{
        display: 'flex',
        textDecoration: 'none',
        color: color,
        height: '60px',
        width: '110px',
        border: '1px solid',
        fontSize: '11px',
        fontWeight: '500',
        backgroundColor: 'rgba(57,57,57,0.15)',
      }}
      onClick={onPlay}
    >
      <div style={{ display: 'flex', alignItems: 'center' }}>
        {iconInstance}
        <p>{text}</p>
      </div>
    </Button>
  );
}
