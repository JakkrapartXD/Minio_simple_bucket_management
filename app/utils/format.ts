/**
 * Utility functions for formatting data
 */

/**
 * แปลงขนาดไฟล์เป็นรูปแบบที่อ่านง่าย
 */
export function formatSize(size: number): string {
  if (size < 1024) return `${size} B`
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`
  if (size < 1024 * 1024 * 1024) return `${(size / (1024 * 1024)).toFixed(1)} MB`
  return `${(size / (1024 * 1024 * 1024)).toFixed(1)} GB`
}

/**
 * แปลงวันที่เป็นรูปแบบที่อ่านง่าย
 */
export function formatDate(value: string | Date): string {
  return new Date(value).toLocaleString()
}

