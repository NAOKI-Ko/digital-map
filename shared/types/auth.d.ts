declare module '#auth-utils' {
  interface User {
    id: string
    tenantId: string
    email: string
    role: 'admin'
  }

  interface UserSession {
    loggedInAt: number
  }
}

export {}
