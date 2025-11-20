import * as Minio from "minio";
const config = useRuntimeConfig()
export const minio = new Minio.Client({
  endPoint: config.MINIO_ENDPOINT!,
  port: Number(config.MINIO_PORT!),
  useSSL: false,
  accessKey: config.MINIO_ACCESS_KEY!,
  secretKey: config.MINIO_SECRET_KEY!,
})
