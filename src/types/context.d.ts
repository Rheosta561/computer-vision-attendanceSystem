import { Context } from 'hono'

export type AppContext = Context<{
  Variables: {
    user: {
      id: string
      email: string
      name: string
      role: 'student' | 'faculty'
    }
  }
}>
