<template>
  <div class="min-h-screen bg-[#F5F1EB] px-6 py-10 text-[#1F1B16]">
    <div class="mx-auto max-w-6xl space-y-8">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-sm uppercase tracking-wide text-[#8D6E63]">Object Browser</p>
          <h1 class="text-3xl font-semibold text-[#2C2A26]">
            {{ bucketTitle }}
          </h1>
          <p class="text-sm text-[#6D4C41]" v-if="selectedBucket">
            Created on: {{ createdAtText }} · Access: PRIVATE · {{ summaryText }}
          </p>
        </div>
        <div class="flex items-center gap-3">
          <UButton variant="outline" color="neutral" icon="i-heroicons-arrow-path" @click="handleRefresh">
            Refresh
          </UButton>
          <UButton color="primary" icon="i-heroicons-arrow-up-tray" @click="triggerUpload">
            Upload
          </UButton>
        </div>
      </div>

      <div class="rounded-2xl bg-white p-4 shadow-lg">
        <div class="flex flex-wrap items-center gap-4">
          <div class="flex w-full max-w-xl items-center gap-3 rounded-lg bg-[#F3E6DD] border border-[#E0D2C8] px-3 py-2 text-sm">
            <UIcon name="i-heroicons-magnifying-glass-20-solid" class="h-4 w-4 text-[#8D6E63]" />
            <input
              v-model="objectSearch"
              type="text"
              placeholder="Start typing to filter objects in the bucket"
              class="w-full bg-transparent text-[#5D4037] placeholder:text-[#A1887F] outline-none"
            />
          </div>
        </div>
      </div>

      <div class="rounded-2xl bg-white p-5 shadow-lg">
        <div class="flex items-center justify-between border-b border-gray-100 pb-4">
          <div class="flex items-center gap-2 text-sm text-gray-500">
            <button
              class="text-[#8D6E63] hover:underline"
              @click="handleNavigate('')"
            >
              {{ selectedBucket || 'Bucket' }}
            </button>
            <UIcon
              v-for="(crumb, index) in breadcrumbs"
              :key="crumb.value"
              name="i-heroicons-chevron-right-20-solid"
              class="h-4 w-4 text-gray-400"
              v-show="index < breadcrumbs.length"
            />
            <button
              v-for="(crumb, index) in breadcrumbs"
              :key="crumb.value"
              class="text-[#8D6E63] hover:underline"
              @click="handleNavigate(crumb.value)"
            >
              {{ crumb.label }}
            </button>
          </div>
          <div class="flex items-center gap-2">
            <UButton variant="ghost" icon="i-heroicons-arrow-uturn-left" @click="handleNavigate(backPrefix)">
              Back
            </UButton>
            <UButton variant="ghost" icon="i-heroicons-arrow-uturn-right" @click="handleNavigate(forwardPrefix)">
              Forward
            </UButton>
          </div>
        </div>

        <div class="mt-4 overflow-hidden rounded-xl border border-gray-100">
          <table class="min-w-full text-sm">
            <thead class="bg-gray-50">
              <tr class="text-left text-gray-500">
                <th class="px-4 py-3 font-medium">Name</th>
                <th class="px-4 py-3 font-medium">Last Modified</th>
                <th class="px-4 py-3 font-medium text-right">Size</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="folder in filteredFolders"
                :key="folder.path"
                class="border-b border-gray-50 hover:bg-gray-50 cursor-pointer"
                @click="handleNavigate(folder.path)"
              >
                <td class="px-4 py-3" >
                  <div class="flex items-center gap-3 text-[#5D4037]">
                    <UIcon name="i-heroicons-folder" class="h-5 w-5 text-[#8D6E63]" />
                    <span class="font-medium">{{ folder.name }}</span>
                  </div>
                </td>
                <td class="px-4 py-3 text-gray-500">—</td>
                <td class="px-4 py-3 text-right text-gray-500">—</td>
              </tr>
              <tr
                v-for="object in filteredObjects"
                :key="object.name"
                class="border-b border-gray-50 hover:bg-gray-50"
              >
                <td class="px-4 py-3">
                  <div class="flex items-center gap-3">
                    <UIcon name="i-heroicons-document" class="h-5 w-5 text-[#8D6E63]" />
                    <span class="font-medium text-[#2C2A26]">{{ objectDisplayName(object.name) }}</span>
                  </div>
                </td>
                <td class="px-4 py-3 text-gray-500">
                  {{ object.lastModified ? formatDate(object.lastModified) : '—' }}
                </td>
                <td class="px-4 py-3 text-right text-gray-600">
                  {{ formatSize(object.size) }}
                </td>
              </tr>
              <tr v-if="!filteredObjects.length && !filteredFolders.length">
                <td colspan="3" class="px-4 py-10 text-center text-gray-500">
                  No objects here yet. Upload something!
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <input ref="fileInput" type="file" class="hidden" multiple @change="handleUpload" />
    </div>
  </div>
</template>

<script setup lang="ts">
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

const route = useRoute()
const router = useRouter()
const prefix = ref<string>((route.query.prefix as string) ?? '')
const objectSearch = ref('')
const fileInput = ref<HTMLInputElement>()

const selectedBucket = computed(() => route.params.bucket as string | undefined)

watch(
  () => route.query.prefix,
  (value) => {
    prefix.value = typeof value === 'string' ? value : ''
  },
)

const {
  data: bucketData,
  pending: bucketsPending,
} = await useAsyncData<Bucket[]>('storage-buckets', () => $fetch('/api/storage/buckets'))

const buckets = computed(() => bucketData.value ?? [])

watchEffect(() => {
  if (!bucketsPending.value && buckets.value.length && selectedBucket.value) {
    const exists = buckets.value.some((bucket) => bucket.name === selectedBucket.value)
    if (!exists && buckets.value[0]) {
      router.replace(`/storage/${encodeURIComponent(buckets.value[0].name)}`)
    }
  }
})

const folderKey = computed(() => `folders-${selectedBucket.value ?? 'none'}-${prefix.value}`)
const objectKey = computed(() => `objects-${selectedBucket.value ?? 'none'}-${prefix.value}`)

const {
  data: folderData,
  refresh: refreshFolders,
} = await useAsyncData<FolderResponse>(
  folderKey,
  async () => {
    if (!selectedBucket.value) {
      return { folders: [] }
    }
    return $fetch('/api/storage/folders', {
      params: { bucket: selectedBucket.value, prefix: prefix.value },
    })
  },
  { watch: [selectedBucket, () => prefix.value] },
)

const {
  data: objectData,
  refresh: refreshObjects,
} = await useAsyncData<{ objects: ObjectEntry[] }>(
  objectKey,
  async () => {
    if (!selectedBucket.value) {
      return { objects: [] }
    }
    return $fetch('/api/storage/objects', {
      params: { bucket: selectedBucket.value, prefix: prefix.value },
    })
  },
  { watch: [selectedBucket, () => prefix.value] },
)

const folders = computed(() =>
  (folderData.value?.folders ?? []).map((path) => ({
    path,
    name: path.replace(prefix.value, '').replace(/\/$/, ''),
  })),
)

const objects = computed(() => objectData.value?.objects ?? [])

const filteredObjects = computed(() => {
  if (!objectSearch.value) {
    return objects.value
  }
  return objects.value.filter((object) =>
    object.name.toLowerCase().includes(objectSearch.value.toLowerCase()),
  )
})

const filteredFolders = computed(() => folders.value)

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

const backPrefix = computed(() => {
  const segments = prefix.value.split('/').filter(Boolean)
  segments.pop()
  return segments.length ? `${segments.join('/')}/` : ''
})

const forwardPrefix = computed(() => prefix.value)

const bucketTitle = computed(() => selectedBucket.value || 'Select a bucket')
const createdAtText = computed(() => {
  const bucket = buckets.value.find((b) => b.name === selectedBucket.value)
  return bucket?.createdAt ? new Date(bucket.createdAt).toLocaleString() : 'Unknown'
})

const summaryText = computed(() => {
  const count = objects.value.length
  const total = objects.value.reduce((sum, obj) => sum + obj.size, 0)
  return `${formatSize(total)} · ${count} object${count === 1 ? '' : 's'}`
})

const handleSelectBucket = (name: string) => {
  router.push({
    path: `/storage/${encodeURIComponent(name)}`,
    query: { prefix: '' },
  })
}

const handleNavigate = (nextPrefix: string) => {
  router.replace({ query: { prefix: nextPrefix } })
}

const objectDisplayName = (name?: string) => {
  if (!name) return ''
  return name.replace(prefix.value, '')
}

const formatSize = (size: number) => {
  if (size < 1024) return `${size} B`
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`
  if (size < 1024 * 1024 * 1024) return `${(size / (1024 * 1024)).toFixed(1)} MB`
  return `${(size / (1024 * 1024 * 1024)).toFixed(1)} GB`
}

const formatDate = (value: string) => new Date(value).toLocaleString()

const triggerUpload = () => {
  fileInput.value?.click()
}

const handleUpload = async (event: Event) => {
  const target = event.target as HTMLInputElement
  const files = target.files
  if (!files || !files.length || !selectedBucket.value) return

  const formData = new FormData()
  Array.from(files).forEach((file) => {
    formData.append('files', file, file.name)
  })

  await $fetch('/api/storage/upload', {
    method: 'POST',
    body: formData,
    params: { bucket: selectedBucket.value, prefix: prefix.value },
  })
  window.alert('Upload complete')
  target.value = ''
  await Promise.all([refreshObjects(), refreshFolders()])
}

const handleRefresh = async () => {
  await Promise.all([refreshObjects(), refreshFolders()])
  window.alert('Refreshed')
}
</script>