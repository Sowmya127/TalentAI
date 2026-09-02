import { Link as RouterLink } from 'react-router-dom'
import BlockRoundedIcon from '@mui/icons-material/BlockRounded'
import { AppButton } from '@/components/common/AppButton'
import { ROUTES } from '@/constants/routes'
import { StatusPage } from './StatusPage'

export default function UnauthorizedPage() {
  return (
    <StatusPage
      code="403"
      icon={<BlockRoundedIcon fontSize="large" />}
      title="Access denied"
      description="You don't have permission to view this page. Contact your administrator if you believe this is a mistake."
      action={
        <AppButton component={RouterLink} to={ROUTES.home} variant="contained">
          Back to home
        </AppButton>
      }
    />
  )
}
