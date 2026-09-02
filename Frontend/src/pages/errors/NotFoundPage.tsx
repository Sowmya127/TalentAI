import { Link as RouterLink } from 'react-router-dom'
import SearchOffRoundedIcon from '@mui/icons-material/SearchOffRounded'
import { AppButton } from '@/components/common/AppButton'
import { ROUTES } from '@/constants/routes'
import { StatusPage } from './StatusPage'

export default function NotFoundPage() {
  return (
    <StatusPage
      code="404"
      icon={<SearchOffRoundedIcon fontSize="large" />}
      title="Page not found"
      description="The page you're looking for doesn't exist or may have been moved."
      action={
        <AppButton component={RouterLink} to={ROUTES.home} variant="contained">
          Back to home
        </AppButton>
      }
    />
  )
}
