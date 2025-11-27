// https://nuxt.com/docs/api/configuration/nuxt-config
const env = import.meta.env as Record<string, string | undefined>

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: ['@nuxtjs/tailwindcss', '@nuxt/icon'],
  app: {
    head: {
      title: 'MINIO OBJECT STORE',
      meta: [
        { name: 'description', content: 'MinIO Object Storage Management' }
      ]
    }
  },
  runtimeConfig: {
    MINIO_ENDPOINT: env.MINIO_ENDPOINT ?? '127.0.0.1',
    MINIO_PORT: env.MINIO_PORT ?? '9005', // Default matches compose.yaml port mapping
    // Support both MINIO_ACCESS_KEY/SECRET_KEY and MINIO_ROOT_USER/PASSWORD
    // Priority: MINIO_ACCESS_KEY > MINIO_ROOT_USER > default from compose.yaml
    MINIO_ACCESS_KEY: env.MINIO_ACCESS_KEY ?? env.MINIO_ROOT_USER ?? 'store',
    MINIO_SECRET_KEY: env.MINIO_SECRET_KEY ?? env.MINIO_ROOT_PASSWORD ?? 'Store141213',
    public: {
      minioPreviewBase: env.MINIO_PREVIEW_BASE ?? '',
    },
  },
})
