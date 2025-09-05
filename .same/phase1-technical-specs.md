# Phase 1: Enhanced Role System - Technical Specifications

## Overview
Transform the current basic 3-role system (`user`, `partner`, `admin`) into a comprehensive 5-role system with granular permissions to support the GODOT TEKKO ADDITIONAL WORKFLOW vision.

## Current vs. Target Role System

### **Current Roles** (3)
```typescript
type UserRole = 'user' | 'partner' | 'admin'
```

### **Target Roles** (5)
```typescript
type UserRole = 'user' | 'partner' | 'teacher' | 'admin' | 'super_admin'
```

---

## Database Schema Changes

### 1. **User Schema Extensions** (`ui8-clone/sanity/schemas/user.ts`)

```typescript
// Current user schema needs these additions:
{
  name: 'role',
  title: 'User Role',
  type: 'string',
  options: {
    list: [
      { title: 'User', value: 'user' },
      { title: 'Partner Studio', value: 'partner' },
      { title: 'Teacher', value: 'teacher' },
      { title: 'Admin', value: 'admin' },
      { title: 'Super Admin', value: 'super_admin' }
    ]
  },
  initialValue: 'user'
},
{
  name: 'teacherProfile',
  title: 'Teacher Profile',
  type: 'object',
  hidden: ({ document }) => document?.role !== 'teacher',
  fields: [
    {
      name: 'institution',
      title: 'Institution/School',
      type: 'string'
    },
    {
      name: 'subjects',
      title: 'Subjects Taught',
      type: 'array',
      of: [{ type: 'string' }]
    },
    {
      name: 'experience',
      title: 'Years of Experience',
      type: 'number'
    },
    {
      name: 'verified',
      title: 'Verified Teacher',
      type: 'boolean',
      initialValue: false
    },
    {
      name: 'verificationDocuments',
      title: 'Verification Documents',
      type: 'array',
      of: [{ type: 'file' }]
    },
    {
      name: 'studentManagement',
      title: 'Student Management Settings',
      type: 'object',
      fields: [
        {
          name: 'maxStudents',
          title: 'Maximum Students',
          type: 'number',
          initialValue: 100
        },
        {
          name: 'allowSelfEnroll',
          title: 'Allow Self Enrollment',
          type: 'boolean',
          initialValue: true
        }
      ]
    }
  ]
},
{
  name: 'permissions',
  title: 'Role Permissions',
  type: 'object',
  fields: [
    {
      name: 'canAccessAdmin',
      title: 'Can Access Admin Panel',
      type: 'boolean',
      initialValue: false
    },
    {
      name: 'canManageUsers',
      title: 'Can Manage Users',
      type: 'boolean',
      initialValue: false
    },
    {
      name: 'canManageContent',
      title: 'Can Manage Content',
      type: 'boolean',
      initialValue: false
    },
    {
      name: 'canAccessAnalytics',
      title: 'Can Access Analytics',
      type: 'boolean',
      initialValue: false
    },
    {
      name: 'canManageStudents',
      title: 'Can Manage Students',
      type: 'boolean',
      initialValue: false
    },
    {
      name: 'canCreateCourses',
      title: 'Can Create Courses',
      type: 'boolean',
      initialValue: false
    },
    {
      name: 'canIssueCertificates',
      title: 'Can Issue Certificates',
      type: 'boolean',
      initialValue: false
    }
  ]
}
```

### 2. **New Schema: Student Groups** (`ui8-clone/sanity/schemas/studentGroup.ts`)

```typescript
export default {
  name: 'studentGroup',
  title: 'Student Group',
  type: 'document',
  fields: [
    {
      name: 'name',
      title: 'Group Name',
      type: 'string',
      validation: Rule => Rule.required()
    },
    {
      name: 'description',
      title: 'Description',
      type: 'text'
    },
    {
      name: 'teacher',
      title: 'Teacher',
      type: 'reference',
      to: [{ type: 'user' }],
      validation: Rule => Rule.required()
    },
    {
      name: 'students',
      title: 'Students',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            {
              name: 'email',
              title: 'Student Email',
              type: 'string',
              validation: Rule => Rule.required().email()
            },
            {
              name: 'name',
              title: 'Student Name',
              type: 'string'
            },
            {
              name: 'enrolledAt',
              title: 'Enrolled At',
              type: 'datetime',
              initialValue: () => new Date().toISOString()
            },
            {
              name: 'status',
              title: 'Status',
              type: 'string',
              options: {
                list: [
                  { title: 'Active', value: 'active' },
                  { title: 'Inactive', value: 'inactive' },
                  { title: 'Completed', value: 'completed' }
                ]
              },
              initialValue: 'active'
            }
          ]
        }
      ]
    },
    {
      name: 'createdAt',
      title: 'Created At',
      type: 'datetime',
      initialValue: () => new Date().toISOString()
    }
  ]
}
```

---

## Authentication & Permission System

