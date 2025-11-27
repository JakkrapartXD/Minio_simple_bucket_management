export interface User {
  id: number
  username: string
  role: 'ADMIN' | 'USER'
}

export const useAuth = () => {
  const user = useState<User | null>('auth-user', () => null)
  const token = useCookie<string | null>('auth-token', {
    maxAge: 60 * 60 * 24 * 7, // 7 days
  })

  const isAuthenticated = computed(() => !!user.value)
  const isAdmin = computed(() => user.value?.role === 'ADMIN')

  const login = async (username: string, password: string) => {
    try {
      const response = await $fetch<{ token: string; user: User }>('/api/auth/login', {
        method: 'POST',
        body: { username, password },
      })

      token.value = response.token
      user.value = response.user

      return { success: true }
    } catch (error: any) {
      return { 
        success: false, 
        error: error.data?.statusMessage || 'Login failed' 
      }
    }
  }

  const register = async (username: string, password: string) => {
    try {
      const response = await $fetch<{ token: string; user: User }>('/api/auth/register', {
        method: 'POST',
        body: { username, password },
      })

      token.value = response.token
      user.value = response.user

      return { success: true }
    } catch (error: any) {
      return { 
        success: false, 
        error: error.data?.statusMessage || 'Registration failed' 
      }
    }
  }

  const logout = () => {
    token.value = null
    user.value = null
    navigateTo('/login')
  }

  const fetchUser = async () => {
    if (!token.value) {
      user.value = null
      return
    }

    try {
      const response = await $fetch<User>('/api/auth/me', {
        headers: {
          Authorization: `Bearer ${token.value}`,
        },
      })

      user.value = response
    } catch (error) {
      // If token is invalid, clear it
      token.value = null
      user.value = null
    }
  }

  return {
    user,
    token,
    isAuthenticated,
    isAdmin,
    login,
    register,
    logout,
    fetchUser,
  }
}

