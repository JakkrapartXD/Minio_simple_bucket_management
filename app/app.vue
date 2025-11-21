<script setup>
// Ensure CSS is loaded
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-[#EFE7DD] via-[#F5EDE3] to-[#EFE7DD] text-[#2C2A26] dark:from-[#1E1C19] dark:via-[#252320] dark:to-[#1E1C19] transition-colors duration-300">
    <NuxtLoadingIndicator color="#8D6E63" />
    <NuxtLayout name="dashboard">
      <NuxtPage />
    </NuxtLayout>
    
  </div>
</template>
