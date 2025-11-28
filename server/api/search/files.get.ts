import { requireAuth } from '../../lib/auth'
import { searchFiles } from '../../lib/elasticsearch'

/**
 * Search files in Elasticsearch
 * GET /api/search/files?q=query&page=1&size=10
 */
export default defineEventHandler(async (event) => {
    // Require authentication (all authenticated users can search)
    await requireAuth(event)

    const query = getQuery(event)
    const q = (query.q as string) || ''
    const page = parseInt((query.page as string) || '1', 10)
    const size = parseInt((query.size as string) || '10', 10)

    if (!q || q.trim().length === 0) {
        return {
            total: 0,
            hits: [],
            page,
            size,
        }
    }

    try {
        const results = await searchFiles(q.trim(), page, size)

        return {
            total: results.total || 0,
            hits: results.hits,
            page,
            size,
            totalPages: Math.ceil((results.total || 0) / size),
        }
    } catch (error: any) {
        console.error('Search error:', error)
        throw createError({
            statusCode: 500,
            statusMessage: error.message || 'Search failed',
        })
    }
})
