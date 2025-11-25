import { minio } from '../lib/minio'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const bucket = typeof query.bucket === 'string' ? query.bucket : undefined

  if (!bucket) {
    throw createError({ statusCode: 400, statusMessage: 'bucket required' })
  }

  try {
    // Check if bucket exists
    const exists = await minio.bucketExists(bucket)
    if (!exists) {
      throw createError({
        statusCode: 404,
        statusMessage: `Bucket "${bucket}" does not exist`
      })
    }

    // Count objects in bucket
    let objectCount = 0
    const stream = minio.listObjectsV2(bucket, '', true) // true = recursive

    for await (const obj of stream as unknown as AsyncIterable<any>) {
      if (obj.name && obj.size > 0) {
        objectCount++
      }
    }

    return {
      bucket,
      objectCount
    }
  } catch (error: any) {
    if (error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Failed to get bucket stats'
    })
  }
})

