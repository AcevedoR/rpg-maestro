import styles from './drawer.module.css';
import { CSSProperties, ReactElement } from 'react';
import { noop } from '../../utils/noop';

interface DrawerProps {
  open: boolean;
  children: ReactElement | ReactElement[];
  width?: number;
  style?: CSSProperties;
  className?: string;
  onClose?: () => unknown;
}

export const Drawer = (props: DrawerProps) => {
  const { open, children, style = {}, width = 300, className = '', onClose = noop } = props;

  const right = open ? 0 : -(width + 15);

  return (
    <>
      <div className={`${styles.container} ${className}`} style={{ ...style, width, right }}>
        <i className={`fas fa-xmark ${styles.closeIcon}`} onClick={onClose}></i>
        {children}
      </div>
      <div className={`${styles.overlay} ${!open ? [styles.hidden] : []}`} onClick={onClose}></div>
    </>
  );
};
