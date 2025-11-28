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
            Created on: {{ createdAtText }} · Access: {{ bucketAccessText }} · {{ summaryText }}
          </p>
        </div>
        <div class="flex items-center gap-3">
          <UButton variant="outline" color="neutral" icon="i-heroicons-arrow-path" @click="handleRefresh" class="cursor-pointer">
            Refresh
          </UButton>
          <div v-if="isAdmin" ref="uploadMenuRef" class="relative cursor-pointer">
            <UButton 
              color="primary" 
              icon="i-heroicons-arrow-up-tray" 
              @click.stop="toggleUploadMenu"
            >
              Upload
            </UButton>
            <div 
              v-if="showUploadMenu" 
              class="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50 overflow-hidden"
            >
              <button
                class="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors"
                @click="triggerFileUploadFromMenu"
              >
                <UIcon name="i-heroicons-arrow-up-tray" class="h-5 w-5 text-[#8D6E63]" />
                <span class="text-sm text-[#2C2A26]">Upload File</span>
              </button>
              <button
                class="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors border-t border-gray-100"
                @click="triggerFolderUploadFromMenu"
              >
                <UIcon name="i-heroicons-folder" class="h-5 w-5 text-[#8D6E63]" />
                <span class="text-sm text-[#2C2A26]">Upload Folder</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div class="rounded-2xl bg-white p-4 shadow-lg">
        <div class="flex flex-wrap items-center gap-4">
          <div class="flex flex-1 items-center gap-4">
            <div class="flex w-full max-w-xl items-center gap-3 rounded-lg bg-[#F3E6DD] border border-[#E0D2C8] px-3 py-2 text-sm">
              <UIcon name="i-heroicons-magnifying-glass-20-solid" class="h-4 w-4 text-[#8D6E63]" />
              <input
                v-model="objectSearch"
                type="text"
                placeholder="Start typing to filter objects in the bucket"
                class="w-full bg-transparent text-[#5D4037] placeholder:text-[#A1887F] outline-none"
              />
            </div>
            <div v-if="selectedItems.length > 0" class="flex items-center gap-2">
              <span class="text-sm text-[#5D4037]">{{ selectedItems.length }} selected</span>
              <UButton
                color="primary"
                icon="i-heroicons-arrow-down-tray"
                @click="handleDownloadSelected"
              >
                Download
              </UButton>
              <UButton
                v-if="isAdmin"
                color="error"
                icon="i-heroicons-trash"
                @click="handleDeleteSelected"
              >
                Delete
              </UButton>
            </div>
          </div>
        </div>
      </div>

      <div 
        ref="dropzoneRef"
        class="rounded-2xl bg-white p-5 shadow-lg transition-all relative"
          :class="{ 'border-2 border-dashed border-green-500 bg-green-50/50': isDraggingOver }"
          @dragover.prevent="handleDragOver"
          @dragleave.prevent="handleDragLeave"
          @drop.prevent="handleDrop"
        >
          <div class="flex items-center justify-between border-b border-gray-100 pb-4">
          <div class="flex items-center gap-1 text-sm text-gray-500">
            <button
              class="text-[#8D6E63] hover:underline cursor-pointer px-2 py-1 rounded hover:bg-gray-100 transition-colors"
              @click="handleNavigate('')"
            >
              {{ selectedBucket || 'Bucket' }}
            </button>
            <template v-for="(crumb, index) in breadcrumbs" :key="crumb.value">
              <span class="text-gray-400 px-1">/</span>
              <button
                class="text-[#8D6E63] hover:underline cursor-pointer px-2 py-1 rounded hover:bg-gray-100 transition-colors"
                @click="handleNavigate(crumb.value)"
              >
                {{ crumb.label }}
              </button>
            </template>
          </div>
          <div class="flex items-center gap-2">
            <UButton v-if="isAdmin" variant="outline" icon="i-heroicons-folder-plus" @click="showCreatePathModal = true">
              Create new path
            </UButton>
          </div>
        </div>

        <!-- Drag overlay -->
        <div 
          v-if="isDraggingOver"
          class="absolute inset-0 bg-green-500/10 border-2 border-dashed border-green-500 rounded-2xl flex items-center justify-center z-10 pointer-events-none"
        >
          <div class="text-center">
            <UIcon name="i-heroicons-arrow-up-tray" class="h-12 w-12 text-green-500 mx-auto mb-2" />
            <p class="text-green-600 font-medium">Drop files or folders here to upload</p>
          </div>
        </div>

        <div class="mt-4 overflow-hidden rounded-xl border border-gray-100">
          <table class="min-w-full text-sm">
            <thead class="bg-gray-50">
              <tr class="text-left text-gray-500">
                <th class="px-4 py-3 w-12">
                  <input
                    type="checkbox"
                    :checked="isAllSelected"
                    :indeterminate="isIndeterminate"
                    @change="handleSelectAll"
                    class="cursor-pointer"
                  />
                </th>
                <th class="px-4 py-3 font-medium">Name</th>
                <th class="px-4 py-3 font-medium">Last Modified</th>
                <th class="px-4 py-3 font-medium text-right">Size</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="folder in filteredFolders"
                :key="folder.path"
                class="border-b border-gray-50 hover:bg-gray-100 transition-colors"
                :class="{ 'bg-blue-50': isFolderSelected(folder.path) }"
                @click="(e) => !(e.target as HTMLElement).closest('input[type=checkbox]') && handleNavigate(folder.path)"
              >
                <td class="px-4 py-3" @click.stop>
                  <input
                    type="checkbox"
                    :checked="isFolderSelected(folder.path)"
                    @change="toggleFolderSelection(folder)"
                    class="cursor-pointer"
                  />
                </td>
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
                class="border-b border-gray-50 hover:bg-gray-100 transition-colors"
                :class="{ 'bg-blue-50': selectedObject?.name === object.name || isObjectSelected(object.name) }"
                @click="(e) => !(e.target as HTMLElement).closest('input[type=checkbox]') && handleSelectObject(object)"
              >
                <td class="px-4 py-3" @click.stop>
                  <input
                    type="checkbox"
                    :checked="isObjectSelected(object.name)"
                    @change="toggleObjectSelection(object)"
                    class="cursor-pointer"
                  />
                </td>
                <td class="px-4 py-3">
                  <div class="flex items-center gap-3">
                    <UIcon name="i-heroicons-document" class="h-5 w-5 text-[#8D6E63]" />
                    <span class="font-medium text-[#2C2A26]">{{ objectDisplayName(object.name, prefix) }}</span>
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
                <td colspan="4" class="px-4 py-10 text-center text-gray-500">
                  No objects here yet. Upload something!
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <input ref="fileInput" type="file" class="hidden" multiple @change="handleFileInputChange" />
      <input ref="folderInput" type="file" class="hidden" webkitdirectory @change="handleFileInputChange" />
    </div>

    <!-- Object Preview & Details Modal -->
    <div 
      v-if="selectedObject"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      @click.self="selectedObject = null"
    >
      <div class="bg-white rounded-lg shadow-xl w-full max-w-6xl h-[90vh] flex flex-col">
        <!-- Header -->
        <div class="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h3 class="text-lg font-semibold text-[#2C2A26] truncate">
            {{ selectedObject.name }}
          </h3>
          <button
            class="text-gray-400 hover:text-gray-600 transition-colors"
            @click="selectedObject = null"
          >
            <UIcon name="i-heroicons-x-mark" class="h-6 w-6" />
          </button>
        </div>

        <!-- Content: Preview (Left) + Detail (Right) -->
        <div class="flex-1 flex overflow-hidden">
          <!-- Preview Panel (Left) -->
          <div class="w-2/3 border-r border-gray-200 p-6 overflow-auto">
            <h4 class="text-sm font-semibold text-[#2C2A26] mb-4">Preview</h4>
            <div class="h-full flex items-center justify-center">
              <ObjectPreview
                v-if="selectedObjectInfo"
                :bucket="selectedBucket || ''"
                :object-name="selectedObject.name"
                :content-type="selectedObjectInfo.contentType"
              />
              <div v-else class="text-gray-500">Loading...</div>
            </div>
          </div>

          <!-- Detail Panel (Right) -->
          <div class="w-1/3 p-6 overflow-auto">
            <ObjectDetails
              :bucket="selectedBucket || ''"
              :object-name="selectedObject.name"
              :object-info="selectedObjectInfo"
              @deleted="handleObjectDeleted"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Create New Path Modal -->
    <div 
      v-if="showCreatePathModal"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      @click.self="showCreatePathModal = false"
    >
      <div class="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        <!-- Header -->
        <div class="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h3 class="text-lg font-semibold flex items-center gap-2">
            <UIcon name="i-heroicons-folder-plus" class="h-5 w-5 text-green-600" />
            Choose or create a new path
          </h3>
          <button
            class="text-gray-400 hover:text-gray-600 transition-colors"
            @click="showCreatePathModal = false"
          >
            <UIcon name="i-heroicons-x-mark" class="h-5 w-5" />
          </button>
        </div>

        <!-- Body -->
        <div class="px-6 py-4 space-y-4">
          <div>
            <label class="text-sm font-medium text-gray-700 mb-1 block">Current Path:</label>
            <div class="text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded">
              {{ selectedBucket }}{{ prefix ? ' / ' + prefix.replace(/\/$/, '') : '' }}
            </div>
          </div>

          <div>
            <label class="text-sm font-medium text-gray-700 mb-1 block">
              New Folder Path <span class="text-red-500">*</span>
            </label>
            <input
              v-model="newPathInput"
              type="text"
              placeholder="Enter the new Folder Path"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              @keyup.enter="handleCreatePath"
            />
            <p class="text-xs text-gray-500 mt-1">
              Enter folder name (e.g., "newfolder" or "folder/subfolder")
            </p>
          </div>
        </div>

        <!-- Footer -->
        <div class="flex justify-end gap-2 px-6 py-4 border-t border-gray-200">
          <UButton variant="outline" @click="handleClearPath">Clear</UButton>
          <UButton color="primary" @click="handleCreatePath">Create</UButton>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { formatSize, formatDate } from '~/utils/format'
import { objectDisplayName } from '~/utils/object'
import { useStorage } from '~/composables/useStorage'
import { useUpload } from '~/composables/useUpload'
import { useDownload } from '~/composables/useDownload'

// Check authentication
const { isAuthenticated, fetchUser, isAdmin } = useAuth()
await fetchUser()

if (!isAuthenticated.value) {
  navigateTo('/login')
}

interface ObjectEntry {
  name: string
  size: number
  lastModified?: string
}

interface SelectedItem {
    name: string
  path: string
  type: 'file' | 'folder'
}

const route = useRoute()
const router = useRouter()
const prefix = ref<string>((route.query.prefix as string) ?? '')
const objectSearch = ref('')
const showUploadMenu = ref(false)
const uploadMenuRef = ref<HTMLElement>()
const showCreatePathModal = ref(false)
const newPathInput = ref('')
const selectedObject = ref<ObjectEntry | null>(null)
const selectedObjectInfo = ref<any>(null)
const loadingObjectInfo = ref(false)
const selectedItems = ref<SelectedItem[]>([])

definePageMeta({
  layout: 'dashboard',
})
const downloading = ref(false)
const bucketPolicy = ref<'private' | 'public-read' | 'authenticated-read' | 'custom' | null>(null)
const loadingBucketPolicy = ref(false)

const selectedBucket = computed(() => route.params.bucket as string | undefined)

watch(
  () => route.query.prefix,
  (value) => {
    prefix.value = typeof value === 'string' ? value : ''
  },
)

// Use storage composable
const {
  buckets,
  bucketsPending,
  folders,
  objects,
  breadcrumbs,
  refreshBuckets,
  refreshFolders,
  refreshObjects,
  handleNavigate: navigateStorage,
  handleSelectBucket,
  handleDeleteObject,
  handleDeleteFolder,
  getObjectInfo,
  handleRefresh,
} = useStorage(selectedBucket, prefix)

// Auto-redirect to first bucket if current bucket doesn't exist
watchEffect(() => {
  if (!bucketsPending.value && buckets.value.length && selectedBucket.value) {
    const exists = buckets.value.some((bucket) => bucket.name === selectedBucket.value)
    if (!exists && buckets.value[0]) {
      navigateTo(`/storage/${encodeURIComponent(buckets.value[0].name)}`, { replace: true })
    }
  }
})

// Use upload composable
const {
  fileInput,
  folderInput,
  dropzoneRef,
  isDraggingOver,
  handleDragOver,
  handleDragLeave,
  handleDrop,
  handleFileInputChange,
  triggerFileUpload,
  triggerFolderUpload,
} = useUpload(selectedBucket, prefix, refreshObjects, refreshFolders)

// Use download composable
const { downloadItems } = useDownload(selectedBucket)

const filteredObjects = computed(() => {
  if (!objectSearch.value) {
    return objects.value
  }
  return objects.value.filter((object) =>
    object.name.toLowerCase().includes(objectSearch.value.toLowerCase()),
  )
})

const filteredFolders = computed(() => {
  if (!objectSearch.value) {
    return folders.value
    }
  return folders.value.filter((folder) =>
    folder.name.toLowerCase().includes(objectSearch.value.toLowerCase()) ||
    folder.path.toLowerCase().includes(objectSearch.value.toLowerCase()),
  )
})

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

const bucketAccessText = computed(() => {
  if (!bucketPolicy.value) return 'Loading...'
  switch (bucketPolicy.value) {
    case 'private':
      return 'PRIVATE'
    case 'public-read':
      return 'PUBLIC READ'
    case 'authenticated-read':
      return 'AUTHENTICATED READ'
    case 'custom':
      return 'CUSTOM'
    default:
      return 'PRIVATE'
  }
})

// Load bucket policy when bucket changes
const loadBucketPolicy = async () => {
  if (!selectedBucket.value) {
    bucketPolicy.value = null
    return
  }

  loadingBucketPolicy.value = true
  try {
    const { token } = useAuth()
    const response = await $fetch('/api/storage/bucket.policy', {
      params: { bucket: selectedBucket.value },
      headers: {
        Authorization: `Bearer ${token.value}`,
      },
    })
    const policyType = response.policyType as 'private' | 'public-read' | 'authenticated-read' | 'custom' | null
    bucketPolicy.value = policyType || 'private'
  } catch (error: any) {
    console.error('Failed to load bucket policy:', error)
    bucketPolicy.value = 'private'
  } finally {
    loadingBucketPolicy.value = false
  }
}

// Watch for bucket changes to reload policy
watch(selectedBucket, loadBucketPolicy, { immediate: true })

// Watch for route changes (including query params) to reload policy
// This will trigger when coming back from dashboard modal after policy change
watch(() => route.fullPath, () => {
  if (selectedBucket.value) {
    loadBucketPolicy()
  }
})

// Also reload policy when window regains focus (in case policy was changed in another tab/modal)
if (typeof window !== 'undefined') {
  window.addEventListener('focus', () => {
    if (selectedBucket.value) {
      loadBucketPolicy()
    }
  })
}

// Use visibilitychange to reload when page becomes visible again
if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && selectedBucket.value) {
      loadBucketPolicy()
    }
  })
}

