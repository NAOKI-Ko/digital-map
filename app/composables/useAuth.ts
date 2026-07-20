import type { LoginInput } from '~~/shared/schemas/auth'

export function useAuth() {
  const session = useUserSession()

  async function login(credentials: LoginInput) {
    await $fetch('/api/auth/login', {
      method: 'POST',
      body: credentials,
    })
    await session.fetch()
  }

  async function logout() {
    await $fetch('/api/auth/logout', { method: 'POST' })
    await session.fetch()
    return navigateTo('/admin/login')
  }

  return {
    ...session,
    login,
    logout,
  }
}
