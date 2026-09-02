import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Chip, Stack, TextField } from '@mui/material'
import AddRoundedIcon from '@mui/icons-material/AddRounded'
import { PageHeader } from '@/components/common/PageHeader'
import { SectionCard } from '@/components/common/SectionCard'
import { AppButton } from '@/components/common/AppButton'
import { EmptyState } from '@/components/common/EmptyState'
import { CardSkeleton } from '@/components/common/LoadingSkeleton'
import { CandidateProfileGate } from '@/components/candidate/CandidateProfileGate'
import { candidateApi } from '@/api/candidateApi'
import { useToast } from '@/hooks/useToast'
import { ROUTES } from '@/constants/routes'
import type { CandidateProfile } from '@/types/candidate'

function SkillsBody({ profile }: { profile: CandidateProfile }) {
  const toast = useToast()
  const queryClient = useQueryClient()
  const [newSkill, setNewSkill] = useState('')

  const skillsQueryKey = ['candidateSkills', profile.candidateId]
  const { data, isLoading } = useQuery({
    queryKey: skillsQueryKey,
    queryFn: () => candidateApi.getSkills(profile.candidateId),
  })

  const { mutate, isPending } = useMutation({
    mutationFn: (skills: string[]) => candidateApi.updateSkills(profile.candidateId, skills),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: skillsQueryKey })
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Could not update your skills.'),
  })

  const skills = data?.skills ?? []

  const addSkill = () => {
    const trimmed = newSkill.trim()
    if (!trimmed || skills.includes(trimmed)) {
      setNewSkill('')
      return
    }
    mutate([...skills, trimmed])
    setNewSkill('')
  }

  const removeSkill = (skill: string) => mutate(skills.filter((s) => s !== skill))

  return (
    <>
      <PageHeader
        title="Skills"
        breadcrumbs={[{ label: 'Dashboard', to: ROUTES.candidateDashboard }, { label: 'Skills' }]}
      />
      <SectionCard>
        <Stack spacing={3}>
          <Stack direction="row" spacing={1.5}>
            <TextField
              placeholder="e.g. Java, React, Project Management"
              value={newSkill}
              onChange={(e) => setNewSkill(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  addSkill()
                }
              }}
              fullWidth
            />
            <AppButton
              variant="contained"
              startIcon={<AddRoundedIcon />}
              onClick={addSkill}
              loading={isPending}
              disabled={!newSkill.trim()}
            >
              Add
            </AppButton>
          </Stack>

          {isLoading ? (
            <CardSkeleton height={80} />
          ) : skills.length === 0 ? (
            <EmptyState
              title="No skills added yet"
              description="Add skills manually, or upload and parse your resume to extract them automatically."
            />
          ) : (
            <Stack direction="row" flexWrap="wrap" useFlexGap gap={1}>
              {skills.map((skill) => (
                <Chip key={skill} label={skill} onDelete={() => removeSkill(skill)} disabled={isPending} />
              ))}
            </Stack>
          )}
        </Stack>
      </SectionCard>
    </>
  )
}

export default function SkillsPage() {
  return <CandidateProfileGate>{(profile) => <SkillsBody profile={profile} />}</CandidateProfileGate>
}
