// https://nuxt.com/docs/api/configuration/nuxt-config
const env = import.meta.env as Record<string, string | undefined>

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: ['@nuxtjs/tailwindcss'],
  runtimeConfig: {
    MINIO_ENDPOINT: env.MINIO_ENDPOINT ?? '127.0.0.1',
    MINIO_PORT: env.MINIO_PORT ?? '9000',
    MINIO_ACCESS_KEY: env.MINIO_ACCESS_KEY ?? '',
    MINIO_SECRET_KEY: env.MINIO_SECRET_KEY ?? '',
    public: {
      minioPreviewBase: env.MINIO_PREVIEW_BASE ?? '',
    },
  },
})