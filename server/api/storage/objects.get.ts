import { minio } from '../lib/minio'
import { requireAuth } from '../../lib/auth'

export default defineEventHandler(async (event) => {
  // All authenticated users can view objects
  await requireAuth(event)

  const query = getQuery(event)
  const bucket = typeof query.bucket === 'string' ? query.bucket : undefined
  const prefix = typeof query.prefix === 'string' ? query.prefix : ''

  if (!bucket) {
    throw createError({ statusCode: 400, statusMessage: 'bucket required' })
  }

  const objects: any[] = []
  const stream = minio.listObjectsV2(bucket, prefix, false)  // false = ใช้ prefix แบบ folder view

  for await (const obj of stream as unknown as AsyncIterable<any>) {
    // Filter เอา objects ที่ไม่มี name หรือ size เป็น 0 ออก
    if (obj.name && obj.size > 0) {
      objects.push({
        name: obj.name,
        size: obj.size,
        lastModified: obj.lastModified,
      })
    }
  }

  return { bucket, prefix, objects }
})
