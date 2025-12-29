
import { z } from 'zod'

export const updateUserSchema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email().optional(),
  profileURL: z.string().url().optional(),
})

export type UpdateUserDTO = z.infer<typeof updateUserSchema>
