import { minio } from '../lib/minio'
import { requireAdmin } from '../../lib/auth'

export default defineEventHandler(async (event) => {
  // Only admin can upload files
  await requireAdmin(event)

  const form = await readMultipartFormData(event)
  const bucket = getQuery(event).bucket as string
  const prefix = (getQuery(event).prefix as string) || ''

  if (!bucket) {
    throw createError({ statusCode: 400, statusMessage: "bucket required" })
  }

  if (!form?.length) {
    throw createError({ statusCode: 400, statusMessage: "No files uploaded" })
  }

  const results: any[] = []

  for (const file of form) {
    if (!file.filename) {
      continue // Skip if no filename
    }

    // รับ path จาก HTML input folder
    // file.filename ตัวอย่าง: "images/2024/test1.jpg" หรือ "folder1/ของ1.txt"
    // prefix (optional) เช่น "uploads/"
    // รองรับการอัพโหลดโฟลเดอร์ - filename จะมี path แบบ relative เช่น "folder1/ของ1.txt"
    let objectName = file.filename

    // Normalize path separators (handle both / and \)
    objectName = objectName.replace(/\\/g, '/')

    // Remove leading slash if present
    if (objectName.startsWith('/')) {
      objectName = objectName.substring(1)
    }

    // Combine with prefix
    objectName = prefix + objectName

    await minio.putObject(
      bucket,
      objectName,
      file.data,
      file.data.length,
      { 'Content-Type': file.type || 'application/octet-stream' }
    )

    results.push({ name: objectName })
  }

  return { ok: true, uploaded: results }
})
