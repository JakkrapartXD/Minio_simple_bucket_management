import { initializeElasticsearch } from '../lib/elasticsearch'

/**
 * Initialize Elasticsearch on server startup
 * This runs when the Nuxt server starts
 */
export default defineNitroPlugin(async () => {
    console.log('🚀 Initializing Elasticsearch...')

    // Wait a bit for Elasticsearch to be ready
    await new Promise(resolve => setTimeout(resolve, 2000))

    try {
        await initializeElasticsearch()
        console.log('✅ Elasticsearch initialized successfully')
    } catch (error) {
        console.error('❌ Failed to initialize Elasticsearch:', error)
        console.log('⚠️  Server will continue, but search functionality may not work')
    }
})
