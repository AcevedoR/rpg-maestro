import React from 'react';
import { Box, BoxProps } from '@mui/material';

export function StyledBox({ children, sx, ...props }: BoxProps) {
  return (
    <Box
      {...props}
      sx={{
        minWidth: 300,
        maxWidth: 500,
        width: '50vw',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.22)',
        background: 'rgba(26, 11, 46, 0.6)',
        border: '1px solid rgba(218, 165, 32, 0.3)',
        borderRadius: '24px',
        padding: '24px',
        display: 'flex',
        alignContent: 'center',
        justifyContent: 'center',
        margin: 0,
        ...sx,
      }}
    >
      {children}
    </Box>
  );
}
