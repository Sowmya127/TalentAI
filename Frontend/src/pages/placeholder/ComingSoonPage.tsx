import ConstructionRoundedIcon from '@mui/icons-material/ConstructionRounded'
import { PageHeader } from '@/components/common/PageHeader'
import { EmptyState } from '@/components/common/EmptyState'
import { SectionCard } from '@/components/common/SectionCard'
import type { BreadcrumbItem } from '@/components/common/AppBreadcrumbs'

interface ComingSoonPageProps {
  title: string
  description?: string
  breadcrumbs?: BreadcrumbItem[]
}

/**
 * Placeholder for screens whose route/nav entry exists but whose module
 * hasn't been built yet — keeps navigation and layout fully testable
 * while modules are generated one at a time.
 */
export function ComingSoonPage({ title, description, breadcrumbs }: ComingSoonPageProps) {
  return (
    <>
      <PageHeader title={title} description={description} breadcrumbs={breadcrumbs} />
      <SectionCard>
        <EmptyState
          icon={<ConstructionRoundedIcon fontSize="medium" />}
          title="This screen is being built"
          description="This module is scheduled in an upcoming build pass and isn't wired up yet."
        />
      </SectionCard>
    </>
  )
}
