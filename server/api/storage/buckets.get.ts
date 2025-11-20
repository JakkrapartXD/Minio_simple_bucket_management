import { minio } from '../lib/minio'

export default defineEventHandler(async () => {
  const buckets = await minio.listBuckets()

  return buckets.map(b => ({
    name: b.name,
    createdAt: b.creationDate
  }))
})
