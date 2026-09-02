import type { ReactNode } from 'react'
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  type DialogProps,
} from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'

interface AppDialogProps extends Omit<DialogProps, 'title'> {
  title: ReactNode
  onClose: () => void
  actions?: ReactNode
  children: ReactNode
}

export function AppDialog({ title, onClose, actions, children, ...rest }: AppDialogProps) {
  return (
    <Dialog onClose={onClose} fullWidth maxWidth="sm" {...rest}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ pl: 3, pr: 1.5, py: 1.5 }}>
        <DialogTitle sx={{ p: 0 }}>{title}</DialogTitle>
        <IconButton onClick={onClose} size="small" aria-label="Close dialog">
          <CloseIcon fontSize="small" />
        </IconButton>
      </Stack>
      <DialogContent dividers>{children}</DialogContent>
      {actions ? <DialogActions sx={{ px: 3, py: 2 }}>{actions}</DialogActions> : null}
    </Dialog>
  )
}
