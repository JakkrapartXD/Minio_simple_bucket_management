import { requireAuth } from '../../lib/auth'

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)

  return {
    id: user.id,
    username: user.username,
    role: user.role,
  }
})