const handleNavigate = (nextPrefix: string) => {
  navigateStorage(nextPrefix)
  selectedObject.value = null // Clear selection when navigating
  selectedItems.value = [] // Clear checkbox selection when navigating
}

// Selection management
const toggleFolderSelection = (folder: { path: string; name: string }) => {
  const index = selectedItems.value.findIndex(
    (item) => item.path === folder.path && item.type === 'folder'
  )
  
  if (index >= 0) {
    selectedItems.value.splice(index, 1)
  } else {
    selectedItems.value.push({
      name: folder.name,
      path: folder.path,
      type: 'folder',
    })
  }
}

const toggleObjectSelection = (object: ObjectEntry) => {
  const index = selectedItems.value.findIndex(
    (item) => item.path === object.name && item.type === 'file'
  )
  
  if (index >= 0) {
    selectedItems.value.splice(index, 1)
  } else {
    selectedItems.value.push({
      name: objectDisplayName(object.name, prefix.value),
      path: object.name,
      type: 'file',
    })
  }
}

const isFolderSelected = (path: string) => {
  return selectedItems.value.some(
    (item) => item.path === path && item.type === 'folder'
  )
}

const isObjectSelected = (path: string) => {
  return selectedItems.value.some(
    (item) => item.path === path && item.type === 'file'
  )
}

