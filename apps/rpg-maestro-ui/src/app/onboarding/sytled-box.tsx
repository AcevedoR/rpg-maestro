import styled from 'styled-components';
import { Box } from '@mui/material';

export const StyledBox = styled(Box)`
  min-width: 300px;
  max-width: 500px;
  width: 50vw;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.22);
  transition: all 0.3s ease;
  background: rgba(26, 11, 46, 0.6);
  border: 1px solid rgba(218, 165, 32, 0.3);
  border-radius: 24px;
  padding: 24px;
  display: flex;
  align-content: center;
  justify-content: center;
  margin: 0;
`;
