import { minio } from '../lib/minio'
import { requireAdmin } from '../../lib/auth'

export default defineEventHandler(async (event) => {
  // Only admin can generate share links
  await requireAdmin(event)

  const query = getQuery(event)
  const bucket = typeof query.bucket === 'string' ? query.bucket : undefined
  const objectName = typeof query.objectName === 'string' ? query.objectName : undefined
  const expiresIn = query.expiresIn
    ? parseInt(typeof query.expiresIn === 'string' ? query.expiresIn : String(query.expiresIn), 10)
    : 24 * 60 * 60 // Default: 24 hours in seconds

  if (!bucket || !objectName) {
    throw createError({
      statusCode: 400,
      statusMessage: 'bucket and objectName are required'
    })
  }

  if (expiresIn <= 0 || expiresIn > 7 * 24 * 60 * 60) {
    throw createError({
      statusCode: 400,
      statusMessage: 'expiresIn must be between 1 second and 7 days (604800 seconds)'
    })
  }

  try {
    // ตรวจสอบว่า object มีอยู่จริงหรือไม่
    await minio.statObject(bucket, objectName)

    // สร้าง presigned URL
    const signedUrl = await minio.presignedGetObject(bucket, objectName, expiresIn)

    // คำนวณ expiration date
    const expirationDate = new Date()
    expirationDate.setSeconds(expirationDate.getSeconds() + expiresIn)

    return {
      url: signedUrl,
      bucket,
      objectName,
      expiresIn,
      expiresAt: expirationDate.toISOString(),
      expiresAtFormatted: expirationDate.toLocaleString(),
    }
  } catch (error: any) {
    if (error.code === 'NoSuchKey' || error.code === 'NotFound') {
      throw createError({
        statusCode: 404,
        statusMessage: `Object '${objectName}' not found in bucket '${bucket}'`
      })
    }
    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Failed to generate share URL'
    })
  }
})

