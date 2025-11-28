import { indexFile } from '../../lib/file-indexer'

/**
 * MinIO webhook receiver for upload events
 * POST /api/webhook/minio-upload
 * 
 * MinIO sends S3 event notifications when objects are created
 */
export default defineEventHandler(async (event) => {
    const timestamp = new Date().toISOString()

    try {
        const body = await readBody(event)

        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
        console.log(`📨 [${timestamp}] MinIO Webhook Received!`)
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
        console.log('📦 Webhook Payload:', JSON.stringify(body, null, 2))
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

        // MinIO webhook payload structure:
        // {
        //   EventName: "s3:ObjectCreated:Put",
        //   Key: "bucket-name/path/to/file.txt",
        //   Records: [...]
        // }

        // Handle both direct webhook format and S3 event format
        const records = body.Records || []

        if (records.length === 0) {
            // Try alternative format
            if (body.EventName && body.Key) {
                const eventName = body.EventName
                const key = body.Key

                console.log(`📋 Event Type: ${eventName}`)
                console.log(`📁 Object Key: ${key}`)

                // Only process ObjectCreated events
                if (eventName.startsWith('s3:ObjectCreated:')) {
                    const parts = key.split('/')
                    const bucket = parts[0]
                    const objectKey = parts.slice(1).join('/')

                    if (bucket && objectKey) {
                        console.log(`🗂️  Bucket: ${bucket}`)
                        console.log(`📄 File: ${objectKey}`)
                        console.log(`🔄 Starting file indexing...`)

                        // Index the file asynchronously
                        indexFile(bucket, objectKey)
                            .then(() => {
                                console.log(`✅ [${new Date().toISOString()}] Successfully indexed: ${bucket}/${objectKey}`)
                            })
                            .catch(err => {
                                console.error(`❌ [${new Date().toISOString()}] Failed to index: ${bucket}/${objectKey}`)
                                console.error('Error details:', err)
                            })
                    } else {
                        console.warn('⚠️  Invalid bucket or object key')
                    }
                } else {
                    console.log(`ℹ️  Skipping non-creation event: ${eventName}`)
                }
            } else {
                console.warn('⚠️  No valid event data found in webhook payload')
            }

            return { ok: true, message: 'Webhook received' }
        }

        // Process S3 event records
        console.log(`📊 Processing ${records.length} event record(s)...`)

        for (const record of records) {
            const eventName = record.eventName
            const bucket = record.s3?.bucket?.name
            // Decode URL-encoded object key (handles Thai characters, spaces, etc.)
            // Replace + with space first, then decode
            const objectKey = record.s3?.object?.key
                ? decodeURIComponent(record.s3.object.key.replace(/\+/g, ' '))
                : undefined

            console.log(`\n📋 Event: ${eventName}`)
            console.log(`🗂️  Bucket: ${bucket}`)
            console.log(`📄 Object: ${objectKey}`)

            // Only process ObjectCreated events
            if (eventName?.startsWith('s3:ObjectCreated:') && bucket && objectKey) {
                console.log(`🔄 Starting file indexing for: ${bucket}/${objectKey}`)

                // Index the file asynchronously (don't block webhook response)
                indexFile(bucket, objectKey)
                    .then(() => {
                        console.log(`✅ [${new Date().toISOString()}] Successfully indexed: ${bucket}/${objectKey}`)
                    })
                    .catch(err => {
                        console.error(`❌ [${new Date().toISOString()}] Failed to index: ${bucket}/${objectKey}`)
                        console.error('Error details:', err)
                    })
            } else {
                console.log(`ℹ️  Skipping event (not ObjectCreated or missing data)`)
            }
        }

        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
        console.log(`✅ Webhook processing complete`)
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

        return { ok: true, message: 'Webhook processed', recordsProcessed: records.length }
    } catch (error: any) {
        console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
        console.error(`❌ [${timestamp}] Webhook processing error:`)
        console.error(error)
        console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

        // Return 200 even on error to prevent MinIO from retrying
        return { ok: false, error: error.message }
    }
})
