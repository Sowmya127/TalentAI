import { z } from 'zod'

export const generateOfferSchema = z.object({
  applicationId: z.string().min(1, 'Application ID is required').refine((v) => Number(v) > 0, 'Enter a valid ID'),
  baseSalary: z.string().min(1, 'Base salary is required').refine((v) => Number(v) > 0, 'Enter a valid amount'),
  currency: z.string().min(1, 'Currency is required'),
  variablePay: z.string().optional().or(z.literal('')).refine((v) => !v || Number(v) >= 0, 'Enter a valid amount'),
  joiningDate: z.string().min(1, 'Joining date is required'),
})
export type GenerateOfferFormValues = z.infer<typeof generateOfferSchema>
