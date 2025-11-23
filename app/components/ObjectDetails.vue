<template>
  <div class="space-y-6">

    <!-- Actions Section -->
    <div>
      <h4 class="text-sm font-semibold text-[#2C2A26] mb-3">Actions:</h4>
      <div class="space-y-2">
        <button
          class="w-full flex items-center gap-3 px-4 py-2 text-left text-gray-700 hover:bg-gray-50 rounded-md transition-colors"
          @click="handleDownload"
          :disabled="downloading"
        >
          <UIcon name="i-heroicons-arrow-down-tray" class="h-5 w-5 text-[#8D6E63]" />
          <span>{{ downloading ? 'Downloading...' : 'Download' }}</span>
        </button>
        <button
          class="w-full flex items-center gap-3 px-4 py-2 text-left text-gray-700 hover:bg-gray-50 rounded-md transition-colors"
          @click="showShareModal = true"
        >
          <UIcon name="i-heroicons-share" class="h-5 w-5 text-[#8D6E63]" />
          <span>Share</span>
        </button>
        <!-- <button
          class="w-full flex items-center gap-3 px-4 py-2 text-left text-gray-700 hover:bg-gray-50 rounded-md transition-colors cursor-not-allowed opacity-60"
          disabled
        >
          <UIcon name="i-heroicons-eye" class="h-5 w-5 text-[#8D6E63]" />
          <span>Preview</span>
        </button>
        <button
          class="w-full flex items-center gap-3 px-4 py-2 text-left text-gray-700 hover:bg-gray-50 rounded-md transition-colors cursor-not-allowed opacity-60"
          disabled
        >
          <UIcon name="i-heroicons-tag" class="h-5 w-5 text-[#8D6E63]" />
          <span>Tags</span>
        </button>
        <button
          class="w-full flex items-center gap-3 px-4 py-2 text-left text-gray-700 hover:bg-gray-50 rounded-md transition-colors cursor-not-allowed opacity-40"
          disabled
        >
          <UIcon name="i-heroicons-squares-2x2" class="h-5 w-5 text-gray-400" />
          <span class="text-gray-400">Display Object Versions</span>
        </button> -->
      </div>
      
      <div class="border-t border-gray-200 mt-4 pt-4">
        <button
          class="w-full flex items-center gap-3 px-4 py-2 text-left text-red-600 hover:bg-red-50 rounded-md transition-colors border border-red-200"
          @click="handleDelete"
          :disabled="deleting"
        >
          <UIcon name="i-heroicons-trash" class="h-5 w-5" />
          <span>{{ deleting ? 'Deleting...' : 'Delete' }}</span>
        </button>
      </div>
    </div>

    <!-- Object Info Section -->
    <div>
      <div class="flex items-center justify-between mb-3">
        <h4 class="text-sm font-semibold text-[#2C2A26]">Object Info</h4>
        <UIcon name="i-heroicons-user-circle" class="h-5 w-5 text-gray-400" />
      </div>
      <div class="space-y-2 text-sm">
        <div class="flex justify-between">
          <span class="text-gray-600">Name:</span>
          <span class="text-[#2C2A26] font-medium">{{ objectName }}</span>
        </div>
        <div class="flex justify-between">
          <span class="text-gray-600">Size:</span>
          <span class="text-[#2C2A26]">{{ formatSize(objectInfo?.size || 0) }}</span>
        </div>
        <div class="flex justify-between">
          <span class="text-gray-600">Last Modified:</span>
          <span class="text-[#2C2A26]">{{ formatLastModified(objectInfo?.lastModified) }}</span>
        </div>
        <div class="flex justify-between">
          <span class="text-gray-600">ETAG:</span>
          <span class="text-[#2C2A26] font-mono text-xs">{{ objectInfo?.etag || 'N/A' }}</span>
        </div>
        <div class="flex justify-between">
          <span class="text-gray-600">Tags:</span>
          <span class="text-[#2C2A26]">{{ objectInfo?.tags && Object.keys(objectInfo.tags).length > 0 ? Object.keys(objectInfo.tags).length + ' tag(s)' : 'N/A' }}</span>
        </div>
        <div class="flex justify-between">
          <span class="text-gray-600">Legal Hold:</span>
          <span class="text-[#2C2A26]">{{ objectInfo?.legalHold || 'Off' }}</span>
        </div>
        <div class="flex justify-between">
          <span class="text-gray-600">Retention Policy:</span>
          <span class="text-[#2C2A26]">{{ objectInfo?.retentionMode || 'None' }}</span>
        </div>
      </div>
    </div>

    <!-- Metadata Section -->
    <div>
      <div class="flex items-center justify-between mb-3">
        <h4 class="text-sm font-semibold text-[#2C2A26]">Metadata</h4>
        <UIcon name="i-heroicons-document-duplicate" class="h-5 w-5 text-gray-400" />
      </div>
      <div class="space-y-2 text-sm">
        <div class="flex justify-between">
          <span class="text-gray-600">Content-Type:</span>
          <span class="text-[#2C2A26] font-mono text-xs break-all text-right">{{ objectInfo?.contentType || 'N/A' }}</span>
        </div>
      </div>
    </div>

    <!-- Share Modal -->
    <div 
      v-if="showShareModal"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      @click.self="showShareModal = false"
    >
      <div class="bg-white rounded-lg shadow-xl w-full max-w-2xl">
        <!-- Header -->
        <div class="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div class="flex items-center gap-3">
            <div class="p-2 bg-green-100 rounded-lg">
              <UIcon name="i-heroicons-share" class="h-5 w-5 text-green-600" />
            </div>
            <h3 class="text-lg font-semibold text-[#2C2A26]">Share File</h3>
          </div>
          <button
            class="text-gray-400 hover:text-gray-600 transition-colors"
            @click="showShareModal = false"
          >
            <UIcon name="i-heroicons-x-mark" class="h-6 w-6" />
          </button>
        </div>

        <!-- Body -->
        <div class="px-6 py-4 space-y-4">
          <!-- <p class="text-sm text-gray-600">
            The following URL lets you share this object without requiring a login. The URL expires automatically at the earlier of your configured time or the expiration of your current web session.
          </p> -->

          <!-- Active for -->
          <div>
            <h4 class="text-sm font-semibold text-[#2C2A26] mb-3">Active for</h4>
            <div class="flex items-center gap-4">
              <div class="flex-1">
                <label class="text-xs text-gray-600 mb-1 block">Days</label>
                <input
                  v-model.number="shareDays"
                  type="number"
                  min="0"
                  max="7"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  @input="updateShareUrl"
                />
              </div>
              <div class="flex-1">
                <label class="text-xs text-gray-600 mb-1 block">Hours</label>
                <input
                  v-model.number="shareHours"
                  type="number"
                  min="0"
                  max="23"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  @input="updateShareUrl"
                />
              </div>
              <div class="flex-1">
                <label class="text-xs text-gray-600 mb-1 block">Minutes</label>
                <input
                  v-model.number="shareMinutes"
                  type="number"
                  min="0"
                  max="59"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  @input="updateShareUrl"
                />
              </div>
            </div>
          </div>

          <!-- Expiration Date -->
          <div class="flex items-center gap-2 text-sm">
            <UIcon name="i-heroicons-link" class="h-5 w-5 text-gray-400" />
            <span class="text-gray-600">Link will be available until:</span>
            <span class="text-[#2C2A26] font-medium">{{ expirationDateFormatted }}</span>
          </div>

          <!-- Share URL -->
          <div>
            <div class="flex items-center gap-2 mb-2">
              <label class="text-sm font-medium text-gray-700">Share URL</label>
              <button
                class="ml-auto flex items-center gap-2 px-3 py-1 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded transition-colors"
                @click="copyShareUrl"
              >
                <UIcon name="i-heroicons-clipboard-document" class="h-4 w-4" />
                <span>{{ copied ? 'Copied!' : 'Copy' }}</span>
              </button>
            </div>
            <input
              :value="shareUrl"
              type="text"
              readonly
              class="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-sm font-mono"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface ObjectInfo {
  name: string
  size: number
  lastModified?: string
  etag?: string
  contentType?: string
  tags?: Record<string, string>
  legalHold?: string
  retentionMode?: string | null
  retentionUntilDate?: string | null
  metadata?: Record<string, string>
}

