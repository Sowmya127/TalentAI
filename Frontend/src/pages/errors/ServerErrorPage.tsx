import ErrorOutlineRoundedIcon from '@mui/icons-material/ErrorOutlineRounded'
import { AppButton } from '@/components/common/AppButton'
import { StatusPage } from './StatusPage'

export default function ServerErrorPage() {
  return (
    <StatusPage
      code="500"
      icon={<ErrorOutlineRoundedIcon fontSize="large" />}
      title="Something went wrong"
      description="An unexpected error occurred on our end. Please try again in a moment."
      action={
        <AppButton onClick={() => window.location.reload()} variant="contained">
          Reload page
        </AppButton>
      }
    />
  )
}
