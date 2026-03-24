import { createTheme } from '@mui/material/styles';

export const theme = createTheme({
  palette: {
    mode: 'dark',
    secondary: { main: '#97723d' },
  },
  components: {
    MuiDataGrid: {
      styleOverrides: {
        root: {
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.22)',
          background: 'rgba(26, 11, 46, 0.2)',
          border: '1px solid rgba(218, 165, 32, 0.3)',
          color: 'var(--text-primary)',
          '& .MuiDataGrid-columnHeaders [role="row"]': {
            background: 'rgba(26, 11, 46, 0.5) !important',
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          background: 'rgba(26, 11, 46, 0.5) !important',
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        notchedOutline: {
          borderColor: 'var(--gold-color)',
        },
      },
    },
  },
});