interface Props {
  bucket: string
  objectName: string
  objectInfo?: ObjectInfo
}

const props = defineProps<Props>()
const emit = defineEmits<{
  deleted: []
}>()

const deleting = ref(false)
const downloading = ref(false)
const showShareModal = ref(false)
const shareDays = ref(0)
const shareHours = ref(12)
const shareMinutes = ref(0)
const shareUrl = ref('')
const expirationDate = ref<Date | null>(null)
const copied = ref(false)

const expirationDateFormatted = computed(() => {
  if (!expirationDate.value) return ''
  return expirationDate.value.toLocaleString('en-US', {
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).replace(/(\d+)\/(\d+)\/(\d+), (\d+):(\d+):(\d+)/, '$3/$1/$2 $4:$5:$6') + ' GMT+7'
})

const formatSize = (size: number) => {
  if (size < 1024) return `${size} B`
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KiB`
  if (size < 1024 * 1024 * 1024) return `${(size / (1024 * 1024)).toFixed(1)} MiB`
  return `${(size / (1024 * 1024 * 1024)).toFixed(1)} GiB`
}

const formatLastModified = (date?: string) => {
  if (!date) return '—'
  const modifiedDate = new Date(date)
  const now = new Date()
  const diffMs = now.getTime() - modifiedDate.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
  return modifiedDate.toLocaleString()
}

const handleDownload = async () => {
  downloading.value = true
  try {
    // สร้าง presigned URL สำหรับ download
    const shareData = await $fetch('/api/storage/share', {
      params: {
        bucket: props.bucket,
        objectName: props.objectName,
        expiresIn: 3600, // 1 hour
      },
    })
    
    // ดาวน์โหลดไฟล์
    const link = document.createElement('a')
    link.href = shareData.url
    link.download = props.objectName.split('/').pop() || 'download'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  } catch (error: any) {
    window.alert(error?.data?.message || error?.message || 'Failed to download file')
  } finally {
    downloading.value = false
  }
}

const updateShareUrl = async () => {
  // คำนวณเวลาเป็นวินาที
  const totalSeconds = shareDays.value * 24 * 60 * 60 + shareHours.value * 60 * 60 + shareMinutes.value * 60
  
  // ตรวจสอบว่าเวลามีค่ามากกว่า 0
  if (totalSeconds <= 0) {
    shareUrl.value = ''
    expirationDate.value = null
    return
  }

  // จำกัดเวลาไม่เกิน 7 วัน
  const maxSeconds = 7 * 24 * 60 * 60
  const expiresIn = Math.min(totalSeconds, maxSeconds)

  try {
    const shareData = await $fetch('/api/storage/share', {
      params: {
        bucket: props.bucket,
        objectName: props.objectName,
        expiresIn,
      },
    })
    
    shareUrl.value = shareData.url
    expirationDate.value = new Date(shareData.expiresAt)
  } catch (error: any) {
    console.error('Failed to generate share URL:', error)
    shareUrl.value = ''
    expirationDate.value = null
  }
}

const copyShareUrl = async () => {
  if (!shareUrl.value) return
  
  try {
    await navigator.clipboard.writeText(shareUrl.value)
    copied.value = true
    setTimeout(() => {
      copied.value = false
    }, 2000)
  } catch (error) {
    // Fallback for older browsers
    const textArea = document.createElement('textarea')
    textArea.value = shareUrl.value
    document.body.appendChild(textArea)
    textArea.select()
    document.execCommand('copy')
    document.body.removeChild(textArea)
    copied.value = true
    setTimeout(() => {
      copied.value = false
    }, 2000)
  }
}

watch(showShareModal, (isOpen) => {
  if (isOpen) {
    // Reset to default 12 hours
    shareDays.value = 0
    shareHours.value = 12
    shareMinutes.value = 0
    updateShareUrl()
  }
})

const handleDelete = async () => {
  if (!confirm(`Are you sure you want to delete "${props.objectName}"?`)) {
    return
  }

  deleting.value = true
  try {
    await $fetch('/api/storage/delete', {
      method: 'POST',
      body: {
        bucket: props.bucket,
        name: props.objectName,
      },
    })
    emit('deleted')
  } catch (error: any) {
    window.alert(error?.data?.message || error?.message || 'Failed to delete object')
  } finally {
    deleting.value = false
  }
}
</script>

