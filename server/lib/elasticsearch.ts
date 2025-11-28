import { Client } from '@elastic/elasticsearch'

// Initialize Elasticsearch client
export const esClient = new Client({
    node: process.env.ELASTICSEARCH_URL || 'http://localhost:9200',
})

const INDEX_NAME = 'files'
const PIPELINE_NAME = 'attachment'

/**
 * Initialize Elasticsearch index and attachment pipeline
 */
export async function initializeElasticsearch() {
    try {
        // Check if Elasticsearch is available
        await esClient.ping()
        console.log('✅ Elasticsearch connected')

        // Create attachment pipeline if it doesn't exist
        const pipelineExists = await esClient.ingest.getPipeline({
            id: PIPELINE_NAME,
        }).catch(() => null)

        if (!pipelineExists) {
            await esClient.ingest.putPipeline({
                id: PIPELINE_NAME,
                description: 'Extract attachment information',
                processors: [
                    {
                        attachment: {
                            field: 'data',
                            target_field: 'attachment',
                            indexed_chars: -1, // Index all characters
                            ignore_missing: true,
                        },
                    },
                    {
                        remove: {
                            field: 'data', // Remove base64 data after processing
                            ignore_missing: true,
                        },
                    },
                ],
            } as any)
            console.log('✅ Attachment pipeline created')
        }

        // Create index with mappings if it doesn't exist
        const indexExists = await esClient.indices.exists({ index: INDEX_NAME })

        if (!indexExists) {
            await esClient.indices.create({
                index: INDEX_NAME,
                settings: {
                    number_of_shards: 1,
                    number_of_replicas: 0,
                    default_pipeline: PIPELINE_NAME,
                },
                mappings: {
                    properties: {
                        bucket: { type: 'keyword' },
                        objectKey: { type: 'keyword' },
                        fileName: { type: 'text' },
                        filePath: { type: 'text' },
                        size: { type: 'long' },
                        contentType: { type: 'keyword' },
                        uploadedAt: { type: 'date' },
                        data: { type: 'text', index: false }, // Base64 data (will be removed by pipeline)
                        attachment: {
                            properties: {
                                content: { type: 'text' },
                                title: { type: 'text' },
                                author: { type: 'text' },
                                keywords: { type: 'text' },
                                date: { type: 'date' },
                                content_type: { type: 'text' },
                                content_length: { type: 'long' },
                                language: { type: 'keyword' },
                            },
                        },
                    },
                },
            })
            console.log('✅ Files index created')
        }

        return true
    } catch (error) {
        console.error('❌ Elasticsearch initialization error:', error)
        return false
    }
}

/**
 * Search files by query
 */
export async function searchFiles(query: string, page = 1, size = 10) {
    try {
        const from = (page - 1) * size

        const result = await esClient.search({
            index: INDEX_NAME,
            from,
            size,
            query: {
                multi_match: {
                    query,
                    fields: ['fileName^3', 'filePath^2', 'attachment.content', 'attachment.title^2'],
                    type: 'best_fields',
                    fuzziness: 'AUTO',
                },
            },
            highlight: {
                fields: {
                    fileName: {},
                    'attachment.content': {
                        fragment_size: 150,
                        number_of_fragments: 2,
                    },
                },
            },
            sort: [
                '_score',
                { uploadedAt: { order: 'desc' } },
            ],
        })

        return {
            total: typeof result.hits.total === 'object' ? result.hits.total.value : result.hits.total,
            hits: result.hits.hits.map((hit: any) => ({
                id: hit._id,
                score: hit._score,
                ...hit._source,
                highlights: hit.highlight,
            })),
        }
    } catch (error) {
        console.error('Search error:', error)
        throw error
    }
}

/**
 * Delete file from index
 */
export async function deleteFileFromIndex(bucket: string, objectKey: string) {
    try {
        await esClient.deleteByQuery({
            index: INDEX_NAME,
            query: {
                bool: {
                    must: [
                        { term: { bucket } },
                        { term: { objectKey } },
                    ],
                },
            },
        })
        console.log(`✅ Deleted from index: ${bucket}/${objectKey}`)
    } catch (error) {
        console.error('Delete from index error:', error)
    }
}

export { INDEX_NAME, PIPELINE_NAME }
