// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: ['@nuxt/ui', '@nuxt/image'],
  runtimeConfig: {
    MINIO_ENDPOINT: import.meta.env.MINIO_ENDPOINT ?? '127.0.0.1',
    MINIO_PORT: import.meta.env.MINIO_PORT ?? '9000',
    MINIO_ACCESS_KEY: import.meta.env.MINIO_ACCESS_KEY ?? '',
    MINIO_SECRET_KEY: import.meta.env.MINIO_SECRET_KEY ?? '',
    },
})