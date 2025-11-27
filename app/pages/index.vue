<script setup lang="ts">
const router = useRouter()
const { token, fetchUser, isAuthenticated } = useAuth()

// Ensure user is authenticated
await fetchUser()

if (!isAuthenticated.value) {
  router.replace('/login')
} else {
  const { data, pending } = await useAsyncData('buckets-initial', () =>
    $fetch('/api/storage/buckets', {
      headers: {
        Authorization: `Bearer ${token.value}`,
      },
    }),
  )

  watchEffect(() => {
    if (import.meta.client) {
      const buckets = data.value
      if (!pending.value && buckets && buckets.length > 0 && buckets[0]) {
        router.replace(`/storage/${encodeURIComponent(buckets[0].name)}`)
      }
    }
  })
}

definePageMeta({
  layout: 'dashboard',
})
</script>

<template>
  <div class="flex min-h-screen items-center justify-center bg-[#EFE7DD] text-[#5D4037] dark:bg-[#1E1C19] dark:text-[#EFE7DD]">
    <div class="text-center">
      <p class="text-sm uppercase tracking-[0.4em] text-[#A1887F]">Bucket Manager</p>
      <h1 class="mt-2 text-2xl font-semibold">Loading your buckets…</h1>
    </div>
  </div>
</template>
