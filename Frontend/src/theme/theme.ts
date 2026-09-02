import { alpha, createTheme } from '@mui/material/styles'
import { lightPalette } from './palette'
import { typography } from './typography'

export const theme = createTheme({
  palette: lightPalette,
  typography,
  shape: { borderRadius: 10 },
  spacing: 8,
  shadows: [
    'none',
    '0 1px 2px 0 rgb(17 24 39 / 0.05)',
    '0 1px 3px 0 rgb(17 24 39 / 0.07)',
    '0 2px 6px -1px rgb(17 24 39 / 0.08)',
    '0 4px 8px -2px rgb(17 24 39 / 0.08)',
    '0 6px 12px -3px rgb(17 24 39 / 0.09)',
    '0 8px 16px -4px rgb(17 24 39 / 0.09)',
    '0 10px 20px -5px rgb(17 24 39 / 0.1)',
    '0 12px 24px -6px rgb(17 24 39 / 0.1)',
    '0 14px 28px -7px rgb(17 24 39 / 0.1)',
    '0 16px 32px -8px rgb(17 24 39 / 0.1)',
    '0 18px 36px -9px rgb(17 24 39 / 0.1)',
    '0 20px 40px -10px rgb(17 24 39 / 0.1)',
    '0 20px 40px -10px rgb(17 24 39 / 0.1)',
    '0 20px 40px -10px rgb(17 24 39 / 0.1)',
    '0 20px 40px -10px rgb(17 24 39 / 0.1)',
    '0 20px 40px -10px rgb(17 24 39 / 0.1)',
    '0 20px 40px -10px rgb(17 24 39 / 0.1)',
    '0 20px 40px -10px rgb(17 24 39 / 0.1)',
    '0 20px 40px -10px rgb(17 24 39 / 0.1)',
    '0 20px 40px -10px rgb(17 24 39 / 0.1)',
    '0 20px 40px -10px rgb(17 24 39 / 0.1)',
    '0 20px 40px -10px rgb(17 24 39 / 0.1)',
    '0 20px 40px -10px rgb(17 24 39 / 0.1)',
    '0 20px 40px -10px rgb(17 24 39 / 0.1)',
  ],
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          scrollbarWidth: 'thin',
        },
        '*, *::before, *::after': {
          boxSizing: 'border-box',
        },
      },
    },
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: {
          borderRadius: 8,
          paddingInline: 16,
          paddingBlock: 8,
          transition: 'background-color 140ms ease, border-color 140ms ease, color 140ms ease',
        },
        sizeSmall: { paddingInline: 12, paddingBlock: 5 },
        outlinedPrimary: ({ theme }) => ({
          borderColor: theme.palette.primary.main,
          borderWidth: 1.5,
          '&:hover': { borderWidth: 1.5, backgroundColor: alpha(theme.palette.primary.main, 0.06) },
        }),
      },
    },
    MuiPaper: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: ({ theme }) => ({
          backgroundImage: 'none',
          border: `1px solid ${theme.palette.divider}`,
        }),
      },
    },
    MuiCard: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: ({ theme }) => ({
          border: `1px solid ${theme.palette.divider}`,
          borderRadius: 12,
          // Opt-in hover lift: add className="hoverable" to interactive cards.
          '&.hoverable': {
            transition: 'transform 160ms ease, box-shadow 160ms ease, border-color 160ms ease',
            cursor: 'pointer',
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow: theme.shadows[4],
              borderColor: theme.palette.primary.light,
            },
          },
        }),
      },
    },
    MuiTextField: {
      defaultProps: { size: 'small' },
    },
    MuiFormControl: {
      defaultProps: { size: 'small' },
    },
    MuiChip: {
      styleOverrides: {
        root: { fontWeight: 600 },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        head: ({ theme }) => ({
          fontWeight: 600,
          color: theme.palette.text.secondary,
          backgroundColor: '#F4F2F3',
          borderBottomColor: theme.palette.divider,
        }),
      },
    },
    MuiAppBar: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: ({ theme }) => ({
          borderBottom: `1px solid ${theme.palette.divider}`,
        }),
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: ({ theme }) => ({
          borderRight: `1px solid ${theme.palette.divider}`,
        }),
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: ({ theme }) => ({
          borderRadius: 8,
          '&.Mui-selected': {
            backgroundColor: alpha(theme.palette.primary.main, 0.1),
            color: theme.palette.primary.main,
            '& .MuiListItemIcon-root': { color: theme.palette.primary.main },
            '&:hover': { backgroundColor: alpha(theme.palette.primary.main, 0.14) },
          },
        }),
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: { fontSize: '0.75rem' },
      },
    },
  },
})
