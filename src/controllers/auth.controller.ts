import { Context } from 'hono'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { prisma } from '@/config/prismaClient'
import { ApiError } from '../utils/ApiError'
import { ApiResponse } from '../utils/ApiResponse'
import { getCookie , setCookie , deleteCookie } from 'hono/cookie'
import { generateAccessAndRefreshTokens } from '../utils/tokenGenerator'

const isProduction = process.env.NODE_ENV === 'production'

// registering user 
export const registerUser = async (c: Context) => {
  const { email , password ,  name , role } = await c.req.json()

  if (!email || !password || !name || !role) {
    throw new ApiError(400, 'all fields are required')
  }

  const existingUser = await prisma.user.findUnique({
    where: { email },
  })

  if (existingUser) {
    throw new ApiError(409, ' User already exists')
  }

  const hashedPassword = await bcrypt.hash(password, 10)

  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      name,
      role,
    },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
    },
  })
   const { accessToken, refreshToken } =
    await generateAccessAndRefreshTokens(user.id)
  setCookie(c, 'accessToken', accessToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'Strict',
    maxAge: 60 * 15, 
    path: '/',
  })

  setCookie(c, 'refreshToken', refreshToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'Strict',
    maxAge: 60 * 60 * 24 * 7, 
    path: '/',
  })

  return c.json(
    new ApiResponse(201, user, 'User registered successfully'),
    201
  )
}

// login user
export const loginUser = async (c: Context) => {
  const{ email , password} = await c.req.json()

  if (! email || ! password) {
    throw new ApiError(400, 'Email and password are required')
  }

  const user = await prisma.user.findUnique({
    where: { email },
  })

  if (!user) {
    throw new ApiError(404, 'User not found')
  }

  const isValidPassword = await bcrypt.compare(password, user.password)

  if (!isValidPassword) {
    throw new ApiError(401, 'Invalid credentials')
  }

  const { accessToken, refreshToken } =
    await generateAccessAndRefreshTokens(user.id)


  setCookie(c, 'accessToken', accessToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'Strict',
    maxAge: 60 * 15, 
    path: '/',
  })

  setCookie(c, 'refreshToken', refreshToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'Strict',
    maxAge: 60 * 60 * 24 * 7, 
    path: '/',
  })

  return c.json(
    new ApiResponse(
      200,
      {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
        accessToken,
        refreshToken,
      },
      'Login successful'
    )
  )
}

// logout user
export const logoutUser = async (c: Context) => {
  deleteCookie(c, 'accessToken')
  deleteCookie(c, 'refreshToken')

  return c.json(new ApiResponse(200, {}, 'Logged out successfully'))
}

// refresh session
export const refreshSession = async (c: Context) => {
  const refreshToken =
    getCookie(c, 'refreshToken') ||
    (await c.req.json().catch(() => null))?.refreshToken

  if (!refreshToken) {
    throw new ApiError(401, 'Unauthorized')
  }

  try {
    const decoded = jwt.verify(
      refreshToken,
      process.env.REFRESH_TOKEN_SECRET as string
    ) as { id: string }

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
    })

    if (! user) {
      throw new ApiError(401 , 'Invalid refresh token')
    }

    const {
      accessToken ,
      refreshToken: newRefreshToken ,
    } = await generateAccessAndRefreshTokens(user.id)

    setCookie(c, 'accessToken', accessToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'Strict',
      maxAge: 60 * 15,
      path: '/',
    })

    setCookie(c, 'refreshToken' , newRefreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'Strict',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    })

    return c.json(
      new ApiResponse(
        200,
        { accessToken, refreshToken : newRefreshToken },
        'Session refreshed'
      )
    )
  } catch {
    throw new ApiError(401, 'Invalid or expired refresh token')
  }
}
