import { z } from 'zod'

export const createUserSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(50),
  lastName: z.string().min(1, 'Last name is required').max(50),
  email: z.string().min(1, 'Email is required').email('Enter a valid email').max(150),
  roleName: z.string().min(1, 'Role is required'),
  phoneNumber: z.string().max(20).optional().or(z.literal('')),
  password: z.string().min(8, 'Password must be at least 8 characters').max(100),
})
export type CreateUserFormValues = z.infer<typeof createUserSchema>

export const editUserSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(50),
  lastName: z.string().min(1, 'Last name is required').max(50),
  phoneNumber: z.string().max(20).optional().or(z.literal('')),
})
export type EditUserFormValues = z.infer<typeof editUserSchema>

export const createRoleSchema = z.object({
  name: z.string().min(1, 'Role name is required').max(60),
  permissions: z.string().optional().or(z.literal('')),
})
export type CreateRoleFormValues = z.infer<typeof createRoleSchema>

export const triggerNotificationSchema = z.object({
  channel: z.string().min(1, 'Channel is required'),
  recipientId: z.string().min(1, 'Recipient ID is required').refine((v) => Number(v) > 0, 'Enter a valid ID'),
  template: z.string().min(1, 'Template is required'),
  event: z.string().min(1, 'Event is required'),
})
export type TriggerNotificationFormValues = z.infer<typeof triggerNotificationSchema>
