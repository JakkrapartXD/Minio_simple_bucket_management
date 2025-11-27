import { minio } from '../lib/minio'
import { Readable } from 'stream'
import { requireAuth } from '../../lib/auth'

export default defineEventHandler(async (event) => {
  // All authenticated users can download files
  await requireAuth(event)

  const query = getQuery(event)
  const bucket = typeof query.bucket === 'string' ? query.bucket : undefined
  const objectName = typeof query.objectName === 'string' ? query.objectName : undefined

  if (!bucket || !objectName) {
    throw createError({ statusCode: 400, statusMessage: 'bucket and objectName required' })
  }

  try {
    // Get object metadata for content-type
    const stat = await minio.statObject(bucket, objectName)
    const contentType = stat.metaData?.['content-type'] || stat.metaData?.['Content-Type'] || 'application/octet-stream'

    // Extract filename from object name
    const filename = objectName.split('/').pop() || 'download'

    // Get object as buffer
    const dataStream = await minio.getObject(bucket, objectName)
    const chunks: Buffer[] = []

    for await (const chunk of dataStream) {
      chunks.push(Buffer.from(chunk))
    }

    const buffer = Buffer.concat(chunks)

    setHeader(event, 'Content-Type', contentType)
    setHeader(event, 'Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`)
    setHeader(event, 'Content-Length', buffer.length)

    return buffer
  } catch (error: any) {
    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Failed to download object'
    })
  }
})

