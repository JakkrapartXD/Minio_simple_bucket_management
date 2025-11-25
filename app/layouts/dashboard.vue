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
            <li v-for="bucket in filteredBuckets" :key="bucket.name" class="group relative">
              <button
                class="w-full flex items-center gap-3 px-4 py-2 rounded-lg text-sm transition truncate"
                :class="bucket.name === selectedBucket
                  ? 'bg-[#8D6E63] text-white shadow-md'
                  : 'text-[#D7CCC8] hover:bg-[#6D4C41]/60 hover:text-white'"
                @click="handleSelectBucket(bucket.name)"
              >
                🪣 <span class="truncate flex-1 text-left">{{ bucket.name }}</span>
              </button>
              <button
                class="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 px-2 py-1 rounded text-xs transition-opacity"
                :class="bucket.name === selectedBucket
                  ? 'text-white hover:bg-[#5D4037]'
                  : 'text-[#D7CCC8] hover:bg-[#6D4C41]/80'"
                @click.stop="handleEditBucket(bucket.name)"
                title="Edit Bucket"
              >
                <Icon name="pepicons-pencil:pen" class="h-4 w-4" />
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

    <!-- Edit Bucket Modal -->
    <div 
      v-if="showEditBucketModal && editingBucket"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      @click.self="showEditBucketModal = false"
    >
      <div class="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        <!-- Header -->
        <div class="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h3 class="text-lg font-semibold flex items-center gap-2">
            <UIcon name="i-heroicons-cog-6-tooth" class="h-5 w-5 text-[#8D6E63]" />
            Edit Bucket: {{ editingBucket }}
          </h3>
          <button
            class="text-gray-400 hover:text-gray-600 transition-colors"
            @click="showEditBucketModal = false"
          >
            <UIcon name="i-heroicons-x-mark" class="h-5 w-5" />
          </button>
        </div>

        <!-- Body -->
        <div class="px-6 py-4 space-y-4">
          <!-- Privacy Policy -->
          <div>
            <label class="text-sm font-medium text-gray-700 mb-2 block">
              Privacy Policy
            </label>
            <select
              v-model="bucketPolicy"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#8D6E63]"
              :disabled="loadingBucketPolicy"
            >
              <option value="private">Private</option>
              <option value="public-read">Public Read</option>
              <option value="authenticated-read">Authenticated Read</option>
            </select>
            <p class="text-xs text-gray-500 mt-1">
              <span v-if="bucketPolicy === 'private'">Only you can access this bucket</span>
              <span v-else-if="bucketPolicy === 'public-read'">Anyone can read objects in this bucket</span>
              <span v-else-if="bucketPolicy === 'authenticated-read'">Only authenticated users can read objects</span>
            </p>
          </div>

          <!-- Delete Bucket Section -->
          <div class="pt-4 border-t border-gray-200">
            <h4 class="text-sm font-medium text-red-600 mb-2">Danger Zone</h4>
            <button
              class="w-full px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              :disabled="deletingBucket"
              @click="showDeleteConfirm = true"
            >
              <UIcon name="i-heroicons-trash" class="h-4 w-4 inline-block mr-2" />
              Delete Bucket
            </button>
          </div>
        </div>

        <!-- Footer -->
        <div class="flex justify-end gap-2 px-6 py-4 border-t border-gray-200">
          <button
            class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            @click="showEditBucketModal = false"
          >
            Cancel
          </button>
          <button
            class="px-4 py-2 text-sm font-medium text-white bg-[#8D6E63] rounded-md hover:bg-[#A1887F] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            :disabled="savingPolicy || bucketPolicy === currentBucketPolicy"
            @click="handleSavePolicy"
          >
            {{ savingPolicy ? 'Saving...' : 'Save Changes' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Delete Bucket Confirmation Modal -->
    <div 
      v-if="showDeleteConfirm && editingBucket"
      class="fixed inset-0 z-[60] flex items-center justify-center bg-black/50"
      @click.self="showDeleteConfirm = false"
    >
      <div class="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        <!-- Header -->
        <div class="flex items-center justify-between px-6 py-4 border-b border-red-200 bg-red-50">
          <h3 class="text-lg font-semibold text-red-600 flex items-center gap-2">
            <UIcon name="i-heroicons-exclamation-triangle" class="h-5 w-5" />
            Delete Bucket
          </h3>
          <button
            class="text-gray-400 hover:text-gray-600 transition-colors"
            @click="showDeleteConfirm = false"
          >
            <UIcon name="i-heroicons-x-mark" class="h-5 w-5" />
          </button>
        </div>

        <!-- Body -->
        <div class="px-6 py-4 space-y-4">
          <div v-if="loadingBucketStats" class="text-sm text-gray-600">
            Loading bucket information...
          </div>
          <div v-else>
            <p class="text-sm text-gray-700 mb-4">
              Are you sure you want to delete bucket <strong>"{{ editingBucket }}"</strong>?
            </p>
            <div class="bg-yellow-50 border border-yellow-200 rounded-md p-3 mb-4">
              <p class="text-sm text-yellow-800">
                ⚠️ This bucket contains <strong>{{ bucketObjectCount }}</strong> object{{ bucketObjectCount !== 1 ? 's' : '' }}.
                All objects will be permanently deleted.
              </p>
            </div>
            <div>
              <label class="text-sm font-medium text-gray-700 mb-1 block">
                Type the bucket name to confirm deletion:
              </label>
              <input
                v-model="deleteBucketConfirm"
                type="text"
                placeholder="Enter bucket name"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                @keyup.enter="deleteBucketConfirm === editingBucket && handleDeleteBucket()"
              />
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="flex justify-end gap-2 px-6 py-4 border-t border-gray-200">
          <button
            class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            @click="showDeleteConfirm = false; deleteBucketConfirm = ''"
          >
            Cancel
          </button>
          <button
            class="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            :disabled="deletingBucket || deleteBucketConfirm !== editingBucket"
            @click="handleDeleteBucket"
          >
            {{ deletingBucket ? 'Deleting...' : 'Delete Bucket' }}
          </button>
        </div>
      </div>
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
  
  // Edit bucket modal
  const showEditBucketModal = ref(false)
  const editingBucket = ref<string | null>(null)
  const bucketPolicy = ref<'private' | 'public-read' | 'authenticated-read'>('private')
  const currentBucketPolicy = ref<'private' | 'public-read' | 'authenticated-read'>('private')
  const loadingBucketPolicy = ref(false)
  const savingPolicy = ref(false)
  
  // Delete bucket
  const showDeleteConfirm = ref(false)
  const deletingBucket = ref(false)
  const deleteBucketConfirm = ref('')
  const bucketObjectCount = ref(0)
  const loadingBucketStats = ref(false)

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

  // Edit bucket functions
  const handleEditBucket = async (bucketName: string) => {
    editingBucket.value = bucketName
    showEditBucketModal.value = true
    loadingBucketPolicy.value = true
    
    try {
      // Load current policy
      const policyResponse = await $fetch('/api/storage/bucket.policy', {
        params: { bucket: bucketName }
      })
      const policyType = policyResponse.policyType as 'private' | 'public-read' | 'authenticated-read'
      bucketPolicy.value = policyType || 'private'
      currentBucketPolicy.value = policyType || 'private'
    } catch (error: any) {
      console.error('Failed to load bucket policy:', error)
      bucketPolicy.value = 'private'
      currentBucketPolicy.value = 'private'
    } finally {
      loadingBucketPolicy.value = false
    }
  }

  const handleSavePolicy = async () => {
    if (!editingBucket.value || savingPolicy.value) return
    
    savingPolicy.value = true
    try {
      await $fetch('/api/storage/bucket.policy', {
        method: 'POST',
        body: {
          bucket: editingBucket.value,
          policy: bucketPolicy.value
        }
      })
      currentBucketPolicy.value = bucketPolicy.value
      
      // Close modal first
      showEditBucketModal.value = false
      
      // If we're currently viewing the bucket that was updated, reload the page to refresh policy
      if (selectedBucket.value === editingBucket.value) {
        setTimeout(() => {
          window.location.reload()
        }, 300) // Small delay to close modal first
      }
      
      window.alert('Bucket policy updated successfully!')
    } catch (error: any) {
      window.alert(`Failed to update policy: ${error?.data?.message || error?.message || 'Unknown error'}`)
      // Reset to current policy on error
      bucketPolicy.value = currentBucketPolicy.value
    } finally {
      savingPolicy.value = false
    }
  }

  const handleDeleteBucket = async () => {
    if (!editingBucket.value || deleteBucketConfirm.value !== editingBucket.value || deletingBucket.value) {
      return
    }

    // Load bucket stats first
    if (bucketObjectCount.value === 0 && !loadingBucketStats.value) {
      loadingBucketStats.value = true
      try {
        const stats = await $fetch('/api/storage/bucket.stats', {
          params: { bucket: editingBucket.value }
        })
        bucketObjectCount.value = stats.objectCount
      } catch (error) {
        console.error('Failed to load bucket stats:', error)
      } finally {
        loadingBucketStats.value = false
      }
      return // Show stats first, user needs to confirm again
    }

    deletingBucket.value = true
    try {
      await $fetch('/api/storage/bucket.delete', {
        method: 'POST',
        body: {
          bucket: editingBucket.value
        }
      })
      
      // Refresh buckets list
      await refreshBuckets()
      
      // Close modals
      showDeleteConfirm.value = false
      showEditBucketModal.value = false
      editingBucket.value = null
      deleteBucketConfirm.value = ''
      
      // If deleted bucket was selected, navigate to first bucket
      const deletedBucketName = editingBucket.value
      if (selectedBucket.value === deletedBucketName) {
        const remainingBuckets = buckets.value.filter(b => b.name !== deletedBucketName)
        const firstBucket = remainingBuckets[0]
        if (firstBucket) {
          router.push(`/storage/${encodeURIComponent(firstBucket.name)}`)
        } else {
          router.push('/')
        }
      }
      
      window.alert(`Bucket "${deletedBucketName}" deleted successfully!`)
    } catch (error: any) {
      window.alert(`Failed to delete bucket: ${error?.data?.message || error?.message || 'Unknown error'}`)
    } finally {
      deletingBucket.value = false
    }
  }

  // Watch showDeleteConfirm to load stats when modal opens
  watch(showDeleteConfirm, async (show) => {
    if (show && editingBucket.value) {
      loadingBucketStats.value = true
      deleteBucketConfirm.value = ''
      try {
        const stats = await $fetch('/api/storage/bucket.stats', {
          params: { bucket: editingBucket.value }
        })
        bucketObjectCount.value = stats.objectCount
      } catch (error: any) {
        console.error('Failed to load bucket stats:', error)
        bucketObjectCount.value = 0
      } finally {
        loadingBucketStats.value = false
      }
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
  