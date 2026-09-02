import type { ReactNode } from 'react'
import { InputAdornment, Stack, TextField } from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'
import ClearIcon from '@mui/icons-material/Clear'
import { AppButton } from './AppButton'

interface SearchFilterBarProps {
  searchValue: string
  onSearchChange: (value: string) => void
  searchPlaceholder?: string
  filters?: ReactNode
  hasActiveFilters?: boolean
  onClearFilters?: () => void
}

export function SearchFilterBar({
  searchValue,
  onSearchChange,
  searchPlaceholder = 'Search…',
  filters,
  hasActiveFilters = false,
  onClearFilters,
}: SearchFilterBarProps) {
  return (
    <Stack
      direction={{ xs: 'column', sm: 'row' }}
      spacing={1.5}
      alignItems={{ xs: 'stretch', sm: 'center' }}
      sx={{ width: '100%' }}
    >
      <TextField
        value={searchValue}
        onChange={(e) => onSearchChange(e.target.value)}
        placeholder={searchPlaceholder}
        sx={{ minWidth: { sm: 260 } }}
        slotProps={{
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" color="action" />
              </InputAdornment>
            ),
          },
        }}
      />
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} flexWrap="wrap" useFlexGap>
        {filters}
      </Stack>
      {hasActiveFilters ? (
        <AppButton
          size="small"
          color="inherit"
          startIcon={<ClearIcon fontSize="small" />}
          onClick={onClearFilters}
        >
          Clear
        </AppButton>
      ) : null}
    </Stack>
  )
}
