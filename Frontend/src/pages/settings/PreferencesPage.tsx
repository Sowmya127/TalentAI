import { useEffect, useState } from 'react'
import { Divider, FormControlLabel, Stack, Switch, Typography } from '@mui/material'
import { PageHeader } from '@/components/common/PageHeader'
import { SectionCard } from '@/components/common/SectionCard'
import { useToast } from '@/hooks/useToast'

const STORAGE_KEY = 'talentai.preferences'

interface Preferences {
  emailNotifications: boolean
  smsNotifications: boolean
  inAppNotifications: boolean
  weeklyDigest: boolean
}

const DEFAULTS: Preferences = {
  emailNotifications: true,
  smsNotifications: false,
  inAppNotifications: true,
  weeklyDigest: false,
}

function loadPreferences(): Preferences {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULTS
    return { ...DEFAULTS, ...(JSON.parse(raw) as Partial<Preferences>) }
  } catch {
    return DEFAULTS
  }
}

const TOGGLES: { key: keyof Preferences; label: string; description: string }[] = [
  { key: 'emailNotifications', label: 'Email notifications', description: 'Receive recruitment updates by email.' },
  { key: 'smsNotifications', label: 'SMS notifications', description: 'Receive time-sensitive alerts by text message.' },
  { key: 'inAppNotifications', label: 'In-app notifications', description: 'Show notifications inside TalentAI.' },
  { key: 'weeklyDigest', label: 'Weekly digest', description: 'A weekly summary of your recruitment activity.' },
]

export default function PreferencesPage() {
  const toast = useToast()
  const [prefs, setPrefs] = useState<Preferences>(() => loadPreferences())

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs))
    } catch {
      /* storage unavailable — preferences simply won't persist this session */
    }
  }, [prefs])

  const toggle = (key: keyof Preferences) => {
    setPrefs((p) => ({ ...p, [key]: !p[key] }))
    toast.success('Preference saved.')
  }

  return (
    <>
      <PageHeader
        title="Preferences"
        description="Choose how TalentAI keeps you informed."
        breadcrumbs={[{ label: 'Settings' }, { label: 'Preferences' }]}
      />

      <SectionCard title="Notification Preferences">
        <Stack spacing={2} divider={<Divider flexItem />}>
          {TOGGLES.map((t) => (
            <Stack key={t.key} direction="row" alignItems="center" justifyContent="space-between" spacing={2}>
              <Stack>
                <Typography variant="subtitle2" fontWeight={600}>
                  {t.label}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {t.description}
                </Typography>
              </Stack>
              <FormControlLabel
                control={<Switch checked={prefs[t.key]} onChange={() => toggle(t.key)} />}
                label=""
                sx={{ m: 0 }}
              />
            </Stack>
          ))}
        </Stack>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2 }}>
          Preferences are saved on this device.
        </Typography>
      </SectionCard>
    </>
  )
}
