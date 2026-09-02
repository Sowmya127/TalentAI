import { useLocation, useNavigate } from 'react-router-dom'
import { Box, Stack, Typography } from '@mui/material'
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded'
import { SectionCard } from '@/components/common/SectionCard'
import { AppButton } from '@/components/common/AppButton'
import { ROUTES } from '@/constants/routes'

export default function JobApplicationConfirmationPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const jobTitle = (location.state as { jobTitle?: string } | null)?.jobTitle

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', pt: { xs: 4, sm: 8 } }}>
      <SectionCard>
        <Stack spacing={2.5} alignItems="center" textAlign="center" sx={{ maxWidth: 440, py: 2, px: 1 }}>
          <CheckCircleRoundedIcon color="success" sx={{ fontSize: 56 }} />
          <Stack spacing={0.5}>
            <Typography variant="h5" fontWeight={700}>
              Application submitted
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {jobTitle
                ? `Your application for "${jobTitle}" has been submitted successfully.`
                : 'Your application has been submitted successfully.'}{' '}
              You can track its progress from your applications list.
            </Typography>
          </Stack>
          <Stack direction="row" spacing={1.5}>
            <AppButton variant="contained" onClick={() => navigate(ROUTES.candidateApplications)}>
              View My Applications
            </AppButton>
            <AppButton variant="outlined" onClick={() => navigate(ROUTES.candidateJobSearch)}>
              Keep Browsing
            </AppButton>
          </Stack>
        </Stack>
      </SectionCard>
    </Box>
  )
}
