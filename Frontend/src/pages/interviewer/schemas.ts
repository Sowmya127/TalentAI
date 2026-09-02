import { z } from 'zod'

/** Interview scorecard (POST /interviews/{id}/feedback). Ratings are 1–5. */
export const feedbackSchema = z.object({
  technical: z.number().min(1, 'Rate technical skills').max(5),
  communication: z.number().min(1, 'Rate communication').max(5),
  problemSolving: z.number().min(1, 'Rate problem solving').max(5),
  domainKnowledge: z.number().min(1, 'Rate domain knowledge').max(5),
  comments: z.string().min(1, 'Comments are required').max(2000),
  recommendation: z.string().min(1, 'A recommendation is required'),
})
export type FeedbackFormValues = z.infer<typeof feedbackSchema>