### 1. **Enhanced Auth Types** (`ui8-clone/src/lib/auth.ts`)

```typescript
// Add to existing SanityUser interface:
interface SanityUser {
  // ... existing fields
  role: 'user' | 'partner' | 'teacher' | 'admin' | 'super_admin'
  teacherProfile?: {
    institution: string
    subjects: string[]
    experience: number
    verified: boolean
    verificationDocuments?: string[]
    studentManagement: {
      maxStudents: number
      allowSelfEnroll: boolean
    }
  }
  permissions: {
    canAccessAdmin: boolean
    canManageUsers: boolean
    canManageContent: boolean
    canAccessAnalytics: boolean
    canManageStudents: boolean
    canCreateCourses: boolean
    canIssueCertificates: boolean
  }
}
```

### 2. **Permission Helper Functions** (`ui8-clone/src/lib/permissions.ts`)

```typescript
export type Permission =
  | 'access_admin'
  | 'manage_users'
  | 'manage_content'
  | 'access_analytics'
  | 'manage_students'
  | 'create_courses'
  | 'issue_certificates'
  | 'super_admin_controls'

export const ROLE_PERMISSIONS: Record<string, Permission[]> = {
  user: [],
  partner: ['manage_content'],
  teacher: [
    'manage_students',
    'create_courses',
    'issue_certificates',
    'access_analytics'
  ],
  admin: [
    'access_admin',
    'manage_users',
    'manage_content',
    'access_analytics'
  ],
  super_admin: [
    'access_admin',
    'manage_users',
    'manage_content',
    'access_analytics',
    'manage_students',
    'create_courses',
    'issue_certificates',
    'super_admin_controls'
  ]
}

export function hasPermission(
  userRole: string,
  permission: Permission
): boolean {
  return ROLE_PERMISSIONS[userRole]?.includes(permission) || false
}

export function canAccessRoute(
  userRole: string,
  routePath: string
): boolean {
  const routePermissions: Record<string, Permission> = {
    '/admin': 'access_admin',
    '/admin/users': 'manage_users',
    '/admin/super': 'super_admin_controls',
    '/teacher': 'manage_students',
    '/teacher/students': 'manage_students',
    '/teacher/courses': 'create_courses',
    '/teacher/certificates': 'issue_certificates'
  }

  const requiredPermission = routePermissions[routePath]
  if (!requiredPermission) return true

  return hasPermission(userRole, requiredPermission)
}
```

---

## API Route Enhancements

