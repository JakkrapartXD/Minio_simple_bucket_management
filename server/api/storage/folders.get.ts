import { minio } from '../lib/minio'

export default defineEventHandler(async (event) => {
    const query = getQuery(event)
    const bucket = typeof query.bucket === 'string' ? query.bucket : undefined
    const prefix = typeof query.prefix === 'string' ? query.prefix : ''

  if (!bucket) {
    throw createError({ statusCode: 400, statusMessage: 'bucket required' })
  }

  const folders = new Set<string>()
  const stream = minio.listObjectsV2(bucket, prefix, false)

  for await (const obj of stream as unknown as AsyncIterable<any>) {
    if (obj.prefix) {
      folders.add(obj.prefix)
    } else {
      // extract folder part
      const path = obj.name.replace(prefix, '')
      const folder = path.split('/')[0]

      if (folder && path.includes('/')) {
        folders.add(prefix + folder + '/')
      }
    }
  }

  return {
    bucket,
    prefix,
    folders: Array.from(folders)
  }
})
