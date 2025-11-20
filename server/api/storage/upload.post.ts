import { minio } from '../lib/minio'

export default defineEventHandler(async (event) => {
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

    // รับ path จาก HTML input folder
    // file.filename ตัวอย่าง: "images/2024/test1.jpg"
    // prefix (optional) เช่น "uploads/"
    const objectName = prefix + file.filename

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
