import { minio } from '../lib/minio'

/**
 * Generate bucket policy JSON string based on policy type
 */
function generateBucketPolicy(bucketName: string, policyType: string): string {
  const bucketArn = `arn:aws:s3:::${bucketName}`
  const bucketResource = `${bucketArn}/*`

  switch (policyType) {
    case 'private':
      // Private: Deny all access
      return JSON.stringify({
        Version: '2012-10-17',
        Statement: [{
          Effect: 'Deny',
          Principal: { AWS: ['*'] },
          Action: ['s3:GetObject'],
          Resource: [bucketResource]
        }]
      })

    case 'public-read':
      // Public Read: Allow anyone to read
      return JSON.stringify({
        Version: '2012-10-17',
        Statement: [{
          Effect: 'Allow',
          Principal: { AWS: ['*'] },
          Action: ['s3:GetObject'],
          Resource: [bucketResource]
        }]
      })

    case 'authenticated-read':
      // Authenticated Read: Allow authenticated users to read
      return JSON.stringify({
        Version: '2012-10-17',
        Statement: [{
          Effect: 'Allow',
          Principal: { AWS: ['*'] },
          Action: ['s3:GetObject'],
          Resource: [bucketResource],
          Condition: {
            StringEquals: {
              's3:authType': 'REST-QUERY-STRING'
            }
          }
        }]
      })

    default:
      throw new Error('Invalid policy type')
  }
}

import { requireAdmin } from '../../lib/auth'

export default defineEventHandler(async (event) => {
  // Only admins can set bucket policies
  await requireAdmin(event)

  const body = await readBody<{ bucket?: string; policy?: string }>(event)
  const bucket = body?.bucket
  const policyType = body?.policy

  if (!bucket || !policyType) {
    throw createError({ 
      statusCode: 400, 
      statusMessage: 'bucket and policy required' 
    })
  }

  // Validate policy type
  const validPolicyTypes = ['private', 'public-read', 'authenticated-read']
  if (!validPolicyTypes.includes(policyType)) {
    throw createError({ 
      statusCode: 400, 
      statusMessage: `Invalid policy type. Must be one of: ${validPolicyTypes.join(', ')}` 
    })
  }

  try {
    // Generate policy JSON
    const policyJson = generateBucketPolicy(bucket, policyType)
    
    // Set bucket policy
    await minio.setBucketPolicy(bucket, policyJson)
    
    return { 
      ok: true, 
      bucket, 
      policy: policyType,
      message: `Bucket policy set to ${policyType}`
    }
  } catch (error: any) {
    // Check if bucket exists
    try {
      await minio.bucketExists(bucket)
    } catch (existsError) {
      throw createError({
        statusCode: 404,
        statusMessage: `Bucket "${bucket}" does not exist`
      })
    }

    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Failed to set bucket policy'
    })
  }
})

