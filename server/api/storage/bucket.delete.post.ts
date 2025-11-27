import { minio } from '../lib/minio'
import { requireAdmin } from '../../lib/auth'

export default defineEventHandler(async (event) => {
  // Only admins can delete buckets
  await requireAdmin(event)

  const body = await readBody<{ bucket?: string }>(event)
  const bucket = body?.bucket

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

    // List all objects in the bucket to delete them first
    // MinIO requires bucket to be empty before deletion
    const objectsToRemove: string[] = []
    const stream = minio.listObjectsV2(bucket, '', true) // true = recursive

    for await (const obj of stream as unknown as AsyncIterable<any>) {
      if (obj.name) {
        objectsToRemove.push(obj.name)
      }
    }

    // Delete all objects if any exist
    if (objectsToRemove.length > 0) {
      await minio.removeObjects(bucket, objectsToRemove)
    }

    // Delete the bucket
    await minio.removeBucket(bucket)

    return {
      ok: true,
      bucket,
      deletedObjects: objectsToRemove.length
    }
  } catch (error: any) {
    if (error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Failed to delete bucket'
    })
  }
})

