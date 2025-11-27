/**
 * Composable for managing storage operations (buckets, folders, objects)
 */

interface Bucket {
  name: string
  createdAt?: string
}

interface FolderResponse {
  folders: string[]
}

interface ObjectEntry {
  name: string
  size: number
  lastModified?: string
}

interface ObjectResponse {
  objects: ObjectEntry[]
}

export function useStorage(bucket: Ref<string | undefined>, prefix: Ref<string>) {
  const route = useRoute()
  const router = useRouter()
  const { token } = useAuth()

  // Buckets
  const {
    data: bucketData,
    pending: bucketsPending,
    refresh: refreshBuckets,
  } = useAsyncData<Bucket[]>('storage-buckets', () => $fetch('/api/storage/buckets', {
    headers: {
      Authorization: `Bearer ${token.value}`,
    },
  }))

  const buckets = computed(() => bucketData.value ?? [])

  // Folders
  const folderKey = computed(() => `folders-${bucket.value ?? 'none'}-${prefix.value}`)

  const {
    data: folderData,
    refresh: refreshFolders,
  } = useAsyncData<FolderResponse>(
    folderKey,
    async () => {
      if (!bucket.value) {
        return { folders: [] }
      }
      return $fetch('/api/storage/folders', {
        params: { bucket: bucket.value, prefix: prefix.value },
        headers: {
          Authorization: `Bearer ${token.value}`,
        },
      })
    },
    { watch: [bucket, () => prefix.value] },
  )

  const folders = computed(() =>
    (folderData.value?.folders ?? []).map((path) => ({
      path,
      name: path.replace(prefix.value, '').replace(/\/$/, ''),
    })),
  )

  // Objects
  const objectKey = computed(() => `objects-${bucket.value ?? 'none'}-${prefix.value}`)

  const {
    data: objectData,
    refresh: refreshObjects,
  } = useAsyncData<ObjectResponse>(
    objectKey,
    async () => {
      if (!bucket.value) {
        return { objects: [] }
      }
      return $fetch('/api/storage/objects', {
        params: { bucket: bucket.value, prefix: prefix.value },
        headers: {
          Authorization: `Bearer ${token.value}`,
        },
      })
    },
    { watch: [bucket, () => prefix.value] },
  )

  const objects = computed(() => {
    // Filter เอา objects ที่ไม่มี name หรือ size เป็น 0 ออก
    return (objectData.value?.objects ?? []).filter((object) => {
      return object.name && object.size > 0
    })
  })

  // Navigation
  const handleNavigate = (nextPrefix: string) => {
    router.replace({ query: { prefix: nextPrefix } })
  }

  const handleSelectBucket = (name: string) => {
    router.push({
      path: `/storage/${encodeURIComponent(name)}`,
      query: { prefix: '' },
    })
  }

  // Breadcrumbs
  const breadcrumbs = computed(() => {
    const segments = prefix.value ? prefix.value.split('/').filter(Boolean) : []
    const crumbs: { label: string; value: string }[] = []
    let accumulated = ''
    segments.forEach((segment) => {
      accumulated += `${segment}/`
      crumbs.push({ label: segment, value: accumulated })
    })
    return crumbs
  })

  // Delete operations
  const handleDeleteObject = async (object: ObjectEntry) => {
    if (!bucket.value) return
    
    await $fetch('/api/storage/delete', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token.value}`,
      },
      body: { bucket: bucket.value, name: object.name },
    })
    
    await refreshObjects()
  }

  const handleDeleteFolder = async (folder: { path: string }) => {
    if (!bucket.value) return
    
    await $fetch('/api/storage/delete', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token.value}`,
      },
      body: { bucket: bucket.value, name: folder.path },
    })
    
    await Promise.all([refreshFolders(), refreshObjects()])
  }

  // Object info
  const getObjectInfo = async (objectName: string) => {
    if (!bucket.value) return null
    
    try {
      return await $fetch('/api/storage/object.info', {
        params: {
          bucket: bucket.value,
          objectName,
        },
        headers: {
          Authorization: `Bearer ${token.value}`,
        },
      })
    } catch (error) {
      console.error('Failed to load object info:', error)
      return null
    }
  }

  // Refresh
  const handleRefresh = async () => {
    await Promise.all([refreshObjects(), refreshFolders()])
  }

  return {
    // Data
    buckets,
    bucketsPending,
    folders,
    objects,
    breadcrumbs,
    // Methods
    refreshBuckets,
    refreshFolders,
    refreshObjects,
    handleNavigate,
    handleSelectBucket,
    handleDeleteObject,
    handleDeleteFolder,
    getObjectInfo,
    handleRefresh,
  }
}

