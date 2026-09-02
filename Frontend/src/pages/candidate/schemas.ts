import { z } from 'zod'

export const createProfileSchema = z.object({
  phone: z.string().min(1, 'Phone number is required').max(20),
  location: z.string().min(1, 'Location is required').max(100),
})
export type CreateProfileFormValues = z.infer<typeof createProfileSchema>

export const editProfileSchema = z.object({
  location: z.string().min(1, 'Location is required').max(100),
  noticePeriod: z.string().max(50).optional().or(z.literal('')),
  // HTML number inputs still round-trip through RHF as strings — kept as a
  // string here and coerced to a number where it's actually sent (see
  // CandidateProfileEditPage's mutationFn) to avoid fighting the resolver's
  // input/output generic split.
  salaryExpectation: z
    .string()
    .optional()
    .refine((v) => !v || !Number.isNaN(Number(v)), 'Must be a number'),
})
export type EditProfileFormValues = z.infer<typeof editProfileSchema>

export const certificationSchema = z.object({
  name: z.string().min(1, 'Certification name is required').max(150),
  issuer: z.string().min(1, 'Issuer is required').max(150),
  issueDate: z.string().min(1, 'Issue date is required'),
})
export type CertificationFormValues = z.infer<typeof certificationSchema>

// See editProfileSchema's comment — number inputs round-trip as strings via RHF.
const optionalYear = z
  .string()
  .optional()
  .refine((v) => !v || (/^\d{4}$/.test(v) && Number(v) > 1900 && Number(v) < 2100), 'Enter a valid year')

export const educationSchema = z.object({
  degree: z.string().min(1, 'Degree is required').max(150),
  institution: z.string().min(1, 'Institution is required').max(150),
  fieldOfStudy: z.string().max(150).optional().or(z.literal('')),
  startYear: optionalYear,
  endYear: optionalYear,
})
export type EducationFormValues = z.infer<typeof educationSchema>

export const workExperienceSchema = z.object({
  jobTitle: z.string().min(1, 'Job title is required').max(150),
  companyName: z.string().min(1, 'Company name is required').max(150),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().optional().or(z.literal('')),
  isCurrent: z.boolean(),
  description: z.string().max(1000).optional().or(z.literal('')),
})
export type WorkExperienceFormValues = z.infer<typeof workExperienceSchema>
