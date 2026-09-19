import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
})
export type LoginFormValues = z.infer<typeof loginSchema>

export const registerSchema = z
  .object({
    requestedRole: z.string().min(1, 'Please choose a role'),
    firstName: z.string().min(1, 'First name is required').max(50, 'Must be 50 characters or fewer'),
    lastName: z.string().min(1, 'Last name is required').max(50, 'Must be 50 characters or fewer'),
    email: z.string().min(1, 'Email is required').email('Enter a valid email address').max(150),
    phoneNumber: z.string().max(20, 'Must be 20 characters or fewer').optional().or(z.literal('')),
    companyName: z.string().max(150, 'Must be 150 characters or fewer').optional().or(z.literal('')),
    organizationEmail: z
      .string()
      .email('Enter a valid email address')
      .max(150)
      .optional()
      .or(z.literal('')),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })
export type RegisterFormValues = z.infer<typeof registerSchema>

export const forgotPasswordSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Enter a valid email address'),
})
export type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>

export const resetPasswordSchema = z
  .object({
    resetToken: z.string().min(1, 'Reset token is required'),
    newPassword: z.string().min(8, 'Password must be at least 8 characters'),
    confirmNewPassword: z.string().min(1, 'Please confirm your new password'),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: 'Passwords do not match',
    path: ['confirmNewPassword'],
  })
export type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>
