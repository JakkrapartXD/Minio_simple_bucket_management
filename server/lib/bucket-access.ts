import { minio } from '../api/lib/minio'

export async function isBucketPublic(bucketName: string): Promise<boolean> {
  try {
    const policy = await minio.getBucketPolicy(bucketName)

    if (!policy) {
      return false // No policy means private
    }

    try {
      const policyJson = JSON.parse(policy)

      // Check if it's public read (Allow with Principal AWS = *)
      const hasPublicReadStatement = policyJson.Statement?.some((stmt: any) =>
        stmt.Effect === 'Allow' &&
        stmt.Principal?.AWS === '*' &&
        !stmt.Condition
      )

      return hasPublicReadStatement || false
    } catch (e) {
      return false
    }
  } catch (error: any) {
    // If bucket doesn't exist or policy doesn't exist, assume private
    return false
  }
}

export async function checkBucketAccess(bucketName: string, userRole: string): Promise<boolean> {
  // All authenticated users can view/read all buckets
  // Access control for write operations (upload, delete, share) is handled by requireAdmin
  return true
}

