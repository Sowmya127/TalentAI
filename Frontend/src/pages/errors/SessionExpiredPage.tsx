import { Link as RouterLink } from 'react-router-dom'
import LockClockRoundedIcon from '@mui/icons-material/LockClockRounded'
import { AppButton } from '@/components/common/AppButton'
import { ROUTES } from '@/constants/routes'
import { StatusPage } from './StatusPage'

export default function SessionExpiredPage() {
  return (
    <StatusPage
      icon={<LockClockRoundedIcon fontSize="large" />}
      title="Your session has expired"
      description="For your security, please sign in again to continue."
      action={
        <AppButton component={RouterLink} to={ROUTES.login} variant="contained">
          Sign in again
        </AppButton>
      }
    />
  )
}
