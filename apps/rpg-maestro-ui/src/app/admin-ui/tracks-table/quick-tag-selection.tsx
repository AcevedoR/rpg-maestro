import { SvgIconComponent } from '@mui/icons-material';
import React from 'react';

import Button from '@mui/material/Button';

type RGB = `rgb(${number}, ${number}, ${number})`;
type RGBA = `rgba(${number}, ${number}, ${number}, ${number})`;
type HEX = `#${string}`;

export type Color = RGB | RGBA | HEX;

export interface QuickTagSelectionProps {
  text: string;
  icon: SvgIconComponent;
  color: Color;
  tags: string[];
  onQuickTagSelection:(tags: string[]) => void
}

export function QuickTagSelection(props: QuickTagSelectionProps) {
  const { text, icon, tags, color, onQuickTagSelection} = props;
  const iconInstance = React.createElement(icon, { sx: { fontSize: 50 } });
  return (
    <Button style={{ display: 'flex', textDecoration: 'none', color: color, height: '60px', width: '110px',border: '1px solid', fontSize: '10px' }}
    onClick={() => onQuickTagSelection(tags)}
    >
      <div style={{ display: 'flex', alignItems: 'center'}}>
        {iconInstance}
        <p>{text}</p>
      </div>
    </Button>
  );
}
