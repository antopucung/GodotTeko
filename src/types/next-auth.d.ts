import "next-auth"
import "next-auth/jwt"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      name?: string | null
      email?: string | null
      image?: string | null
      role: 'user' | 'partner' | 'admin'
    }
  }

  interface User {
    id: string
    name?: string | null
    email?: string | null
    image?: string | null
    role: 'user' | 'partner' | 'admin'
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string
    role: 'user' | 'partner' | 'admin'
  }
}
