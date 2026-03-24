import { SvgIconComponent } from '@mui/icons-material';
import React from 'react';
import Button from '@mui/material/Button';
import { Color } from '../tracks-table/quick-tag-selection';

const MOCK_SOUND_URL = 'https://cdn.freesound.org/previews/848/848968_17559721-lq.mp3';

interface SoundboardButtonProps {
  text: string;
  icon: SvgIconComponent;
  color: Color;
}

export function SoundboardButton({ text, icon, color }: SoundboardButtonProps) {
  const iconInstance = React.createElement(icon, { sx: { fontSize: 50 } });

  const handleClick = () => {
    new Audio(MOCK_SOUND_URL).play();
  };

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
      onClick={handleClick}
    >
      <div style={{ display: 'flex', alignItems: 'center' }}>
        {iconInstance}
        <p>{text}</p>
      </div>
    </Button>
  );
}
