<script setup lang="ts">
const router = useRouter()

const { data, pending } = await useAsyncData('buckets-initial', () =>
  $fetch('/api/storage/buckets'),
)

watchEffect(() => {
  if (import.meta.client) {
    const buckets = data.value
    if (!pending.value && buckets && buckets.length > 0 && buckets[0]) {
      router.replace(`/storage/${encodeURIComponent(buckets[0].name)}`)
    }
  }
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
