import { minio } from '../api/lib/minio'
import { esClient, INDEX_NAME, PIPELINE_NAME } from './elasticsearch'
import { Readable } from 'stream'

const MAX_BASE64_SIZE = 10 * 1024 * 1024 // 10MB threshold

/**
 * Convert stream to buffer
 */
async function streamToBuffer(stream: Readable): Promise<Buffer> {
    const chunks: Buffer[] = []
    for await (const chunk of stream) {
        chunks.push(Buffer.from(chunk))
    }
    return Buffer.concat(chunks)
}

/**
 * Index a file in Elasticsearch
 */
export async function indexFile(bucket: string, objectKey: string) {
    const startTime = Date.now()

    try {
        console.log(`\n┌─────────────────────────────────────────────────────────`)
        console.log(`│ 📄 Starting file indexing`)
        console.log(`│ Bucket: ${bucket}`)
        console.log(`│ Object: ${objectKey}`)
        console.log(`└─────────────────────────────────────────────────────────`)

        // Get object metadata
        console.log(`🔍 Fetching file metadata from MinIO...`)
        const stat = await minio.statObject(bucket, objectKey)
        const fileSize = stat.size
        const contentType = stat.metaData?.['content-type'] || 'application/octet-stream'

        console.log(`📊 File Info:`)
        console.log(`   - Size: ${(fileSize / 1024).toFixed(2)} KB`)
        console.log(`   - Content-Type: ${contentType}`)

        // Get file stream
        console.log(`📥 Downloading file from MinIO...`)
        const stream = await minio.getObject(bucket, objectKey)
        const buffer = await streamToBuffer(stream)
        console.log(`✅ File downloaded successfully`)

        // Extract file name and path
        const fileName = objectKey.split('/').pop() || objectKey
        const filePath = objectKey

        // Prepare document
        const document: any = {
            bucket,
            objectKey,
            fileName,
            filePath,
            size: fileSize,
            contentType,
            uploadedAt: new Date().toISOString(),
        }

        // Determine if we should use attachment processor
        const shouldExtractContent = shouldExtractFileContent(contentType, fileSize)

        if (shouldExtractContent && fileSize <= MAX_BASE64_SIZE) {
            // Use base64 encoding for small files with attachment processor
            console.log(`🔄 Encoding file to base64...`)
            document.data = buffer.toString('base64')
            console.log(`✅ File encoded (${(document.data.length / 1024).toFixed(2)} KB base64)`)

            console.log(`📤 Indexing to Elasticsearch with attachment processor...`)
            const response = await esClient.index({
                index: INDEX_NAME,
                id: `${bucket}:${objectKey}`,
                pipeline: PIPELINE_NAME,
                body: document,
            })

            const duration = Date.now() - startTime
            console.log(`✅ Successfully indexed with content extraction`)
            console.log(`   - Index: ${INDEX_NAME}`)
            console.log(`   - Document ID: ${bucket}:${objectKey}`)
            console.log(`   - Result: ${response.result}`)
            console.log(`   - Duration: ${duration}ms`)
        } else {
            // ไฟล์ขนาดใหญ่เกินไม่ให้ upload content
            const reason = fileSize > MAX_BASE64_SIZE
                ? `File too large (${(fileSize / 1024 / 1024).toFixed(2)} MB > 10 MB)`
                : `Content type not extractable (${contentType})`

            console.log(`ℹ️  Indexing metadata only: ${reason}`)
            console.log(`📤 Indexing to Elasticsearch...`)

            const response = await esClient.index({
                index: INDEX_NAME,
                id: `${bucket}:${objectKey}`,
                body: document,
            })

            const duration = Date.now() - startTime
            console.log(`✅ Successfully indexed (metadata only)`)
            console.log(`   - Index: ${INDEX_NAME}`)
            console.log(`   - Document ID: ${bucket}:${objectKey}`)
            console.log(`   - Result: ${response.result}`)
            console.log(`   - Duration: ${duration}ms`)
        }

        console.log(`└─────────────────────────────────────────────────────────\n`)
        return true
    } catch (error) {
        const duration = Date.now() - startTime
        console.error(`\n┌─────────────────────────────────────────────────────────`)
        console.error(`│ ❌ Failed to index file`)
        console.error(`│ Bucket: ${bucket}`)
        console.error(`│ Object: ${objectKey}`)
        console.error(`│ Duration: ${duration}ms`)
        console.error(`└─────────────────────────────────────────────────────────`)
        console.error(`Error details:`, error)
        console.error(`└─────────────────────────────────────────────────────────\n`)
        throw error
    }
}

/**
 * Determine if file content should be extracted
 */
function shouldExtractFileContent(contentType: string, fileSize: number): boolean {
    // Don't extract if file is too large
    if (fileSize > MAX_BASE64_SIZE) {
        return false
    }

    // List of content types that can be extracted
    const extractableTypes = [
        'text/',
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'application/rtf',
        'application/json',
        'application/xml',
    ]

    return extractableTypes.some(type => contentType.startsWith(type))
}

/**
 * Re-index all files in a bucket
 */
export async function reindexBucket(bucket: string) {
    try {
        console.log(`🔄 Re-indexing bucket: ${bucket}`)

        const stream = minio.listObjectsV2(bucket, '', true)
        let count = 0

        for await (const obj of stream) {
            if (obj.name) {
                await indexFile(bucket, obj.name)
                count++
            }
        }

        console.log(`✅ Re-indexed ${count} files from bucket: ${bucket}`)
        return count
    } catch (error) {
        console.error(`❌ Failed to re-index bucket ${bucket}:`, error)
        throw error
    }
}
