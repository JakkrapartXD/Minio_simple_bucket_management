import * as Minio from "minio";

/**
 * Creates MinIO client using root/admin credentials (store/Store141213)
 * All API calls use these credentials regardless of user role.
 * Access control is handled by the application layer (checkBucketAccess, requireAdmin, etc.)
 */
function createMinioClient() {
  const config = useRuntimeConfig()
  
  const endPoint = config.MINIO_ENDPOINT || '127.0.0.1'
  const port = Number(config.MINIO_PORT || '9005') // Default matches compose.yaml port mapping (9005:9000)
  const accessKey = config.MINIO_ACCESS_KEY || 'store'
  const secretKey = config.MINIO_SECRET_KEY || 'Store141213'
  
  // Validate credentials (should have defaults from nuxt.config.ts, but double-check)
  if (!accessKey || !secretKey) {
    throw new Error(
      'MinIO credentials are not configured. Please set MINIO_ACCESS_KEY and MINIO_SECRET_KEY (or MINIO_ROOT_USER and MINIO_ROOT_PASSWORD) in your .env file.\n' +
      'Based on your compose.yaml, the default credentials are:\n' +
      'MINIO_ACCESS_KEY=store\n' +
      'MINIO_SECRET_KEY=Store141213\n' +
      'MINIO_PORT=9005'
    )
  }
  
  return new Minio.Client({
    endPoint,
    port,
    useSSL: false,
    accessKey,
    secretKey,
  })
}

export const minio = createMinioClient()
