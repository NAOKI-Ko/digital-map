declare module '#auth-utils' {
  interface User {
    id: string
    tenantId: string
    email: string
    displayName: string | null
    tenantRole: 'OWNER' | 'MEMBER'
    tenantName: string
    organizations: Array<{
      id: string
      name: string
      role: 'OWNER' | 'MEMBER'
    }>
  }

  interface UserSession {
    loggedInAt: number
  }
}

export {}
