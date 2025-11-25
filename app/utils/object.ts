/**
 * Utility functions for object name manipulation
 */

/**
 * แสดงชื่อ object โดยลบ prefix ออก
 */
export function objectDisplayName(name: string | undefined, prefix: string): string {
  if (!name) return ''
  return name.replace(prefix, '')
}

