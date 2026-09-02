import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Alert, Link as MuiLink, MenuItem, Stack, TextField } from '@mui/material'
import DownloadRoundedIcon from '@mui/icons-material/DownloadRounded'
import { PageHeader } from '@/components/common/PageHeader'
import { SectionCard } from '@/components/common/SectionCard'
import { AppButton } from '@/components/common/AppButton'
import { reportApi } from '@/api/reportApi'
import { useToast } from '@/hooks/useToast'
import { ROUTES } from '@/constants/routes'
import type { GeneratedReport, ReportFormat } from '@/types/report'

const FORMATS = [
  { value: 'csv', label: 'CSV' },
  { value: 'xlsx', label: 'Excel (XLSX)' },
  { value: 'json', label: 'JSON' },
]

export default function CandidateReportsPage() {
  const toast = useToast()
  const [format, setFormat] = useState<ReportFormat>('csv')
  const [report, setReport] = useState<GeneratedReport | null>(null)

  const { mutate, isPending } = useMutation({
    mutationFn: () => reportApi.candidates(format),
    onSuccess: (res) => {
      setReport(res)
      toast.success('Report generated.')
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Could not generate the report.'),
  })

  return (
    <>
      <PageHeader
        title="Candidate Reports"
        breadcrumbs={[{ label: 'Reports', to: ROUTES.reportsDashboard }, { label: 'Candidate Reports' }]}
      />

      <SectionCard title="Generate Candidate Report">
        <Stack spacing={2.5} sx={{ maxWidth: 480 }}>
          <TextField
            select
            label="Format"
            value={format}
            onChange={(e) => setFormat(e.target.value as ReportFormat)}
          >
            {FORMATS.map((f) => (
              <MenuItem key={f.value} value={f.value}>
                {f.label}
              </MenuItem>
            ))}
          </TextField>

          <AppButton
            variant="contained"
            loading={isPending}
            onClick={() => mutate()}
            sx={{ alignSelf: 'flex-start' }}
          >
            Generate Report
          </AppButton>

          {report ? (
            <Alert
              severity="success"
              icon={<DownloadRoundedIcon />}
              action={
                <MuiLink href={report.downloadUrl} target="_blank" rel="noopener noreferrer" fontWeight={600}>
                  Download
                </MuiLink>
              }
            >
              Report {report.reportId} is ready.
            </Alert>
          ) : null}
        </Stack>
      </SectionCard>
    </>
  )
}
