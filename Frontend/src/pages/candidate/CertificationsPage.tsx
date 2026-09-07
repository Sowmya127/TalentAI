import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Box, Chip, Grid, IconButton, Stack, Typography, alpha } from '@mui/material'
import AddRoundedIcon from '@mui/icons-material/AddRounded'
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded'
import WorkspacePremiumOutlinedIcon from '@mui/icons-material/WorkspacePremiumOutlined'
import AutoAwesomeRoundedIcon from '@mui/icons-material/AutoAwesomeRounded'
import { PageHeader } from '@/components/common/PageHeader'
import { SectionCard } from '@/components/common/SectionCard'
import { AppButton } from '@/components/common/AppButton'
import { AppDialog } from '@/components/common/AppDialog'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { EmptyState } from '@/components/common/EmptyState'
import { CardSkeleton } from '@/components/common/LoadingSkeleton'
import { FormTextField } from '@/components/form/FormTextField'
import { CandidateProfileGate } from '@/components/candidate/CandidateProfileGate'
import { candidateApi } from '@/api/candidateApi'
import { useToast } from '@/hooks/useToast'
import { formatDate } from '@/utils/formatters'
import { ROUTES } from '@/constants/routes'
import { BRAND } from '@/theme/palette'
import { certificationSchema, type CertificationFormValues } from './schemas'
import type { CandidateProfile, Certification } from '@/types/candidate'

/** Curated certification catalog keyed by skill — jobs store skills, not certs,
 * so we map the candidate's skills to the credentials that back them. */
const CERT_CATALOG: { skill: string; certs: { name: string; issuer: string }[] }[] = [
  { skill: 'aws', certs: [{ name: 'AWS Certified Solutions Architect – Associate', issuer: 'Amazon Web Services' }] },
  { skill: 'azure', certs: [{ name: 'Microsoft Certified: Azure Fundamentals', issuer: 'Microsoft' }] },
  { skill: 'gcp', certs: [{ name: 'Google Associate Cloud Engineer', issuer: 'Google Cloud' }] },
  { skill: 'docker', certs: [{ name: 'Docker Certified Associate', issuer: 'Docker' }] },
  { skill: 'kubernetes', certs: [{ name: 'Certified Kubernetes Administrator (CKA)', issuer: 'CNCF' }] },
  { skill: 'react', certs: [{ name: 'Meta Front-End Developer', issuer: 'Meta' }] },
  { skill: 'python', certs: [{ name: 'PCEP – Certified Entry-Level Python Programmer', issuer: 'Python Institute' }] },
  { skill: 'java', certs: [{ name: 'Oracle Certified Professional: Java SE', issuer: 'Oracle' }] },
  { skill: 'sql', certs: [{ name: 'Oracle Database SQL Certified Associate', issuer: 'Oracle' }] },
  { skill: 'mysql', certs: [{ name: 'Oracle Database SQL Certified Associate', issuer: 'Oracle' }] },
  { skill: 'machine learning', certs: [{ name: 'TensorFlow Developer Certificate', issuer: 'Google' }] },
  { skill: 'project management', certs: [{ name: 'PMP – Project Management Professional', issuer: 'PMI' }] },
  { skill: 'full stack development', certs: [{ name: 'Meta Full-Stack Engineer', issuer: 'Meta' }] },
  { skill: 'devops', certs: [{ name: 'AWS Certified DevOps Engineer – Professional', issuer: 'Amazon Web Services' }] },
]

const DEFAULT_CERTS = [
  { name: 'AWS Certified Cloud Practitioner', issuer: 'Amazon Web Services' },
  { name: 'Google Data Analytics Professional', issuer: 'Google' },
  { name: 'PMP – Project Management Professional', issuer: 'PMI' },
]

interface CertSuggestion {
  name: string
  issuer: string
  because?: string
}

