import { useState, type MouseEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  AppBar,
  Box,
  Divider,
  IconButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Toolbar,
  Tooltip,
  Typography,
} from '@mui/material'
import MenuIcon from '@mui/icons-material/Menu'
import NotificationsOutlinedIcon from '@mui/icons-material/NotificationsOutlined'
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined'
import LogoutOutlinedIcon from '@mui/icons-material/LogoutOutlined'
import PersonOutlineIcon from '@mui/icons-material/PersonOutline'
import { useAuth } from '@/hooks/useAuth'
import { AppAvatar } from '@/components/common/AppAvatar'
import { ROUTES } from '@/constants/routes'
import { roleLabel } from '@/constants/roles'
import { SIDEBAR_WIDTH } from './Sidebar'

export function Topbar({ onMenuClick }: { onMenuClick: () => void }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null)

  const openMenu = (e: MouseEvent<HTMLElement>) => setAnchorEl(e.currentTarget)
  const closeMenu = () => setAnchorEl(null)

  const emailName = user?.email.split('@')[0] ?? ''
  const [firstName, lastName] = emailName.includes('.') ? emailName.split('.') : [emailName, '']

  return (
    <AppBar
      position="fixed"
      color="inherit"
      sx={{
        bgcolor: 'background.paper',
        width: { md: `calc(100% - ${SIDEBAR_WIDTH}px)` },
        ml: { md: `${SIDEBAR_WIDTH}px` },
      }}
    >
      <Toolbar sx={{ gap: 1 }}>
        <IconButton
          edge="start"
          onClick={onMenuClick}
          sx={{ display: { xs: 'inline-flex', md: 'none' } }}
          aria-label="Open navigation menu"
        >
          <MenuIcon />
        </IconButton>
        <Box sx={{ flex: 1 }} />
        <Tooltip title="Notifications">
          <IconButton onClick={() => navigate(ROUTES.notifications)} aria-label="Notifications">
            <NotificationsOutlinedIcon />
          </IconButton>
        </Tooltip>
        <Tooltip title="Account">
          <IconButton onClick={openMenu} sx={{ ml: 0.5 }} aria-label="Account menu">
            <AppAvatar firstName={firstName} lastName={lastName} size={34} />
          </IconButton>
        </Tooltip>
        <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={closeMenu} sx={{ mt: 1 }}>
          <Box sx={{ px: 2, py: 1, minWidth: 220 }}>
            <Typography variant="subtitle2" noWrap>
              {user?.email}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {roleLabel(user?.role ?? '')}
            </Typography>
          </Box>
          <Divider />
          <MenuItem
            onClick={() => {
              closeMenu()
              navigate(ROUTES.settingsProfile)
            }}
          >
            <ListItemIcon>
              <PersonOutlineIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>My Profile</ListItemText>
          </MenuItem>
          <MenuItem
            onClick={() => {
              closeMenu()
              navigate(ROUTES.settingsPreferences)
            }}
          >
            <ListItemIcon>
              <SettingsOutlinedIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Settings</ListItemText>
          </MenuItem>
          <Divider />
          <MenuItem
            onClick={() => {
              closeMenu()
              logout()
            }}
          >
            <ListItemIcon>
              <LogoutOutlinedIcon fontSize="small" color="error" />
            </ListItemIcon>
            <ListItemText slotProps={{ primary: { color: 'error' } }}>Logout</ListItemText>
          </MenuItem>
        </Menu>
      </Toolbar>
    </AppBar>
  )
}
