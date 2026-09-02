import { Breadcrumbs, Link as MuiLink, Typography } from '@mui/material'
import { Link as RouterLink } from 'react-router-dom'
import NavigateNextIcon from '@mui/icons-material/NavigateNext'

export interface BreadcrumbItem {
  label: string
  to?: string
}

export function AppBreadcrumbs({ items }: { items: BreadcrumbItem[] }) {
  return (
    <Breadcrumbs separator={<NavigateNextIcon sx={{ fontSize: 16 }} />} aria-label="breadcrumb">
      {items.map((item, index) => {
        const isLast = index === items.length - 1
        if (isLast || !item.to) {
          return (
            <Typography key={item.label} variant="body2" color="text.primary" fontWeight={isLast ? 600 : 400}>
              {item.label}
            </Typography>
          )
        }
        return (
          <MuiLink
            key={item.label}
            component={RouterLink}
            to={item.to}
            underline="hover"
            color="text.secondary"
            variant="body2"
          >
            {item.label}
          </MuiLink>
        )
      })}
    </Breadcrumbs>
  )
}
