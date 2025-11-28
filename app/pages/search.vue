<template>
  <div class="min-h-screen bg-[#F5EDE3] p-8">
    <!-- Header -->
    <div class="max-w-4xl mx-auto">
      <div class="text-center mb-12">
        <h1 class="text-4xl font-bold text-[#3E2723] mb-2">
          🔍 File Search
        </h1>
        <p class="text-[#A1887F]">Search files by name or content</p>
      </div>

      <!-- Search Bar -->
      <div class="mb-8">
        <div class="relative">
          <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Icon name="heroicons:magnifying-glass" class="h-6 w-6 text-[#8D6E63]" />
          </div>
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search files by name or content..."
            class="w-full pl-14 pr-4 py-4 text-lg rounded-xl border-2 border-[#D7CCC8] bg-white focus:outline-none focus:border-[#8D6E63] transition-colors shadow-md"
            @input="handleSearchInput"
            @keyup.enter="performSearch"
          />
        </div>
      </div>

      <!-- Results Info -->
      <div v-if="searchPerformed && !searching" class="mb-4 text-sm text-[#A1887F]">
        <span v-if="results.total > 0">
          About {{ results.total }} result{{ results.total !== 1 ? 's' : '' }}
        </span>
        <span v-else>
          No results found
        </span>
      </div>

      <!-- Loading State -->
      <div v-if="searching" class="space-y-4">
        <div v-for="i in 3" :key="i" class="bg-white rounded-lg p-6 shadow-md animate-pulse">
          <div class="h-6 bg-[#EFE7DD] rounded w-3/4 mb-3"></div>
          <div class="h-4 bg-[#EFE7DD] rounded w-1/2 mb-3"></div>
          <div class="h-4 bg-[#EFE7DD] rounded w-full mb-2"></div>
          <div class="h-4 bg-[#EFE7DD] rounded w-5/6"></div>
        </div>
      </div>

      <!-- Search Results -->
      <div v-else-if="results.hits.length > 0" class="space-y-4">
        <div
          v-for="hit in results.hits"
          :key="hit.id"
          class="bg-white rounded-lg p-6 shadow-md hover:shadow-lg transition-shadow cursor-pointer group"
          @click="handleResultClick(hit)"
        >
          <!-- File Icon and Name -->
          <div class="flex items-start gap-3 mb-2">
            <div class="text-2xl mt-1">
              {{ getFileIcon(hit.contentType) }}
            </div>
            <div class="flex-1 min-w-0">
              <h3 class="text-lg font-semibold text-[#3E2723] group-hover:text-[#8D6E63] transition-colors break-words">
                <span v-if="hit.highlights?.fileName" v-html="hit.highlights.fileName[0]"></span>
                <span v-else>{{ hit.fileName }}</span>
              </h3>
              
              <!-- Breadcrumb Path -->
              <div class="text-sm text-[#A1887F] mt-1 flex items-center gap-1 flex-wrap">
                <Icon name="heroicons:folder" class="h-4 w-4" />
                <span class="font-medium">{{ hit.bucket }}</span>
                <span>/</span>
                <span class="truncate">{{ hit.filePath }}</span>
              </div>

              <!-- Content Snippet -->
              <div v-if="hit.highlights?.['attachment.content']" class="mt-3 text-sm text-[#5D4037] leading-relaxed">
                <div v-for="(snippet, idx) in hit.highlights['attachment.content']" :key="idx" class="mb-1">
                  <span v-html="snippet"></span>
                </div>
              </div>

              <!-- File Metadata -->
              <div class="flex items-center gap-4 mt-3 text-xs text-[#A1887F]">
                <span class="font-medium">{{ formatSize(hit.size) }}</span>
                <span>•</span>
                <span class="px-2 py-0.5 bg-[#EFE7DD] rounded">{{ getFileType(hit.contentType) }}</span>
                <span>•</span>
                <span>{{ formatDate(hit.uploadedAt) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-else-if="searchPerformed && !searching" class="text-center py-16">
        <div class="text-6xl mb-4">🔍</div>
        <h3 class="text-xl font-semibold text-[#3E2723] mb-2">No results found</h3>
        <p class="text-[#A1887F]">Try different keywords or check your spelling</p>
      </div>

      <!-- Initial State -->
      <div v-else class="text-center py-16">
        <div class="text-6xl mb-4">📁</div>
        <h3 class="text-xl font-semibold text-[#3E2723] mb-2">Start searching</h3>
        <p class="text-[#A1887F]">Enter keywords to find files by name or content</p>
      </div>

      <!-- Pagination -->
      <div v-if="results.totalPages > 1" class="mt-8 flex justify-center items-center gap-2">
        <button
          :disabled="currentPage === 1"
          class="px-4 py-2 rounded-lg bg-white border border-[#D7CCC8] text-[#5D4037] hover:bg-[#EFE7DD] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          @click="goToPage(currentPage - 1)"
        >
          ◀ Previous
        </button>

        <div class="flex gap-1">
          <button
            v-for="page in visiblePages"
            :key="page"
            :class="[
              'px-4 py-2 rounded-lg transition-colors',
              page === currentPage
                ? 'bg-[#8D6E63] text-white font-semibold'
                : 'bg-white border border-[#D7CCC8] text-[#5D4037] hover:bg-[#EFE7DD]'
            ]"
            @click="goToPage(page)"
          >
            {{ page }}
          </button>
        </div>

        <button
          :disabled="currentPage === results.totalPages"
          class="px-4 py-2 rounded-lg bg-white border border-[#D7CCC8] text-[#5D4037] hover:bg-[#EFE7DD] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          @click="goToPage(currentPage + 1)"
        >
          Next ▶
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { formatSize } from '~/utils/format'

definePageMeta({
  layout: 'dashboard',
})

const { token } = useAuth()
const router = useRouter()

const searchQuery = ref('')
const searching = ref(false)
const searchPerformed = ref(false)
const currentPage = ref(1)
const pageSize = 10

const results = ref({
  total: 0,
  hits: [] as any[],
  totalPages: 0,
})

let searchTimeout: NodeJS.Timeout | null = null

/**
 * Handle search input with debounce
 */
const handleSearchInput = () => {
  if (searchTimeout) {
    clearTimeout(searchTimeout)
  }
  
  searchTimeout = setTimeout(() => {
    if (searchQuery.value.trim().length >= 2) {
      currentPage.value = 1
      performSearch()
    }
  }, 500)
}

/**
 * Perform search
 */
const performSearch = async () => {
  const query = searchQuery.value.trim()
  
  if (!query || query.length < 2) {
    searchPerformed.value = false
    results.value = { total: 0, hits: [], totalPages: 0 }
    return
  }

  searching.value = true
  searchPerformed.value = true

  try {
    const data = await $fetch('/api/search/files', {
      params: {
        q: query,
        page: currentPage.value,
        size: pageSize,
      },
      headers: {
        Authorization: `Bearer ${token.value}`,
      },
    })

    results.value = data as any
  } catch (error: any) {
    console.error('Search error:', error)
    window.alert('Search failed: ' + (error?.data?.message || error?.message || 'Unknown error'))
  } finally {
    searching.value = false
  }
}

/**
 * Go to specific page
 */
const goToPage = (page: number) => {
  if (page < 1 || page > results.value.totalPages) return
  currentPage.value = page
  performSearch()
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

/**
 * Calculate visible page numbers
 */
const visiblePages = computed(() => {
  const total = results.value.totalPages
  const current = currentPage.value
  const pages: number[] = []

  if (total <= 7) {
    for (let i = 1; i <= total; i++) {
      pages.push(i)
    }
  } else {
    if (current <= 4) {
      for (let i = 1; i <= 5; i++) pages.push(i)
      pages.push(total)
    } else if (current >= total - 3) {
      pages.push(1)
      for (let i = total - 4; i <= total; i++) pages.push(i)
    } else {
      pages.push(1)
      for (let i = current - 1; i <= current + 1; i++) pages.push(i)
      pages.push(total)
    }
  }

  return pages
})

/**
 * Get file icon based on content type
 */
const getFileIcon = (contentType: string): string => {
  if (contentType.startsWith('image/')) return '🖼️'
  if (contentType.startsWith('video/')) return '🎥'
  if (contentType.startsWith('audio/')) return '🎵'
  if (contentType.includes('pdf')) return '📄'
  if (contentType.includes('word') || contentType.includes('document')) return '📝'
  if (contentType.includes('excel') || contentType.includes('spreadsheet')) return '📊'
  if (contentType.includes('powerpoint') || contentType.includes('presentation')) return '📽️'
  if (contentType.includes('zip') || contentType.includes('archive')) return '📦'
  if (contentType.startsWith('text/')) return '📃'
  return '📄'
}

/**
 * Get file type label
 */
const getFileType = (contentType: string): string => {
  const parts = contentType.split('/')
  if (parts.length === 2) {
    const subtype = parts[1]?.split('.').pop()?.toUpperCase()
    return subtype || parts[1]?.toUpperCase() || 'FILE'
  }
  return contentType.toUpperCase()
}

/**
 * Format date
 */
const formatDate = (dateString: string): string => {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays} days ago`
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`
  
  return date.toLocaleDateString()
}

/**
 * Handle result click - navigate to bucket
 */
const handleResultClick = (hit: any) => {
  router.push(`/storage/${encodeURIComponent(hit.bucket)}`)
}
</script>

<style scoped>
/* Highlight matched text */
:deep(em) {
  background-color: #FFF59D;
  font-style: normal;
  font-weight: 600;
  padding: 0 2px;
  border-radius: 2px;
}
</style>
