import { minio } from '../lib/minio'
import { getUserFromToken } from '../../lib/auth'
import { isBucketPublic } from '../../lib/bucket-access'

export default defineEventHandler(async (event) => {
  const user = await getUserFromToken(event)

  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized - Please login',
    })
  }

  // All authenticated users can view all buckets
  const buckets = await minio.listBuckets()

  const bucketsWithPolicy = await Promise.all(
    buckets.map(async (b) => ({
      name: b.name,
      createdAt: b.creationDate,
      isPublic: await isBucketPublic(b.name),
    }))
  )

  return bucketsWithPolicy
})
