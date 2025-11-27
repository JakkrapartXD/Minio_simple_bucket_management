import { prisma } from '../../lib/prisma'
import { hashPassword, generateToken } from '../../lib/auth'

export default defineEventHandler(async (event) => {
  const body = await readBody<{ username?: string; password?: string }>(event)

  const { username, password } = body

  if (!username || !password) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Username and password are required',
    })
  }

  if (password.length < 6) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Password must be at least 6 characters',
    })
  }

  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { username },
  })

  if (existingUser) {
    throw createError({
      statusCode: 409,
      statusMessage: 'Username already exists',
    })
  }

  // Hash password
  const hashedPassword = await hashPassword(password)

  // Create user (default role is USER)
  const user = await prisma.user.create({
    data: {
      username,
      password: hashedPassword,
      role: 'USER',
    },
  })

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