const isAllSelected = computed(() => {
  const allItems = [
    ...filteredFolders.value.map((f) => ({ path: f.path, type: 'folder' as const })),
    ...filteredObjects.value.map((o) => ({ path: o.name, type: 'file' as const })),
  ]
  
  if (allItems.length === 0) return false
  return allItems.every((item) =>
    item.type === 'folder'
      ? isFolderSelected(item.path)
      : isObjectSelected(item.path)
  )
})

const isIndeterminate = computed(() => {
  const allItems = [
    ...filteredFolders.value.map((f) => ({ path: f.path, type: 'folder' as const })),
    ...filteredObjects.value.map((o) => ({ path: o.name, type: 'file' as const })),
  ]
  
  if (allItems.length === 0) return false
  
  const selectedCount = allItems.filter((item) =>
    item.type === 'folder'
      ? isFolderSelected(item.path)
      : isObjectSelected(item.path)
  ).length
  
  return selectedCount > 0 && selectedCount < allItems.length
})

const handleSelectAll = (event: Event) => {
  const checked = (event.target as HTMLInputElement).checked
  
  if (checked) {
    // Select all
    filteredFolders.value.forEach((folder) => {
      if (!isFolderSelected(folder.path)) {
        selectedItems.value.push({
          name: folder.name,
          path: folder.path,
          type: 'folder',
        })
      }
    })
    
    filteredObjects.value.forEach((object) => {
      if (!isObjectSelected(object.name)) {
        selectedItems.value.push({
          name: objectDisplayName(object.name, prefix.value),
          path: object.name,
          type: 'file',
  })
}
    })
  } else {
    // Deselect all
    const pathsToRemove = new Set([
      ...filteredFolders.value.map((f) => f.path),
      ...filteredObjects.value.map((o) => o.name),
    ])
    
    selectedItems.value = selectedItems.value.filter(
      (item) => !pathsToRemove.has(item.path)
    )
  }
}

