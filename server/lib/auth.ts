import jwt from 'jsonwebtoken'
import bcrypt from 'bcrypt'
import { getHeader, createError, type H3Event } from 'h3'
import { readFileSync } from 'fs'
import { join } from 'path'
import { prisma } from './prisma'

const SALT_ROUNDS = 10

function getJwtKeys() {
  const privateKeyPath = join(process.cwd(), 'keys', 'jwt.key')
  const publicKeyPath = join(process.cwd(), 'keys', 'jwt.key.pub')
  
  const privateKey = readFileSync(privateKeyPath, 'utf8')
  const publicKey = readFileSync(publicKeyPath, 'utf8')
  
  return { privateKey, publicKey }
}

export interface TokenPayload {
  userId: number
  username: string
  role: 'ADMIN' | 'USER'
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS)
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

export function generateToken(payload: TokenPayload): string {
  const { privateKey } = getJwtKeys()
  return jwt.sign(payload, privateKey, { 
    algorithm: 'RS256',
    expiresIn: '7d' 
  })
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    const { publicKey } = getJwtKeys()
    return jwt.verify(token, publicKey, { 
      algorithms: ['RS256'] 
    }) as TokenPayload
  } catch (error) {
    return null
  }
}

export async function getUserFromToken(event: H3Event) {
  const authHeader = getHeader(event, 'authorization')
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null
  }

  const token = authHeader.substring(7)
  const payload = verifyToken(token)

  if (!payload) {
    return null
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.userId }
  })

  return user
}

export async function requireAuth(event: H3Event) {
  const user = await getUserFromToken(event)
  
  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized'
    })
  }

  return user
}

export async function requireAdmin(event: H3Event) {
  const user = await requireAuth(event)
  
  if (user.role !== 'ADMIN') {
    throw createError({
      statusCode: 403,
      statusMessage: 'Forbidden - Admin access required'
    })
  }

  return user
}

