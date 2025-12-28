import { Context, Next } from 'hono'
import { getCookie } from 'hono/cookie'
import crypto from 'crypto'
import { ApiError } from '../utils/ApiError'

export const requireFaculty = async (c: Context, next: Next) => {
  const user = c.get('user')

  if (!user) {
    throw new ApiError(401, 'Unauthorized')
  }

  // role check 
  if (user.role !== 'faculty') {
    throw new ApiError(403, 'Faculty access required')
  }


  const facultyKey = getCookie(c, 'faculty_key')

  if (!facultyKey) {
    throw new ApiError(403, 'Faculty key missing')
  }


  // expected faculty key
  const expectedKey = crypto
    .createHmac('sha256', process.env.FACULTY_SECRET_KEY!)
    .update(user.id)
    .digest('hex')

  if (facultyKey !== expectedKey) {
    throw new ApiError(403, 'Invalid faculty key')
  }

  // all checks passed
  await next()
}