### 1. **Teacher Registration API** (`ui8-clone/src/app/api/auth/register-teacher/route.ts`)

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { client } from '@/lib/sanity'
import { hash } from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      email,
      password,
      name,
      institution,
      subjects,
      experience,
      verificationDocuments
    } = body

    // Check if user already exists
    const existingUser = await client.fetch(
      `*[_type == "user" && email == $email][0]`,
      { email }
    )

    if (existingUser) {
      return NextResponse.json(
        { error: 'User already exists' },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await hash(password, 12)

    // Create teacher user
    const newUser = await client.create({
      _type: 'user',
      email,
      password: hashedPassword,
      name,
      role: 'teacher',
      verified: false,
      provider: 'credentials',
      teacherProfile: {
        institution,
        subjects,
        experience: parseInt(experience),
        verified: false,
        verificationDocuments,
        studentManagement: {
          maxStudents: 100,
          allowSelfEnroll: true
        }
      },
      permissions: {
        canAccessAdmin: false,
        canManageUsers: false,
        canManageContent: false,
        canAccessAnalytics: true,
        canManageStudents: true,
        canCreateCourses: true,
        canIssueCertificates: true
      },
      preferences: {
        newsletter: true,
        notifications: true,
        theme: 'light'
      },
      stats: {
        totalPurchases: 0,
        totalSpent: 0,
        favoriteCategories: [],
        lastLoginAt: new Date().toISOString()
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Teacher registration successful. Awaiting verification.',
      userId: newUser._id
    })

  } catch (error) {
    console.error('Teacher registration error:', error)
    return NextResponse.json(
      { error: 'Registration failed' },
      { status: 500 }
    )
  }
}
```

### 2. **Student Management API** (`ui8-clone/src/app/api/teacher/students/route.ts`)

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { client } from '@/lib/sanity'
import { hasPermission } from '@/lib/permissions'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user with role
    const user = await client.fetch(
      `*[_type == "user" && email == $email][0]`,
      { email: session.user.email }
    )

    if (!hasPermission(user.role, 'manage_students')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Get student groups for this teacher
    const studentGroups = await client.fetch(
      `*[_type == "studentGroup" && teacher._ref == $teacherId] {
        _id,
        name,
        description,
        students,
        createdAt,
        "studentCount": count(students)
      }`,
      { teacherId: user._id }
    )

    return NextResponse.json({ studentGroups })

  } catch (error) {
    console.error('Student fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch students' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const body = await request.json()

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await client.fetch(
      `*[_type == "user" && email == $email][0]`,
      { email: session.user.email }
    )

    if (!hasPermission(user.role, 'manage_students')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { groupName, description, studentEmails } = body

    // Create student group
    const newGroup = await client.create({
      _type: 'studentGroup',
      name: groupName,
      description,
      teacher: { _type: 'reference', _ref: user._id },
      students: studentEmails.map((email: string) => ({
        email,
        name: '',
        enrolledAt: new Date().toISOString(),
        status: 'active'
      })),
      createdAt: new Date().toISOString()
    })

    return NextResponse.json({
      success: true,
      group: newGroup
    })

  } catch (error) {
    console.error('Student group creation error:', error)
    return NextResponse.json(
      { error: 'Failed to create student group' },
      { status: 500 }
    )
  }
}
```

---

## Component Updates

### 1. **Role-Based Navigation** (`ui8-clone/src/components/Header.tsx`)

```typescript
// Add to Header component:
const getRoleBasedNavigation = (userRole: string) => {
  const baseNavigation = [
    { label: 'Browse', href: '/browse' },
    { label: 'All-Access', href: '/all-access' }
  ]

  switch (userRole) {
    case 'teacher':
      return [
        ...baseNavigation,
        { label: 'My Students', href: '/teacher/students' },
        { label: 'My Courses', href: '/teacher/courses' },
        { label: 'Certificates', href: '/teacher/certificates' }
      ]

    case 'admin':
      return [
        ...baseNavigation,
        { label: 'Admin', href: '/admin' }
      ]

    case 'super_admin':
      return [
        ...baseNavigation,
        { label: 'Admin', href: '/admin' },
        { label: 'Super Admin', href: '/admin/super' }
      ]

    case 'partner':
      return [
        ...baseNavigation,
        { label: 'Partner', href: '/partner' }
      ]

    default:
      return baseNavigation
  }
}
```

### 2. **Teacher Dashboard Layout** (`ui8-clone/src/app/teacher/layout.tsx`)

```typescript
'use client'

import { useState, useEffect, ReactNode } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { hasPermission } from '@/lib/permissions'
import {
  Users,
  BookOpen,
  Award,
  BarChart3,
  Settings,
  DollarSign
} from 'lucide-react'

interface TeacherLayoutProps {
  children: ReactNode
}

const teacherNavItems = [
  {
    id: 'overview',
    label: 'Overview',
    icon: BarChart3,
    href: '/teacher',
  },
  {
    id: 'students',
    label: 'My Students',
    icon: Users,
    href: '/teacher/students',
  },
  {
    id: 'courses',
    label: 'My Courses',
    icon: BookOpen,
    href: '/teacher/courses',
  },
  {
    id: 'certificates',
    label: 'Certificates',
    icon: Award,
    href: '/teacher/certificates',
  },
  {
    id: 'income',
    label: 'Income',
    icon: DollarSign,
    href: '/teacher/income',
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: Settings,
    href: '/teacher/settings',
  }
]

export default function TeacherLayout({ children }: TeacherLayoutProps) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [userRole, setUserRole] = useState<string>('')

  useEffect(() => {
    if (status === 'loading') return

    if (!session?.user) {
      router.push('/auth/signin')
      return
    }

    // Fetch user role
    fetch('/api/user/profile')
      .then(res => res.json())
      .then(data => {
        if (!hasPermission(data.user.role, 'manage_students')) {
          router.push('/dashboard')
          return
        }
        setUserRole(data.user.role)
      })
      .catch(() => router.push('/dashboard'))
  }, [session, status, router])

  if (status === 'loading' || !userRole) {
    return <div>Loading...</div>
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Teacher Navigation */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            {teacherNavItems.map((item) => (
              <a
                key={item.id}
                href={item.href}
                className="flex items-center px-3 py-4 text-sm font-medium text-gray-900 hover:text-blue-600"
              >
                <item.icon className="mr-2 h-4 w-4" />
                {item.label}
              </a>
            ))}
          </nav>
        </div>
      </div>

      {/* Teacher Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  )
}
```

---

## Implementation Priority

### **Week 1: Core Infrastructure**
1. ✅ Update user schema with new roles
2. ✅ Create permission system and helpers
3. ✅ Build teacher registration flow
4. ✅ Create student group schema

### **Week 2: Teacher Dashboard**
1. ✅ Build teacher layout and navigation
2. ✅ Create student management API
3. ✅ Build basic teacher dashboard
4. ✅ Add role-based route protection

### **Success Criteria**
- [ ] Teachers can register and be verified
- [ ] Student groups can be created and managed
- [ ] Role-based navigation works correctly
- [ ] Permission system prevents unauthorized access
- [ ] All existing functionality remains intact

This Phase 1 implementation creates the foundation for the comprehensive learning platform while maintaining backward compatibility with existing features.
