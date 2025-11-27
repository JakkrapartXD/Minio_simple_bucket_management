<script setup lang="ts">
const { fetchUser } = useAuth()

// Initialize authentication state on client hydration
onMounted(async () => {
  await fetchUser()
})
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-[#EFE7DD] via-[#F5EDE3] to-[#EFE7DD] text-[#2C2A26] dark:from-[#1E1C19] dark:via-[#252320] dark:to-[#1E1C19] transition-colors duration-300">
    <NuxtLoadingIndicator color="#8D6E63" />
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </div>
</template>
