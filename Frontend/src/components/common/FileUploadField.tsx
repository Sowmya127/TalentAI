import { useId, useRef, useState, type DragEvent } from 'react'
import { Box, IconButton, Stack, Typography, alpha } from '@mui/material'
import UploadFileIcon from '@mui/icons-material/UploadFile'
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined'
import CloseIcon from '@mui/icons-material/Close'

interface FileUploadFieldProps {
  value: File | null
  onChange: (file: File | null) => void
  accept?: string
  maxSizeMB?: number
  label?: string
  helperText?: string
  error?: string
  disabled?: boolean
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function FileUploadField({
  value,
  onChange,
  accept = '.pdf,.doc,.docx',
  maxSizeMB = 10,
  label = 'Drag and drop a file, or click to browse',
  helperText,
  error,
  disabled = false,
}: FileUploadFieldProps) {
  const inputId = useId()
  const inputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [localError, setLocalError] = useState<string | undefined>()

  const validateAndSet = (file: File) => {
    if (maxSizeMB && file.size > maxSizeMB * 1024 * 1024) {
      setLocalError(`File exceeds the ${maxSizeMB}MB limit.`)
      return
    }
    setLocalError(undefined)
    onChange(file)
  }

  const handleDrop = (e: DragEvent<HTMLLabelElement>) => {
    e.preventDefault()
    setIsDragging(false)
    if (disabled) return
    const file = e.dataTransfer.files?.[0]
    if (file) validateAndSet(file)
  }

  const displayError = error ?? localError

  return (
    <Stack spacing={0.75}>
      {value ? (
        <Stack
          direction="row"
          alignItems="center"
          spacing={1.5}
          sx={{
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 2,
            px: 2,
            py: 1.25,
          }}
        >
          <DescriptionOutlinedIcon color="primary" />
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="body2" fontWeight={600} noWrap>
              {value.name}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {formatBytes(value.size)}
            </Typography>
          </Box>
          {!disabled ? (
            <IconButton size="small" onClick={() => onChange(null)} aria-label="Remove file">
              <CloseIcon fontSize="small" />
            </IconButton>
          ) : null}
        </Stack>
      ) : (
        <Box
          component="label"
          htmlFor={inputId}
          onDragOver={(e) => {
            e.preventDefault()
            if (!disabled) setIsDragging(true)
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          sx={(theme) => ({
            border: '1.5px dashed',
            borderColor: isDragging ? 'primary.main' : displayError ? 'error.main' : 'divider',
            borderRadius: 2,
            px: 2,
            py: 3,
            textAlign: 'center',
            cursor: disabled ? 'not-allowed' : 'pointer',
            opacity: disabled ? 0.6 : 1,
            bgcolor: isDragging ? alpha(theme.palette.primary.main, 0.04) : 'transparent',
            transition: 'background-color 120ms ease, border-color 120ms ease',
          })}
        >
          <input
            ref={inputRef}
            id={inputId}
            type="file"
            accept={accept}
            hidden
            disabled={disabled}
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) validateAndSet(file)
              e.target.value = ''
            }}
          />
          <Stack alignItems="center" spacing={1}>
            <UploadFileIcon color="action" />
            <Typography variant="body2" color="text.secondary">
              {label}
            </Typography>
            <Typography variant="caption" color="text.disabled">
              Accepted: {accept.replaceAll('.', ' ').trim()} · Max {maxSizeMB}MB
            </Typography>
          </Stack>
        </Box>
      )}
      {(helperText || displayError) && (
        <Typography variant="caption" color={displayError ? 'error.main' : 'text.secondary'}>
          {displayError ?? helperText}
        </Typography>
      )}
    </Stack>
  )
}
