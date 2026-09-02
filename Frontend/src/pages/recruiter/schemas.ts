import { z } from 'zod'

/**
 * Form schemas validate plain string fields only (no .transform()/.coerce),
 * so RHF's resolver input and output types match. Conversion to the API
 * shape — splitting comma-separated skills, Number()-ing numeric fields —
 * happens in each page's submit handler via the `parseJobForm` helper below.
 */
const numericString = (msg: string) =>
  z.string().min(1, msg).refine((v) => !Number.isNaN(Number(v)) && Number(v) >= 0, 'Enter a valid number')

export const jobSchema = z
  .object({
    title: z.string().min(1, 'Job title is required').max(150),
    department: z.string().min(1, 'Department is required').max(100),
    location: z.string().min(1, 'Location is required').max(100),
    employmentType: z.string().min(1, 'Employment type is required'),
    requiredSkills: z.string().min(1, 'Add at least one required skill'),
    preferredSkills: z.string().optional().or(z.literal('')),
    minExperience: numericString('Minimum experience is required'),
    maxExperience: numericString('Maximum experience is required'),
    hiringManagerId: z.string().min(1, 'Hiring manager ID is required').refine((v) => Number(v) > 0, 'Enter a valid ID'),
    recruiterId: z.string().min(1, 'Recruiter ID is required').refine((v) => Number(v) > 0, 'Enter a valid ID'),
  })
  .refine((d) => Number(d.maxExperience) >= Number(d.minExperience), {
    message: 'Max experience must be at least the minimum',
    path: ['maxExperience'],
  })
export type JobFormValues = z.infer<typeof jobSchema>

function splitSkills(value: string | undefined): string[] {
  return (value ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
}

/** Converts validated string form values into the CreateJobRequest API shape. */
export function parseJobForm(values: JobFormValues) {
  return {
    title: values.title,
    department: values.department,
    location: values.location,
    employmentType: values.employmentType,
    requiredSkills: splitSkills(values.requiredSkills),
    preferredSkills: splitSkills(values.preferredSkills),
    minExperience: Number(values.minExperience),
    maxExperience: Number(values.maxExperience),
    hiringManagerId: Number(values.hiringManagerId),
    recruiterId: Number(values.recruiterId),
  }
}

export const scheduleInterviewSchema = z.object({
  interviewType: z.string().min(1, 'Interview type is required'),
  interviewerId: z.string().min(1, 'Interviewer ID is required').refine((v) => Number(v) > 0, 'Enter a valid ID'),
  scheduledAt: z.string().min(1, 'Date and time are required'),
  durationMinutes: z.string().min(1, 'Duration is required').refine((v) => Number(v) >= 15, 'At least 15 minutes'),
  mode: z.string().min(1, 'Mode is required'),
})
export type ScheduleInterviewFormValues = z.infer<typeof scheduleInterviewSchema>

export const rejectSchema = z.object({
  reasonCode: z.string().min(1, 'A reason is required'),
  comments: z.string().max(500).optional().or(z.literal('')),
})
export type RejectFormValues = z.infer<typeof rejectSchema>
