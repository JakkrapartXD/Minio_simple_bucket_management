export default defineNuxtRouteMiddleware(async (to, from) => {
  // Skip middleware for login and register pages
  if (to.path === '/login' || to.path === '/register') {
    return
  }

  // Only run on client-side after hydration
  if (process.client) {
    const token = useCookie('auth-token')
    
    // If no token, redirect to login
    if (!token.value) {
      return navigateTo('/login')
    }
  }
})

