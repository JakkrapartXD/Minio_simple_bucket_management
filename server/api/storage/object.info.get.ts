import { minio } from '../lib/minio'
import { requireAuth } from '../../lib/auth'

export default defineEventHandler(async (event) => {
  // All authenticated users can view object info
  await requireAuth(event)

  const query = getQuery(event)
  const bucket = typeof query.bucket === 'string' ? query.bucket : undefined
  const objectName = typeof query.objectName === 'string' ? query.objectName : undefined

  if (!bucket || !objectName) {
    throw createError({ statusCode: 400, statusMessage: 'bucket and objectName required' })
  }

  try {
    const stat = await minio.statObject(bucket, objectName)

    // Get object tags if available
    let tags: any = {}
    try {
      tags = await minio.getObjectTagging(bucket, objectName)
    } catch (e) {
      // Tags might not be available, ignore error
    }

    return {
      name: objectName,
      size: stat.size,
      lastModified: stat.lastModified,
      etag: stat.etag,
      contentType: stat.metaData?.['content-type'] || stat.metaData?.['Content-Type'] || 'binary/octet-stream',
      metadata: stat.metaData || {},
      tags: tags || {},
    }
  } catch (error: any) {
    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Failed to get object info'
    })
  }
})

