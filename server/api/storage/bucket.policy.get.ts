import { minio } from '../lib/minio'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const bucket = typeof query.bucket === 'string' ? query.bucket : undefined

  if (!bucket) {
    throw createError({ statusCode: 400, statusMessage: 'bucket required' })
  }

  try {
    const policy = await minio.getBucketPolicy(bucket)
    
    // Parse policy JSON to determine policy type
    let policyType: 'private' | 'public-read' | 'authenticated-read' | 'custom' | null = null
    
    if (policy) {
      try {
        const policyJson = JSON.parse(policy)
        
        // Check if it's a deny policy (private)
        if (policyJson.Statement?.some((stmt: any) => stmt.Effect === 'Deny')) {
          policyType = 'private'
        }
        // Check if it's public read
        else if (policyJson.Statement?.some((stmt: any) => 
          stmt.Effect === 'Allow' && 
          stmt.Principal?.AWS === '*' &&
          !stmt.Condition
        )) {
          policyType = 'public-read'
        }
        // Check if it's authenticated read
        else if (policyJson.Statement?.some((stmt: any) => 
          stmt.Effect === 'Allow' && 
          stmt.Condition
        )) {
          policyType = 'authenticated-read'
        } else {
          policyType = 'custom'
        }
      } catch (e) {
        // If can't parse, return as custom
        policyType = 'custom'
      }
    }
    
    return { 
      bucket, 
      policy: policy || null,
      policyType: policyType || 'private'
    }
  } catch (error: any) {
    // If bucket doesn't exist or policy doesn't exist, return private as default
    if (error.code === 'NoSuchBucket' || error.code === 'NoSuchBucketPolicy') {
      return { bucket, policy: null, policyType: 'private' }
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Failed to get bucket policy'
    })
  }
})

