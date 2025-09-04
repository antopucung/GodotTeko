import { NextRequest, NextResponse } from 'next/server'
import { client } from '@/lib/sanity'
import { hash } from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      name,
      email,
      password,
      institution,
      specialization,
      experienceYears,
      bio
    } = body

    // Validate required fields
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'Name, email, and password are required' },
        { status: 400 }
      )
    }

    // Check if user already exists
    const existingUser = await client.fetch(
      `*[_type == "user" && email == $email][0]`,
      { email }
    )

    if (existingUser) {
      return NextResponse.json(
        { error: 'User already exists with this email' },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await hash(password, 12)

    // Create teacher user with enhanced schema
    const newTeacher = await client.create({
      _type: 'userEnhanced',
      name,
      email,
      image: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=3B82F6&color=ffffff`,
      role: 'teacher',
      subscriptionTier: 'free',
      subscriptionStatus: 'inactive',
      permissions: [
        'create_courses',
        'manage_students',
        'generate_certificates',
        'access_analytics',
        'view_revenue'
      ],
      teacherProfile: {
        institution: institution || '',
        specialization: Array.isArray(specialization) ? specialization : [],
        studentCount: 0,
        revenueEarned: 0,
        certificationTemplate: `
          <div style="text-align: center; padding: 50px; border: 2px solid #3B82F6;">
            <h1 style="color: #3B82F6; margin-bottom: 30px;">Certificate of Completion</h1>
            <p style="font-size: 18px; margin-bottom: 20px;">This certifies that</p>
            <h2 style="color: #1F2937; margin: 20px 0;">{{studentName}}</h2>
            <p style="font-size: 18px; margin-bottom: 20px;">has successfully completed</p>
            <h3 style="color: #1F2937; margin: 20px 0;">{{courseName}}</h3>
            <p style="margin-top: 40px;">Issued by ${institution || 'Godot Tekko Platform'}</p>
            <p style="margin-top: 20px;">Instructor: ${name}</p>
            <p style="margin-top: 20px;">Date: {{issueDate}}</p>
          </div>
        `
      },
      lastLogin: new Date().toISOString(),
      joinedAt: new Date().toISOString()
    })

    // Also create in the original user schema for backward compatibility
    await client.create({
      _type: 'user',
      name,
      email,
      password: hashedPassword,
      image: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=3B82F6&color=ffffff`,
      role: 'teacher',
      verified: false,
      provider: 'credentials',
      bio: bio || '',
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
      message: 'Teacher registration successful! You can now sign in.',
      teacherId: newTeacher._id,
      teacher: {
        id: newTeacher._id,
        name: newTeacher.name,
        email: newTeacher.email,
        role: newTeacher.role,
        institution: newTeacher.teacherProfile?.institution,
        specialization: newTeacher.teacherProfile?.specialization
      }
    })

  } catch (error) {
    console.error('Teacher registration error:', error)
    return NextResponse.json(
      { error: 'Registration failed. Please try again.' },
      { status: 500 }
    )
  }
}
