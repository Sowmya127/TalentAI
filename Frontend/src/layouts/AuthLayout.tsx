import { Outlet } from 'react-router-dom'
import { Box, Paper, Stack, Typography } from '@mui/material'
import WorkspacesRoundedIcon from '@mui/icons-material/WorkspacesRounded'
import AutoAwesomeRoundedIcon from '@mui/icons-material/AutoAwesomeRounded'
import InsightsRoundedIcon from '@mui/icons-material/InsightsRounded'
import GroupsRoundedIcon from '@mui/icons-material/GroupsRounded'
import { env } from '@/config/env'
import { BRAND } from '@/theme/palette'

const HIGHLIGHTS = [
  { icon: AutoAwesomeRoundedIcon, text: 'AI-assisted resume screening & matching' },
  { icon: InsightsRoundedIcon, text: 'Real-time pipeline and hiring analytics' },
  { icon: GroupsRoundedIcon, text: 'One workspace for the whole hiring team' },
]

export function AuthLayout() {
  return (
    <Box sx={{ minHeight: '100vh', width: '100%', display: 'flex' }}>
      {/* Left branded panel — hidden on small screens */}
      <Box
        sx={{
          display: { xs: 'none', md: 'flex' },
          flexDirection: 'column',
          justifyContent: 'space-between',
          width: '46%',
          p: 6,
          color: '#FFFFFF',
          background: `linear-gradient(150deg, ${BRAND.charcoal} 0%, #4C4744 55%, ${BRAND.steel} 140%)`,
        }}
      >
        <Stack direction="row" alignItems="center" spacing={1.25}>
          <WorkspacesRoundedIcon fontSize="large" />
          <Typography variant="h5" fontWeight={700}>
            {env.appName}
          </Typography>
        </Stack>

        <Box>
          <Typography variant="overline" sx={{ color: BRAND.taupe, letterSpacing: 2 }}>
            AI RECRUITMENT
          </Typography>
          <Typography variant="h3" fontWeight={700} sx={{ mt: 1, mb: 3, color: '#FFFFFF', maxWidth: 420 }}>
            Hire better, faster.
          </Typography>
          <Stack spacing={2}>
            {HIGHLIGHTS.map(({ icon: Icon, text }) => (
              <Stack key={text} direction="row" alignItems="center" spacing={1.5}>
                <Box
                  sx={{
                    width: 36,
                    height: 36,
                    borderRadius: 2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: 'rgba(255,255,255,0.12)',
                  }}
                >
                  <Icon fontSize="small" />
                </Box>
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.9)' }}>
                  {text}
                </Typography>
              </Stack>
            ))}
          </Stack>
        </Box>

        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)' }}>
          © {new Date().getFullYear()} {env.appName}. All rights reserved.
        </Typography>
      </Box>

      {/* Right form panel */}
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: 'background.default',
          px: 2,
          py: 4,
        }}
      >
        <Stack spacing={3} alignItems="center" sx={{ width: '100%', maxWidth: 420 }}>
          <Stack direction="row" alignItems="center" spacing={1.25} sx={{ display: { md: 'none' } }}>
            <WorkspacesRoundedIcon color="primary" fontSize="large" />
            <Typography variant="h5" fontWeight={700}>
              {env.appName}
            </Typography>
          </Stack>
          <Paper sx={{ width: '100%', p: { xs: 3, sm: 4 }, borderRadius: 3 }}>
            <Outlet />
          </Paper>
        </Stack>
      </Box>
    </Box>
  )
}
