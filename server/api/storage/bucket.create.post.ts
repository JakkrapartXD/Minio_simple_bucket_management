import { minio } from '../lib/minio'
import { requireAdmin } from '../../lib/auth'

export default defineEventHandler(async (event) => {
  // Only admins can create buckets
  await requireAdmin(event)

  const body = await readBody<{ name?: string }>(event)
  const name = body?.name?.trim()

  if (!name) {
    throw createError({
      statusCode: 400,
      statusMessage: 'bucket name required',
    })
  }

  await minio.makeBucket(name)

  return { ok: true, name }
})

