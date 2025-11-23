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
    // สร้าง presigned URL สำหรับ preview
    const shareData = await $fetch('/api/storage/share', {
      params: {
        bucket: props.bucket,
        objectName: props.objectName,
        expiresIn: 3600, // 1 hour
      },
    })
    previewUrl.value = shareData.url

    // ถ้าเป็น text file ให้โหลดเนื้อหา
    if (isText.value) {
      try {
        const response = await fetch(shareData.url)
        const text = await response.text()
        // จำกัดความยาวเพื่อไม่ให้โหลดช้า
        textContent.value = text.length > 10000 ? text.substring(0, 10000) + '\n\n... (truncated)' : text
      } catch (e) {
        console.error('Failed to load text content:', e)
        previewError.value = true
      }
    }
  } catch (error) {
    console.error('Failed to generate preview URL:', error)
    previewError.value = true
  }
})

const handleImageError = () => {
  previewError.value = true
}

const handlePreviewError = () => {
  previewError.value = true
}
</script>

