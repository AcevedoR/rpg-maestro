import styles from './drawer.module.css';
import { ReactElement } from 'react';
import { noop } from '../../utils/noop';
import { Box, SxProps, Theme } from '@mui/material';

interface DrawerProps {
  open: boolean;
  children: ReactElement | ReactElement[];
  width?: number;
  sx?: SxProps<Theme>;
  className?: string;
  onClose?: () => unknown;
}

export const Drawer = (props: DrawerProps) => {
  const { open, children, sx = {}, width = 300, className = '', onClose = noop } = props;

  const right = open ? 0 : -(width + 15);

  return (
    <>
      <Box className={`${styles.container} ${className}`} sx={{ ...sx, width, right }}>
        <i className={`fas fa-xmark ${styles.closeIcon}`} onClick={onClose}></i>
        {children}
      </Box>
      <div className={`${styles.overlay} ${!open ? [styles.hidden] : []}`} onClick={onClose}></div>
    </>
  );
};
