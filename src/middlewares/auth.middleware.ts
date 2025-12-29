import { Context, Next } from 'hono'
import jwt from 'jsonwebtoken'
import { getCookie } from 'hono/cookie'
import { prisma } from '@/config/prismaClient'
import { ApiError } from '../utils/ApiError'
import { AppContext } from '@/types/context'

interface JwtPayload {
  id: string
}

export const verifyJWT = async (c: AppContext, next: Next) => {
  try {
    //fetching token 
    const token =
      getCookie(c, 'accessToken') ||
      c.req.header('Authorization')?.replace('Bearer ', '')

    if (!token) {
      throw new ApiError(401, 'Unauthorized request')
    }

    // verfication 
    const decoded = jwt.verify(
      token,
      process.env.ACCESS_TOKEN_SECRET as string
    ) as JwtPayload


    //user fetch 
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      },
    })

    if (!user) {
      throw new ApiError(401, 'Invalid Access Token')
    }


    c.set('user', user)


    await next()
  } catch (error: any) {
    throw new ApiError(
      401,
      error?.message || 'Invalid access token'
    )
  }
}
