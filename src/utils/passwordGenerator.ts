import crypto from 'crypto'

interface PasswordOptions {
  length?: number
  includeUppercase?: boolean
  includeLowercase?: boolean
  includeNumbers?: boolean
  includeSymbols?: boolean
}

export const generatePassword = ({
  length = 12,
  includeUppercase = true,
  includeLowercase = true,
  includeNumbers = true,
  includeSymbols = true,
}: PasswordOptions = {}) => {
  let charset = ''

  if (includeUppercase) charset += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  if (includeLowercase) charset += 'abcdefghijklmnopqrstuvwxyz'
  if (includeNumbers) charset += '0123456789'
  if (includeSymbols) charset += '!@#$%^&*()-_=+[]{}<>?'

  if (!charset) {
    throw new Error('At least one character set must be enabled')
  }

  const passwordChars = []
  const randomBytes = crypto.randomBytes(length)

  for (let i = 0; i < length; i++) {
    const index = randomBytes[i] % charset.length
    passwordChars.push(charset[index])
  }

  return passwordChars.join('')
}
