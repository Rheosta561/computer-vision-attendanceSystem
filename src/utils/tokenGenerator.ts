import jwt, { SignOptions } from 'jsonwebtoken'
import { prisma } from '@/config/prismaClient'
import { ApiError } from '../utils/ApiError'


const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET as string
const ACCESS_TOKEN_EXPIRY = process.env.ACCESS_TOKEN_EXPIRY as SignOptions['expiresIn']
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET as string
const REFRESH_TOKEN_EXPIRY = process.env.REFRESH_TOKEN_EXPIRY as SignOptions['expiresIn']


if (
  !ACCESS_TOKEN_SECRET||
  !ACCESS_TOKEN_EXPIRY||
  !REFRESH_TOKEN_SECRET||
  !REFRESH_TOKEN_EXPIRY
) {
  throw new Error('env not set for tokens')
}

export const generateAccessAndRefreshTokens = async (userId: string) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    })

    if (!user) {
      throw new ApiError(404, 'User not found')
    }

    const accessToken = jwt.sign(
      {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      ACCESS_TOKEN_SECRET,
      { expiresIn: ACCESS_TOKEN_EXPIRY }
    )

    const refreshToken = jwt.sign(
      { id: user.id },
      REFRESH_TOKEN_SECRET,
      { expiresIn: REFRESH_TOKEN_EXPIRY }
    )

    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken },
    })

    return { accessToken, refreshToken }
  } catch (error) {
    throw new ApiError(500, 'Error generating tokens')
  }
}