function suggestCerts(skills: string[], owned: Set<string>): CertSuggestion[] {
  const out = new Map<string, CertSuggestion>()
  for (const skill of skills) {
    const key = skill.trim().toLowerCase()
    for (const entry of CERT_CATALOG) {
      if (key === entry.skill || key.includes(entry.skill) || entry.skill.includes(key)) {
        for (const c of entry.certs) {
          const ck = c.name.toLowerCase()
          if (!owned.has(ck) && !out.has(ck)) out.set(ck, { ...c, because: skill })
        }
      }
    }
  }
  let list = [...out.values()]
  if (list.length === 0) {
    list = DEFAULT_CERTS.filter((c) => !owned.has(c.name.toLowerCase())).map((c) => ({ ...c }))
  }
  return list.slice(0, 5)
}

function CertificationsBody({ profile }: { profile: CandidateProfile }) {
  const toast = useToast()
  const queryClient = useQueryClient()
  const queryKey = ['candidateCertifications', profile.candidateId]

  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleting, setDeleting] = useState<Certification | null>(null)

  const { data, isLoading } = useQuery({
    queryKey,
    queryFn: () => candidateApi.getCertifications(profile.candidateId),
  })
  const skillsQuery = useQuery({
    queryKey: ['candidateSkills', profile.candidateId],
    queryFn: () => candidateApi.getSkills(profile.candidateId),
  })

  const { control, handleSubmit, reset } = useForm<CertificationFormValues>({
    resolver: zodResolver(certificationSchema),
    defaultValues: { name: '', issuer: '', issueDate: '' },
  })

  const openAdd = () => {
    reset({ name: '', issuer: '', issueDate: '' })
    setDialogOpen(true)
  }

  const openSuggested = (name: string, issuer: string) => {
    reset({ name, issuer, issueDate: '' })
    setDialogOpen(true)
  }

  const addMutation = useMutation({
    mutationFn: (values: CertificationFormValues) => candidateApi.addCertification(profile.candidateId, values),
    onSuccess: () => {
      toast.success('Certification added.')
      queryClient.invalidateQueries({ queryKey })
      setDialogOpen(false)
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Could not add this certification.'),
  })

  const deleteMutation = useMutation({
    mutationFn: (cert: Certification) => candidateApi.removeCertification(profile.candidateId, cert.certificationId),
    onSuccess: () => {
      toast.success('Certification removed.')
      queryClient.invalidateQueries({ queryKey })
      setDeleting(null)
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Could not remove this certification.'),
  })

  const certifications = data ?? []
  const owned = new Set(certifications.map((c) => c.name.toLowerCase()))
  const suggestions = suggestCerts(skillsQuery.data?.skills ?? [], owned)

  return (
    <>
      <PageHeader
        title="Certifications"
        breadcrumbs={[{ label: 'Dashboard', to: ROUTES.candidateDashboard }, { label: 'Certifications' }]}
        actions={
          <AppButton variant="contained" startIcon={<AddRoundedIcon />} onClick={openAdd}>
            Add Certification
          </AppButton>
        }
      />

      <Grid container spacing={2.5}>
        {/* Left — your certifications */}
        <Grid size={{ xs: 12, md: 8 }}>
          {isLoading ? (
            <CardSkeleton height={140} />
          ) : certifications.length === 0 ? (
            <SectionCard>
              <EmptyState
                icon={<WorkspacePremiumOutlinedIcon fontSize="medium" />}
                title="No certifications added yet"
                description="Add any professional certifications relevant to the roles you're applying for."
                action={
                  <AppButton variant="contained" onClick={openAdd}>
                    Add Certification
                  </AppButton>
                }
              />
            </SectionCard>
          ) : (
            <Grid container spacing={2}>
              {certifications.map((cert) => (
                <Grid key={cert.certificationId} size={{ xs: 12, sm: 6 }}>
                  <Box
                    sx={{
                      height: '100%',
                      bgcolor: 'background.paper',
                      border: (theme) => `1px solid ${theme.palette.divider}`,
                      borderRadius: 3,
                      p: 2.5,
                    }}
                  >
                    <Stack direction="row" spacing={2} alignItems="flex-start">
                      <Box
                        sx={{
                          width: 44,
                          height: 44,
                          borderRadius: '50%',
                          flexShrink: 0,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          bgcolor: alpha(BRAND.taupe, 0.15),
                          color: BRAND.steelDark,
                        }}
                      >
                        <WorkspacePremiumOutlinedIcon fontSize="small" />
                      </Box>
                      <Box sx={{ minWidth: 0, flex: 1 }}>
                        <Typography variant="subtitle1" fontWeight={700}>
                          {cert.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {cert.issuer}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Issued {formatDate(cert.issueDate)}
                        </Typography>
                      </Box>
                      <IconButton size="small" onClick={() => setDeleting(cert)} aria-label="Remove certification">
                        <DeleteOutlineRoundedIcon fontSize="small" />
                      </IconButton>
                    </Stack>
                  </Box>
                </Grid>
              ))}
            </Grid>
          )}
        </Grid>

        {/* Right — in-demand certifications */}
        <Grid size={{ xs: 12, md: 4 }}>
          {suggestions.length > 0 ? (
            <SectionCard>
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }}>
                <AutoAwesomeRoundedIcon fontSize="small" sx={{ color: BRAND.steelDark }} />
                <Typography variant="subtitle1" fontWeight={700}>
                  In-demand certifications
                </Typography>
              </Stack>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Credentials that back the skills you already have. Tap one to add it.
              </Typography>
              <Stack spacing={1.25}>
                {suggestions.map((s) => (
                  <Box
                    key={s.name}
                    role="button"
                    tabIndex={0}
                    onClick={() => openSuggested(s.name, s.issuer)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        openSuggested(s.name, s.issuer)
                      }
                    }}
                    sx={{
                      cursor: 'pointer',
                      border: (theme) => `1px solid ${theme.palette.divider}`,
                      borderRadius: 2,
                      p: 1.5,
                      transition: 'border-color 120ms ease, background-color 120ms ease',
                      '&:hover': { borderColor: BRAND.taupe, bgcolor: alpha(BRAND.taupe, 0.06) },
                    }}
                  >
                    <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1}>
                      <Box sx={{ minWidth: 0 }}>
                        <Typography variant="body2" fontWeight={600}>
                          {s.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {s.issuer}
                        </Typography>
                        {s.because ? (
                          <Box sx={{ mt: 0.75 }}>
                            <Chip
                              label={`Matches your ${s.because}`}
                              size="small"
                              sx={{ height: 20, bgcolor: alpha(BRAND.taupe, 0.15), color: BRAND.steelDark, fontWeight: 600 }}
                            />
                          </Box>
                        ) : null}
                      </Box>
                      <AddRoundedIcon fontSize="small" sx={{ color: BRAND.slate, flexShrink: 0, mt: 0.25 }} />
                    </Stack>
                  </Box>
                ))}
              </Stack>
            </SectionCard>
          ) : null}
        </Grid>
      </Grid>

      {dialogOpen ? (
        <AppDialog
          open={dialogOpen}
          onClose={() => setDialogOpen(false)}
          title="Add Certification"
          actions={
            <>
              <AppButton color="inherit" onClick={() => setDialogOpen(false)}>
                Cancel
              </AppButton>
              <AppButton
                variant="contained"
                loading={addMutation.isPending}
                onClick={handleSubmit((values) => addMutation.mutate(values))}
              >
                Save
              </AppButton>
            </>
          }
        >
          <Stack spacing={2} sx={{ pt: 0.5 }}>
            <FormTextField name="name" control={control} label="Certification name" autoFocus />
            <FormTextField name="issuer" control={control} label="Issuer" />
            <FormTextField
              name="issueDate"
              control={control}
              label="Issue date"
              type="date"
              slotProps={{ inputLabel: { shrink: true } }}
            />
          </Stack>
        </AppDialog>
      ) : null}

      <ConfirmDialog
        open={Boolean(deleting)}
        title="Remove certification"
        message={`Remove "${deleting?.name}" from your profile? This can't be undone.`}
        confirmLabel="Remove"
        destructive
        loading={deleteMutation.isPending}
        onConfirm={() => deleting && deleteMutation.mutate(deleting)}
        onCancel={() => setDeleting(null)}
      />
    </>
  )
}

export default function CertificationsPage() {
  return <CandidateProfileGate>{(profile) => <CertificationsBody profile={profile} />}</CandidateProfileGate>
}
