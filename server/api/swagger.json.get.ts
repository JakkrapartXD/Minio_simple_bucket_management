export default defineEventHandler(() => {
  return {
    openapi: '3.0.0',
    info: {
      title: 'MinIO Bucket Management API',
      version: '1.0.0',
      description: 'API documentation for MinIO Simple Bucket Management system',
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Development server',
      },
    ],
    paths: {
      '/api/storage/buckets': {
        get: {
          summary: 'List all buckets',
          description: 'Get a list of all buckets in MinIO',
          tags: ['Buckets'],
          responses: {
            '200': {
              description: 'List of buckets',
              content: {
                'application/json': {
                  schema: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        name: { type: 'string', example: 'my-bucket' },
                        createdAt: { type: 'string', format: 'date-time' },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      '/api/storage/bucket.create': {
        post: {
          summary: 'Create a new bucket',
          description: 'Create a new bucket in MinIO',
          tags: ['Buckets'],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['name'],
                  properties: {
                    name: { type: 'string', example: 'my-new-bucket' },
                  },
                },
              },
            },
          },
          responses: {
            '200': {
              description: 'Bucket created successfully',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      ok: { type: 'boolean', example: true },
                      name: { type: 'string', example: 'my-new-bucket' },
                    },
                  },
                },
              },
            },
            '400': {
              description: 'Bad request - bucket name required',
            },
          },
        },
      },
      '/api/storage/folders': {
        get: {
          summary: 'List folders in a bucket',
          description: 'Get a list of folders (prefixes) in a bucket',
          tags: ['Storage'],
          parameters: [
            {
              name: 'bucket',
              in: 'query',
              required: true,
              schema: { type: 'string' },
              description: 'Bucket name',
              example: 'my-bucket',
            },
            {
              name: 'prefix',
              in: 'query',
              required: false,
              schema: { type: 'string', default: '' },
              description: 'Prefix to filter folders',
              example: 'images/',
            },
          ],
          responses: {
            '200': {
              description: 'List of folders',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      bucket: { type: 'string' },
                      prefix: { type: 'string' },
                      folders: {
                        type: 'array',
                        items: { type: 'string' },
                        example: ['images/', 'documents/'],
                      },
                    },
                  },
                },
              },
            },
            '400': {
              description: 'Bad request - bucket required',
            },
          },
        },
      },
      '/api/storage/objects': {
        get: {
          summary: 'List objects in a bucket',
          description: 'Get a list of objects (files) in a bucket',
          tags: ['Storage'],
          parameters: [
            {
              name: 'bucket',
              in: 'query',
              required: true,
              schema: { type: 'string' },
              description: 'Bucket name',
              example: 'my-bucket',
            },
            {
              name: 'prefix',
              in: 'query',
              required: false,
              schema: { type: 'string', default: '' },
              description: 'Prefix to filter objects',
              example: 'images/',
            },
          ],
          responses: {
            '200': {
              description: 'List of objects',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      bucket: { type: 'string' },
                      prefix: { type: 'string' },
                      objects: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            name: { type: 'string', example: 'image.jpg' },
                            size: { type: 'integer', example: 1024 },
                            lastModified: { type: 'string', format: 'date-time' },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
            '400': {
              description: 'Bad request - bucket required',
            },
          },
        },
      },
      '/api/storage/object.info': {
        get: {
          summary: 'Get object metadata',
          description: 'Get detailed information about an object including metadata, tags, and retention policies',
          tags: ['Storage'],
          parameters: [
            {
              name: 'bucket',
              in: 'query',
              required: true,
              schema: { type: 'string' },
              description: 'Bucket name',
              example: 'my-bucket',
            },
            {
              name: 'objectName',
              in: 'query',
              required: true,
              schema: { type: 'string' },
              description: 'Object name (full path)',
              example: 'images/photo.jpg',
            },
          ],
          responses: {
            '200': {
              description: 'Object information',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      name: { type: 'string' },
                      size: { type: 'integer' },
                      lastModified: { type: 'string', format: 'date-time' },
                      etag: { type: 'string' },
                      contentType: { type: 'string', example: 'image/jpeg' },
                      metadata: { type: 'object' },
                      tags: { type: 'object' },
                      legalHold: { type: 'string', enum: ['ON', 'OFF'], example: 'OFF' },
                      retentionMode: { type: 'string', nullable: true },
                      retentionUntilDate: { type: 'string', format: 'date-time', nullable: true },
                    },
                  },
                },
              },
            },
            '400': {
              description: 'Bad request - bucket and objectName required',
            },
            '500': {
              description: 'Internal server error',
            },
          },
        },
      },
      '/api/storage/upload': {
        post: {
          summary: 'Upload files to a bucket',
          description: 'Upload one or more files to a bucket with optional prefix',
          tags: ['Storage'],
          parameters: [
            {
              name: 'bucket',
              in: 'query',
              required: true,
              schema: { type: 'string' },
              description: 'Bucket name',
              example: 'my-bucket',
            },
            {
              name: 'prefix',
              in: 'query',
              required: false,
              schema: { type: 'string', default: '' },
              description: 'Prefix for uploaded files',
              example: 'uploads/',
            },
          ],
          requestBody: {
            required: true,
            content: {
              'multipart/form-data': {
                schema: {
                  type: 'object',
                  properties: {
                    files: {
                      type: 'array',
                      items: { type: 'string', format: 'binary' },
                    },
                  },
                },
              },
            },
          },
          responses: {
            '200': {
              description: 'Files uploaded successfully',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      ok: { type: 'boolean', example: true },
                      uploaded: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            name: { type: 'string' },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
            '400': {
              description: 'Bad request - bucket required or no files uploaded',
            },
          },
        },
      },
      '/api/storage/delete': {
        post: {
          summary: 'Delete an object or folder',
          description: 'Delete a single object or all objects in a folder (prefix)',
          tags: ['Storage'],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['bucket', 'name'],
                  properties: {
                    bucket: { type: 'string', example: 'my-bucket' },
                    name: {
                      type: 'string',
                      description: 'Object name or folder path (end with / for folder)',
                      example: 'images/photo.jpg',
                    },
                  },
                },
              },
            },
          },
          responses: {
            '200': {
              description: 'Object(s) deleted successfully',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      ok: { type: 'boolean', example: true },
                      removed: {
                        type: 'array',
                        items: { type: 'string' },
                      },
                    },
                  },
                },
              },
            },
            '400': {
              description: 'Bad request - bucket and name required',
            },
          },
        },
      },
      '/api/storage/share': {
        get: {
          summary: 'Generate presigned URL for sharing object',
          description: 'Generate a presigned URL that allows temporary access to an object without authentication. The URL expires after the specified time.',
          tags: ['Storage'],
          parameters: [
            {
              name: 'bucket',
              in: 'query',
              required: true,
              schema: { type: 'string' },
              description: 'Bucket name',
              example: 'my-bucket',
            },
            {
              name: 'objectName',
              in: 'query',
              required: true,
              schema: { type: 'string' },
              description: 'Object name (file path)',
              example: 'images/photo.jpg',
            },
            {
              name: 'expiresIn',
              in: 'query',
              required: false,
              schema: { type: 'integer', default: 86400 },
              description: 'Expiration time in seconds (default: 86400 = 24 hours, max: 604800 = 7 days)',
              example: 86400,
            },
          ],
          responses: {
            '200': {
              description: 'Presigned URL generated successfully',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      url: {
                        type: 'string',
                        format: 'uri',
                        description: 'Presigned URL for accessing the object',
                        example: 'http://127.0.0.1:9000/my-bucket/images/photo.jpg?X-Amz-Algorithm=...',
                      },
                      bucket: { type: 'string', example: 'my-bucket' },
                      objectName: { type: 'string', example: 'images/photo.jpg' },
                      expiresIn: { type: 'integer', description: 'Expiration time in seconds', example: 86400 },
                      expiresAt: {
                        type: 'string',
                        format: 'date-time',
                        description: 'ISO 8601 timestamp when the URL expires',
                        example: '2025-11-24T13:10:53.587Z',
                      },
                      expiresAtFormatted: {
                        type: 'string',
                        description: 'Human-readable expiration date',
                        example: '11/24/2025, 1:10:53 PM',
                      },
                    },
                  },
                },
              },
            },
            '400': {
              description: 'Bad request - bucket and objectName required, or invalid expiresIn',
            },
            '404': {
              description: 'Object not found',
            },
            '500': {
              description: 'Internal server error',
            },
          },
        },
      },
    },
    tags: [
      {
        name: 'Buckets',
        description: 'Bucket management operations',
      },
      {
        name: 'Storage',
        description: 'Object and folder operations',
      },
    ],
  }
})

