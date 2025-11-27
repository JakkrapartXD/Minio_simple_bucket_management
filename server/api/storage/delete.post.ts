import { minio } from '../lib/minio'
import { requireAdmin } from '../../lib/auth'

export default defineEventHandler(async (event) => {
  // Only admin can delete objects
  await requireAdmin(event)

  const body = await readBody(event)
  const bucket = body.bucket
  const name = body.name

  if (!bucket || !name) {
    throw createError({ statusCode: 400, statusMessage: "bucket and name required" })
  }

  // ถ้าลบโฟลเดอร์
  if (name.endsWith('/')) {
    const objectsToRemove: string[] = []
    const stream = minio.listObjectsV2(bucket, name, true)

    for await (const obj of stream as unknown as AsyncIterable<any>) {
      objectsToRemove.push(obj.name)
    }

    if (objectsToRemove.length) {
      await minio.removeObjects(bucket, objectsToRemove)
    }

    return { ok: true, removed: objectsToRemove }
  }

  // ถ้าลบไฟล์เดี่ยว
  await minio.removeObject(bucket, name)
  return { ok: true, removed: [name] }
})
