import { Link as RouterLink, useLocation } from 'react-router-dom'
import {
  Box,
  Divider,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Stack,
  Typography,
} from '@mui/material'
import WorkspacesRoundedIcon from '@mui/icons-material/WorkspacesRounded'
import { useAuth } from '@/hooks/useAuth'
import { getNavForRoles } from '@/constants/navigation'
import { env } from '@/config/env'
import { BRAND } from '@/theme/palette'

export const SIDEBAR_WIDTH = 260

interface SidebarProps {
  mobileOpen: boolean
  onClose: () => void
}

function SidebarContent() {
  const { roleKeys } = useAuth()
  const location = useLocation()
  const items = getNavForRoles(roleKeys)

  return (
    <Stack sx={{ height: '100%', bgcolor: BRAND.charcoal, color: '#FFFFFF' }}>
      <Stack direction="row" alignItems="center" spacing={1.25} sx={{ px: 2.5, py: 2.5 }}>
        <WorkspacesRoundedIcon sx={{ color: '#FFFFFF' }} fontSize="medium" />
        <Typography variant="h6" fontWeight={700} color="#FFFFFF">
          {env.appName}
        </Typography>
      </Stack>
      <Divider sx={{ borderColor: 'rgba(255,255,255,0.12)' }} />
      <List sx={{ px: 1.5, py: 1.5, flex: 1, overflowY: 'auto' }}>
        {items.map((item) => {
          const Icon = item.icon
          const selected = location.pathname === item.path
          return (
            <ListItemButton
              key={item.path}
              component={RouterLink}
              to={item.path}
              selected={selected}
              sx={{
                mb: 0.5,
                color: 'rgba(255,255,255,0.82)',
                '& .MuiListItemIcon-root': { color: 'rgba(255,255,255,0.82)' },
                '&:hover': { backgroundColor: BRAND.sidebarHover },
                '&.Mui-selected': {
                  backgroundColor: BRAND.steel,
                  color: BRAND.charcoal,
                  fontWeight: 600,
                  '& .MuiListItemIcon-root': { color: BRAND.charcoal },
                  '&:hover': { backgroundColor: BRAND.steelDark },
                },
              }}
            >
              <ListItemIcon sx={{ minWidth: 36 }}>
                <Icon fontSize="small" />
              </ListItemIcon>
              <ListItemText
                primary={item.label}
                slotProps={{ primary: { variant: 'body2', fontWeight: selected ? 600 : 500 } }}
              />
            </ListItemButton>
          )
        })}
      </List>
    </Stack>
  )
}

export function Sidebar({ mobileOpen, onClose }: SidebarProps) {
  return (
    <Box component="nav" sx={{ width: { md: SIDEBAR_WIDTH }, flexShrink: { md: 0 } }}>
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={onClose}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': { boxSizing: 'border-box', width: SIDEBAR_WIDTH },
        }}
      >
        <SidebarContent />
      </Drawer>
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: 'none', md: 'block' },
          '& .MuiDrawer-paper': { boxSizing: 'border-box', width: SIDEBAR_WIDTH },
        }}
        open
      >
        <SidebarContent />
      </Drawer>
    </Box>
  )
}
