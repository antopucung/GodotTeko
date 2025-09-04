import { NextAuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import GitHubProvider from 'next-auth/providers/github'
import CredentialsProvider from 'next-auth/providers/credentials'
import { compare, hash } from 'bcryptjs'
import { client } from './sanity'

// User type matching our Sanity schema
interface SanityUser {
  _id: string
  name: string
  email: string
  password?: string
  image?: string
  role: 'user' | 'partner' | 'admin'
  verified: boolean
  provider: 'credentials' | 'google' | 'github'
  providerId?: string
  bio?: string
  website?: string
  company?: string
  location?: string
  socialLinks?: {
    twitter?: string
    linkedin?: string
    dribbble?: string
    behance?: string
  }
  preferences?: {
    newsletter: boolean
    notifications: boolean
    theme: string
  }
  stats?: {
    totalPurchases: number
    totalSpent: number
    favoriteCategories: string[]
    lastLoginAt: string
  }
  partnerInfo?: {
    approved: boolean
    approvedAt?: string
    commissionRate: number
    totalEarnings: number
    productsPublished: number
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    }),
    GitHubProvider({
      clientId: process.env.GITHUB_ID || '',
      clientSecret: process.env.GITHUB_SECRET || '',
    }),
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        try {
          // Find user in Sanity
          const user = await getUserByEmail(credentials.email)

          if (!user || !user.password) {
            return null
          }

          const isPasswordValid = await compare(credentials.password, user.password)

          if (!isPasswordValid) {
            return null
          }

          // Update last login
          await updateUserLastLogin(user._id)

          return {
            id: user._id,
            email: user.email,
            name: user.name,
            image: user.image,
            role: user.role || 'user',
          }
        } catch (error) {
          console.error('Auth error:', error)
          return null
        }
      }
    })
  ],
  pages: {
    signIn: '/auth/signin',
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === 'google' || account?.provider === 'github') {
        try {
          // Check if user exists in Sanity
          let existingUser = await getUserByEmail(user.email!)

          if (!existingUser) {
            // Create new user from OAuth
            existingUser = await createOAuthUser({
              email: user.email!,
              name: user.name!,
              image: user.image,
              provider: account.provider as 'google' | 'github',
              providerId: account.providerAccountId,
            })
          } else {
            // Update existing user's image and last login
            await updateUserProfile(existingUser._id, {
              image: user.image,
              lastLoginAt: new Date().toISOString()
            })
          }

          // Add user ID to the user object for session
          user.id = existingUser._id
          ;(user as any).role = existingUser.role

          return true
        } catch (error) {
          console.error('OAuth sign in error:', error)
          return false
        }
      }
      return true
    },
    async jwt({ token, user, account }) {
      if (user) {
        token.role = (user as any).role || 'user'
        token.id = user.id
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id
        ;(session.user as any).role = token.role
      }
      return session
    },
  },
  session: {
    strategy: 'jwt',
  },
  secret: process.env.NEXTAUTH_SECRET,
}

// Sanity user management functions
export async function getUserByEmail(email: string): Promise<SanityUser | null> {
  try {
    const user = await client.fetch(
      `*[_type == "user" && email == $email][0] {
        _id,
        name,
        email,
        password,
        image,
        role,
        verified,
        provider,
        providerId,
        "lastLoginAt": stats.lastLoginAt
      }`,
      { email }
    )
    return user || null
  } catch (error) {
    console.error('Error fetching user by email:', error)
    return null
  }
}

export async function getUserById(id: string): Promise<SanityUser | null> {
  try {
    const user = await client.fetch(
      `*[_type == "user" && _id == $id][0] {
        _id,
        name,
        email,
        image,
        role,
        verified,
        provider,
        bio,
        website,
        company,
        location,
        socialLinks,
        preferences,
        stats,
        partnerInfo
      }`,
      { id }
    )
    return user || null
  } catch (error) {
    console.error('Error fetching user by ID:', error)
    return null
  }
}

export async function createUser(userData: {
  email: string
  password: string
  name: string
  role?: 'user' | 'partner' | 'admin'
}): Promise<SanityUser> {
  const hashedPassword = await hash(userData.password, 12)

  const newUser = {
    _type: 'user',
    name: userData.name,
    email: userData.email,
    password: hashedPassword,
    role: userData.role || 'user',
    verified: false,
    provider: 'credentials' as const,
    preferences: {
      newsletter: true,
      notifications: true,
      theme: 'system'
    },
    stats: {
      totalPurchases: 0,
      totalSpent: 0,
      favoriteCategories: [],
      lastLoginAt: new Date().toISOString()
    }
  }

  try {
    const result = await client.create(newUser)
    return result as SanityUser
  } catch (error) {
    console.error('Error creating user:', error)
    throw new Error('Failed to create user')
  }
}

export async function createOAuthUser(userData: {
  email: string
  name: string
  image?: string | null
  provider: 'google' | 'github'
  providerId: string
}): Promise<SanityUser> {
  const newUser = {
    _type: 'user',
    name: userData.name,
    email: userData.email,
    image: userData.image || undefined,
    role: 'user' as const,
    verified: true, // OAuth users are pre-verified
    provider: userData.provider,
    providerId: userData.providerId,
    preferences: {
      newsletter: true,
      notifications: true,
      theme: 'system'
    },
    stats: {
      totalPurchases: 0,
      totalSpent: 0,
      favoriteCategories: [],
      lastLoginAt: new Date().toISOString()
    }
  }

  try {
    const result = await client.create(newUser)
    return result as SanityUser
  } catch (error) {
    console.error('Error creating OAuth user:', error)
    throw new Error('Failed to create OAuth user')
  }
}

export async function updateUserLastLogin(userId: string): Promise<void> {
  try {
    await client
      .patch(userId)
      .set({
        'stats.lastLoginAt': new Date().toISOString()
      })
      .commit()
  } catch (error) {
    console.error('Error updating last login:', error)
  }
}

export async function updateUserProfile(userId: string, updates: Partial<{
  name: string
  image: string | null
  bio: string
  website: string
  company: string
  location: string
  socialLinks: any
  preferences: any
  lastLoginAt: string
}>): Promise<void> {
  try {
    await client
      .patch(userId)
      .set(updates)
      .commit()
  } catch (error) {
    console.error('Error updating user profile:', error)
    throw new Error('Failed to update user profile')
  }
}

// Role management helpers
export function hasRole(userRole: string, requiredRole: 'user' | 'partner' | 'admin'): boolean {
  const roleHierarchy = { user: 0, partner: 1, admin: 2 }
  const userLevel = roleHierarchy[userRole as keyof typeof roleHierarchy] ?? -1
  const requiredLevel = roleHierarchy[requiredRole]
  return userLevel >= requiredLevel
}

export function isAdmin(userRole: string): boolean {
  return userRole === 'admin'
}

export function isPartner(userRole: string): boolean {
  return userRole === 'partner' || userRole === 'admin'
}

// Email verification (for future implementation)
export async function verifyUserEmail(userId: string): Promise<void> {
  try {
    await client
      .patch(userId)
      .set({ verified: true })
      .commit()
  } catch (error) {
    console.error('Error verifying user email:', error)
    throw new Error('Failed to verify email')
  }
}