const handleDownloadSelected = async () => {
  if (!selectedItems.value.length || !selectedBucket.value) return
  
  downloading.value = true
  try {
    await downloadItems(selectedItems.value)
  } finally {
    downloading.value = false
  }
}

const handleDeleteSelected = async () => {
  if (!selectedItems.value.length || !selectedBucket.value) return
  
  const count = selectedItems.value.length
  if (!confirm(`Are you sure you want to delete ${count} item${count === 1 ? '' : 's'}?`)) {
    return
  }
  
  try {
    // Delete all selected items
    for (const item of selectedItems.value) {
      if (item.type === 'file') {
        await handleDeleteObject({ name: item.path, size: 0 })
      } else if (item.type === 'folder') {
        await handleDeleteFolder({ path: item.path })
      }
    }
    
    // Clear selection after deletion
    selectedItems.value = []
    await handleRefresh()
    window.alert(`${count} item${count === 1 ? '' : 's'} deleted successfully`)
  } catch (error: any) {
    console.error('Delete error:', error)
    window.alert(`Failed to delete items: ${error?.data?.message || error?.message || 'Unknown error'}`)
  }
}

const handleSelectObject = async (object: ObjectEntry) => {
  selectedObject.value = object
  loadingObjectInfo.value = true
  selectedObjectInfo.value = null

  try {
    const info = await getObjectInfo(object.name)
    selectedObjectInfo.value = info || {
      name: object.name,
      size: object.size,
      lastModified: object.lastModified,
    }
  } catch (error: any) {
    console.error('Failed to load object info:', error)
    selectedObjectInfo.value = {
      name: object.name,
      size: object.size,
      lastModified: object.lastModified,
    }
  } finally {
    loadingObjectInfo.value = false
  }
}

