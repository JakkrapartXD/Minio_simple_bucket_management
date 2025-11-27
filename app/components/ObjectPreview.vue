<template>
  <div class="w-full h-full flex items-center justify-center">
    <!-- Image Preview -->
    <div v-if="isImage" class="w-full h-full flex items-center justify-center">
      <img
        :src="previewUrl"
        :alt="objectName"
        class="max-w-full max-h-full object-contain"
        @error="handleImageError"
      />
    </div>

    <!-- PDF Preview -->
    <div v-else-if="isPDF" class="w-full h-full flex flex-col items-center justify-center">
      <iframe
        :src="previewUrl"
        class="w-full h-full border-0"
        @error="handlePreviewError"
      />
    </div>

    <!-- Text Preview -->
    <div v-else-if="isText" class="w-full h-full">
      <pre class="w-full h-full p-4 bg-gray-50 rounded border overflow-auto text-sm font-mono">{{ textContent }}</pre>
    </div>

    <!-- Video Preview -->
    <div v-else-if="isVideo" class="w-full h-full flex items-center justify-center">
      <video
        :src="previewUrl"
        controls
        class="max-w-full max-h-full"
        @error="handlePreviewError"
      />
    </div>

    <!-- Audio Preview -->
    <div v-else-if="isAudio" class="w-full flex items-center justify-center">
      <audio
        :src="previewUrl"
        controls
        class="w-full"
        @error="handlePreviewError"
      />
    </div>

    <!-- Not Previewable -->
    <div v-else class="text-center p-8">
      <UIcon name="i-heroicons-document" class="h-16 w-16 text-gray-400 mx-auto mb-4" />
      <p class="text-gray-600 font-medium mb-2">ไม่สามารถดู Preview ได้</p>
      <p class="text-gray-500 text-sm">กรุณาดาวน์โหลดไฟล์เพื่อดูเนื้อหา</p>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  bucket: string
  objectName: string
  contentType?: string
}

const props = defineProps<Props>()

const { token } = useAuth()

const previewUrl = ref('')
const textContent = ref('')
const previewError = ref(false)

const isImage = computed(() => {
  if (!props.contentType) return false
  return props.contentType.startsWith('image/')
})

const isPDF = computed(() => {
  if (!props.contentType) return false
  return props.contentType === 'application/pdf'
})

const isText = computed(() => {
  if (!props.contentType) return false
  return props.contentType.startsWith('text/') || 
         props.contentType === 'application/json' ||
         props.contentType === 'application/xml'
})

const isVideo = computed(() => {
  if (!props.contentType) return false
  return props.contentType.startsWith('video/')
})

const isAudio = computed(() => {
  if (!props.contentType) return false
  return props.contentType.startsWith('audio/')
})

const canPreview = computed(() => {
  return isImage.value || isPDF.value || isText.value || isVideo.value || isAudio.value
})

onMounted(async () => {
  if (!canPreview.value) return

  try {
    // Fetch file with Authorization header
    const downloadUrl = `/api/storage/download?bucket=${encodeURIComponent(props.bucket)}&objectName=${encodeURIComponent(props.objectName)}`
    
    const response = await fetch(downloadUrl, {
      headers: {
        Authorization: `Bearer ${token.value}`,
      },
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    // For text files, read as text
    if (isText.value) {
      const text = await response.text()
      textContent.value = text.length > 10000 ? text.substring(0, 10000) + '\n\n... (truncated)' : text
    } else {
      // For binary files (images, videos, PDFs, audio), create blob URL
      const blob = await response.blob()
      previewUrl.value = window.URL.createObjectURL(blob)
    }
  } catch (error) {
    console.error('Failed to load preview:', error)
    previewError.value = true
  }
})

// Cleanup blob URL when component unmounts
onUnmounted(() => {
  if (previewUrl.value && previewUrl.value.startsWith('blob:')) {
    window.URL.revokeObjectURL(previewUrl.value)
  }
})

const handleImageError = () => {
  previewError.value = true
}

const handlePreviewError = () => {
  previewError.value = true
}
</script>

