import type { ElementType } from 'react'
import { Button, CircularProgress, type ButtonProps } from '@mui/material'

type AppButtonProps<C extends ElementType> = ButtonProps<C, { component?: C }> & {
  loading?: boolean
}

/** Standard button with a built-in pending state — disables itself and swaps in a spinner. */
export function AppButton<C extends ElementType = 'button'>({
  loading = false,
  disabled,
  children,
  startIcon,
  ...rest
}: AppButtonProps<C>) {
  return (
    <Button
      disabled={disabled || loading}
      startIcon={loading ? <CircularProgress size={16} color="inherit" /> : startIcon}
      {...rest}
    >
      {children}
    </Button>
  )
}
