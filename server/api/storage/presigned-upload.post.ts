import { minio } from '../lib/minio'
import { requireAdmin } from '../../lib/auth'

/**
 * Generate presigned URL for file upload
 * POST /api/storage/presigned-upload
 * Body: { bucket: string, objectKey: string, contentType?: string }
 */
export default defineEventHandler(async (event) => {
    // Only admin can upload files
    await requireAdmin(event)

    const body = await readBody(event)
    const { bucket, objectKey, contentType } = body

    if (!bucket || !objectKey) {
        throw createError({
            statusCode: 400,
            statusMessage: 'bucket and objectKey are required',
        })
    }

    try {
        // Generate presigned URL for PUT operation (15 minutes expiration)
        const presignedUrl = await minio.presignedPutObject(
            bucket,
            objectKey,
            15 * 60, // 15 minutes
        )

        return {
            ok: true,
            presignedUrl,
            bucket,
            objectKey,
            expiresIn: 900, // seconds
        }
    } catch (error: any) {
        console.error('Failed to generate presigned URL:', error)
        throw createError({
            statusCode: 500,
            statusMessage: error.message || 'Failed to generate presigned URL',
        })
    }
})
