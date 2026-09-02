import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Link as MuiLink, Stack, Typography } from '@mui/material'
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined'
import AutoAwesomeRoundedIcon from '@mui/icons-material/AutoAwesomeRounded'
import { PageHeader } from '@/components/common/PageHeader'
import { SectionCard } from '@/components/common/SectionCard'
import { FileUploadField } from '@/components/common/FileUploadField'
import { AppButton } from '@/components/common/AppButton'
import { CandidateProfileGate } from '@/components/candidate/CandidateProfileGate'
import { candidateApi } from '@/api/candidateApi'
import { candidateProfileQueryKey } from '@/hooks/useCandidateProfile'
import { useToast } from '@/hooks/useToast'
import { ROUTES } from '@/constants/routes'
import type { CandidateProfile } from '@/types/candidate'

function ResumeUploadBody({ profile }: { profile: CandidateProfile }) {
  const navigate = useNavigate()
  const toast = useToast()
  const queryClient = useQueryClient()
  const [file, setFile] = useState<File | null>(null)

  const uploadMutation = useMutation({
    mutationFn: (selected: File) => candidateApi.uploadResume(profile.candidateId, selected),
    onSuccess: () => {
      toast.success('Resume uploaded successfully.')
      setFile(null)
      queryClient.invalidateQueries({ queryKey: candidateProfileQueryKey })
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Could not upload your resume.'),
  })

  const parseMutation = useMutation({
    mutationFn: () => candidateApi.parseResume(profile.candidateId),
    onSuccess: (result) => {
      navigate(ROUTES.candidateResumeParseResult, { state: result })
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Could not parse your resume.'),
  })

  return (
    <>
      <PageHeader
        title="Resume"
        breadcrumbs={[{ label: 'Dashboard', to: ROUTES.candidateDashboard }, { label: 'Resume' }]}
      />

      <Stack spacing={2.5}>
        {profile.resumeUrl ? (
          <SectionCard title="Current Resume">
            <Stack direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={1.5}>
              <Stack direction="row" alignItems="center" spacing={1.25}>
                <DescriptionOutlinedIcon color="primary" />
                <MuiLink href={profile.resumeUrl} target="_blank" rel="noopener noreferrer" fontWeight={600}>
                  View current resume
                </MuiLink>
              </Stack>
              <AppButton
                variant="outlined"
                startIcon={<AutoAwesomeRoundedIcon />}
                loading={parseMutation.isPending}
                onClick={() => parseMutation.mutate()}
              >
                Parse with AI
              </AppButton>
            </Stack>
          </SectionCard>
        ) : null}

        <SectionCard title={profile.resumeUrl ? 'Replace Resume' : 'Upload Resume'}>
          <Stack spacing={2.5} sx={{ maxWidth: 480 }}>
            <FileUploadField value={file} onChange={setFile} accept=".pdf,.doc,.docx" maxSizeMB={10} />
            <Typography variant="caption" color="text.secondary">
              Supported formats: PDF, DOC, DOCX.
            </Typography>
            <AppButton
              variant="contained"
              disabled={!file}
              loading={uploadMutation.isPending}
              onClick={() => file && uploadMutation.mutate(file)}
              sx={{ alignSelf: 'flex-start' }}
            >
              Upload Resume
            </AppButton>
          </Stack>
        </SectionCard>
      </Stack>
    </>
  )
}

export default function ResumeUploadPage() {
  return <CandidateProfileGate>{(profile) => <ResumeUploadBody profile={profile} />}</CandidateProfileGate>
}
