<script setup>
useHead({
  title: 'API Documentation - Swagger UI',
  meta: [
    { name: 'description', content: 'MinIO Bucket Management API Documentation' },
  ],
})

// Redirect to Swagger UI
onMounted(() => {
  navigateTo('/api/swagger', { external: true })
})
</script>

<template>
  <div class="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#EFE7DD] to-[#F5EDE3]">
    <div class="text-center space-y-4">
      <UIcon name="i-heroicons-arrow-path-20-solid" class="h-12 w-12 mx-auto text-[#8D6E63] animate-spin" />
      <p class="text-lg font-semibold text-[#5D4037]">Loading API Documentation...</p>
    </div>
  </div>
</template>

