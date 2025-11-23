<!-- layouts/dashboard.vue -->
<template>
    <div class="min-h-screen flex bg-[#F5EDE3] text-[#2C2A26]">
      <!-- Sidebar -->
      <aside class="w-72 bg-gradient-to-b from-[#3E2723] via-[#5D4037] to-[#4E342E] flex flex-col border-r border-[#6D4C41]/50">
  
        <!-- Logo -->
        <div class="px-6 pt-6 pb-4">
          <h1 class="text-xl font-semibold">
            <span class="text-[#D7CCC8]">MINIO</span>
            <span class="block text-sm text-[#BCAAA4] font-light tracking-wide mt-1">
              OBJECT STORE
            </span>
          </h1>
        </div>
  
        <!-- Create Bucket btn -->
        <div class="px-4">
          <button
            class="w-full inline-flex items-center gap-3 rounded-lg bg-[#8D6E63] hover:bg-[#A1887F] text-white font-medium px-3 py-2 text-sm transition-colors shadow-md hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed"
            :disabled="creatingBucket"
            @click="showCreateBucketModal = true"
          >
            <span class="text-lg">+</span>
            Create Bucket
          </button>
        </div>
  
        <!-- Filter Search -->
        <div class="px-4 mt-4">
          <div class="flex items-center gap-3 rounded-lg bg-[#5D4037]/60 border border-[#6D4C41]/50 px-3 py-2 text-sm">
            <span class="opacity-60">🔍</span>
            <input
              v-model="search"
              type="text"
              placeholder="Filter Buckets"
              class="bg-transparent outline-none w-full placeholder:text-[#A1887F] text-[#D7CCC8] text-sm" />
          </div>
        </div>
  
        <!-- Bucket List -->
        <nav class="px-2 mt-5 flex-1 overflow-y-auto">
          <p class="px-4 text-xs uppercase tracking-wide text-[#A1887F] mb-2">Buckets</p>
  
          <div v-if="bucketsPending" class="px-4 text-sm text-[#D7CCC8]/80">
            Loading buckets...
          </div>
          <div v-else-if="!filteredBuckets.length" class="px-4 text-sm text-[#D7CCC8]/70">
            No buckets found
          </div>
          <ul v-else class="space-y-1">
            <li v-for="bucket in filteredBuckets" :key="bucket.name">
              <button
                class="w-full flex items-center gap-3 px-4 py-2 rounded-lg text-sm transition truncate"
                :class="bucket.name === selectedBucket
                  ? 'bg-[#8D6E63] text-white shadow-md'
                  : 'text-[#D7CCC8] hover:bg-[#6D4C41]/60 hover:text-white'"
                @click="handleSelectBucket(bucket.name)"
              >
                🪣 <span class="truncate">{{ bucket.name }}</span>
              </button>
            </li>
          </ul>
        </nav>
  
        <!-- Footer -->
        <!-- <div class="border-t border-[#6D4C41] px-4 py-3 text-sm text-[#A1887F] space-y-1">
          <button class="w-full text-left hover:text-[#D7CCC8]">Documentation</button>
          <button class="w-full text-left hover:text-[#D7CCC8]">License</button>
          <button class="w-full text-left hover:text-[#D7CCC8]">Sign Out</button>
        </div> -->
  
      </aside>
  
      <!-- ⭐ Page content here -->
      <main class="flex-1 bg-[#EFE7DD]">
        <NuxtPage />
      </main>
    </div>

    <!-- Create Bucket Modal -->
    <div 
      v-if="showCreateBucketModal"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      @click.self="showCreateBucketModal = false"
    >
      <div class="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        <!-- Header -->
        <div class="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h3 class="text-lg font-semibold flex items-center gap-2">
            <span class="text-2xl">🪣</span>
            Create New Bucket
          </h3>
          <button
            class="text-gray-400 hover:text-gray-600 transition-colors"
            @click="showCreateBucketModal = false"
          >
            <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- Body -->
        <div class="px-6 py-4 space-y-4">
          <div>
            <label class="text-sm font-medium text-gray-700 mb-1 block">
              Bucket Name <span class="text-red-500">*</span>
            </label>
            <input
              v-model="newBucketName"
              type="text"
              placeholder="Enter bucket name (3-63 characters)"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#8D6E63]"
              @keyup.enter="handleCreateBucketSubmit"
            />
            <!-- <p class="text-xs text-gray-500 mt-1">
              Use 3-63 lowercase letters, numbers, dots, or hyphens. Must start and end with a letter or number.
            </p> -->
            <p v-if="bucketNameError" class="text-xs text-red-500 mt-1">
              {{ bucketNameError }}
            </p>
          </div>
        </div>

        <!-- Footer -->
        <div class="flex justify-end gap-2 px-6 py-4 border-t border-gray-200">
          <button
            class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            @click="handleClearBucketName"
          >
            Clear
          </button>
          <button
            class="px-4 py-2 text-sm font-medium text-white bg-[#8D6E63] rounded-md hover:bg-[#A1887F] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            :disabled="creatingBucket || !newBucketName.trim()"
            @click="handleCreateBucketSubmit"
          >
            {{ creatingBucket ? 'Creating...' : 'Create' }}
          </button>
        </div>
      </div>
    </div>
  </template>
  
  <script setup lang="ts">
  const route = useRoute()
  const router = useRouter()

  const search = ref('')
  const creatingBucket = ref(false)
  const showCreateBucketModal = ref(false)
  const newBucketName = ref('')
  const bucketNameError = ref('')

  const selectedBucket = computed(() => route.params.bucket as string | undefined)

  const {
    data: bucketData,
    pending: bucketsPending,
    refresh: refreshBuckets,
  } = await useAsyncData('dashboard-buckets', () => $fetch('/api/storage/buckets'))

  const buckets = computed(() => bucketData.value ?? [])

  watchEffect(() => {
    if (!bucketsPending.value && buckets.value.length) {
      const firstBucket = buckets.value[0]
      if (!selectedBucket.value && firstBucket) {
        router.replace(`/storage/${encodeURIComponent(firstBucket.name)}`)
      } else if (selectedBucket.value) {
        const exists = buckets.value.some((bucket) => bucket.name === selectedBucket.value)
        if (!exists && firstBucket) {
          router.replace(`/storage/${encodeURIComponent(firstBucket.name)}`)
        }
      }
    }
  })

  const filteredBuckets = computed(() => {
    const q = search.value.toLowerCase()
    if (!q) return buckets.value
    return buckets.value.filter((bucket) => bucket.name.toLowerCase().includes(q))
  })

  const handleSelectBucket = (name: string) => {
    router.push(`/storage/${encodeURIComponent(name)}`)
  }

  const validateBucketName = (name: string) => {
    if (!name.trim()) {
      return 'Bucket name is required'
    }
    const normalized = name.trim().toLowerCase()
    const regex = /^[a-z0-9][a-z0-9.-]{1,61}[a-z0-9]$/ // S3-compatible constraints
    if (!regex.test(normalized)) {
      return 'Use 3-63 lowercase letters, numbers, dots, or hyphens'
    }
    if (normalized.includes('..') || normalized.includes('.-') || normalized.includes('-.')) {
      return 'Bucket name cannot contain adjacent periods or hyphen next to period'
    }
    if (/^\d+\.\d+\.\d+\.\d+$/.test(normalized)) {
      return 'Bucket name cannot look like an IP address'
    }
    return null
  }

  const handleCreateBucketSubmit = async () => {
    if (creatingBucket.value) return
    
    const name = newBucketName.value.trim()
    if (!name) {
      bucketNameError.value = 'Bucket name is required'
      return
    }

    const error = validateBucketName(name)
    if (error) {
      bucketNameError.value = error
      return
    }

    bucketNameError.value = ''
    creatingBucket.value = true
    
    try {
      await $fetch('/api/storage/bucket.create', {
        method: 'POST',
        body: { name: name.toLowerCase() },
      })
      await refreshBuckets()
      showCreateBucketModal.value = false
      newBucketName.value = ''
      
      // Navigate to the new bucket
      router.push(`/storage/${encodeURIComponent(name.toLowerCase())}`)
    } catch (err: any) {
      bucketNameError.value = err?.data?.message || err?.message || 'Failed to create bucket'
    } finally {
      creatingBucket.value = false
    }
  }

  const handleClearBucketName = () => {
    newBucketName.value = ''
    bucketNameError.value = ''
  }

  // Watch for input changes to clear error
  watch(newBucketName, () => {
    if (bucketNameError.value) {
      bucketNameError.value = ''
    }
  })
  </script>
  
  <style scoped>
  aside::-webkit-scrollbar {
    width: 5px;
  }
  aside::-webkit-scrollbar-thumb {
    background: rgba(141, 110, 99, 0.5);
    border-radius: 4px;
  }
  aside::-webkit-scrollbar-thumb:hover {
    background: rgba(141, 110, 99, 0.7);
  }
  </style>
  