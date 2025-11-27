import { prisma } from '../../lib/prisma'
import { verifyPassword, generateToken } from '../../lib/auth'

export default defineEventHandler(async (event) => {
  const body = await readBody<{ username?: string; password?: string }>(event)

  const { username, password } = body

  if (!username || !password) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Username and password are required',
    })
  }

  // Find user by username
  const user = await prisma.user.findUnique({
    where: { username },
  })

  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Invalid credentials',
    })
  }

  // Verify password
  const isValid = await verifyPassword(password, user.password)

  if (!isValid) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Invalid credentials',
    })
  }

  // Generate JWT token
  const token = generateToken({
    userId: user.id,
    username: user.username,
    role: user.role as 'ADMIN' | 'USER',
  })

  return {
    token,
    user: {
      id: user.id,
      username: user.username,
      role: user.role,
    },
  }
})

