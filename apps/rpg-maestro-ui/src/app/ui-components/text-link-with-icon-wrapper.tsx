import { Link } from 'react-router-dom';
import React from 'react';
import { SvgIconComponent } from '@mui/icons-material';

export interface TextLinkWithIconProps {
  link: string;
  text: string;
  materialUiIcon: SvgIconComponent;
}

export function TextLinkWithIconWrapper(props: TextLinkWithIconProps) {
  const { link, text, materialUiIcon } = props;
  const icon = React.createElement(materialUiIcon, { sx: { fontSize: 100 } });
  return (
    <Link
      style={{ fontSize: '14px', display: 'flex', textDecoration: 'none', color: '#5f1285', height: '100px', width: '170px'}}
      to={link}
    >
      <div style={{ display: 'flex', alignItems: 'center', border: '1px solid' }}>
        {icon}
        <p>{text}</p>
      </div>
    </Link>
  );
}