const handleObjectDeleted = async () => {
  selectedObject.value = null
  selectedObjectInfo.value = null
  await handleRefresh()
}

const handleCreatePath = () => {
  if (!newPathInput.value.trim()) {
    window.alert('Please enter a folder path')
    return
  }

  // สร้าง path ใหม่โดยรวมกับ prefix ปัจจุบัน
  let newPath = newPathInput.value.trim()
  
  // ลบ leading/trailing slashes
  newPath = newPath.replace(/^\/+|\/+$/g, '')
  
  // รวมกับ prefix ปัจจุบัน
  const fullPath = prefix.value + newPath + '/'
  
  // Navigate ไปที่ path ใหม่ (ยังไม่มีการสร้างจริง)
  handleNavigate(fullPath)
  
  // ปิด modal และ clear input
  showCreatePathModal.value = false
  newPathInput.value = ''
}

const handleClearPath = () => {
  newPathInput.value = ''
}

const toggleUploadMenu = () => {
  showUploadMenu.value = !showUploadMenu.value
}

const triggerFileUploadFromMenu = () => {
  showUploadMenu.value = false
  triggerFileUpload()
}

const triggerFolderUploadFromMenu = () => {
  showUploadMenu.value = false
  triggerFolderUpload()
}

// ปิดเมนูเมื่อคลิกข้างนอก
onMounted(() => {
  const handleClickOutside = (event: MouseEvent) => {
    const target = event.target as HTMLElement
    if (uploadMenuRef.value && !uploadMenuRef.value.contains(target)) {
      showUploadMenu.value = false
    }
  }
  document.addEventListener('click', handleClickOutside)
  onUnmounted(() => {
    document.removeEventListener('click', handleClickOutside)
  })
})
</script>