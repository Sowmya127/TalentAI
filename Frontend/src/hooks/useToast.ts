import { useSnackbar, type VariantType } from 'notistack'
import { useCallback } from 'react'

export function useToast() {
  const { enqueueSnackbar, closeSnackbar } = useSnackbar()

  const show = useCallback(
    (message: string, variant: VariantType = 'default') => enqueueSnackbar(message, { variant }),
    [enqueueSnackbar],
  )

  return {
    success: useCallback((message: string) => show(message, 'success'), [show]),
    error: useCallback((message: string) => show(message, 'error'), [show]),
    warning: useCallback((message: string) => show(message, 'warning'), [show]),
    info: useCallback((message: string) => show(message, 'info'), [show]),
    dismiss: closeSnackbar,
  }
}
