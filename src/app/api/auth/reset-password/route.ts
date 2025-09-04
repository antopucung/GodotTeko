import { NextRequest, NextResponse } from 'next/server'
import { client } from '@/lib/sanity'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'

// Import reset tokens from forgot-password (in production, use shared database)
// For now, we'll recreate the storage here
const resetTokens = new Map<string, {
  userId: string
  email: string
  expires: Date
}>()

export async function POST(request: NextRequest) {
  try {
    const { token, password, confirmPassword } = await request.json()

    // Validation
    if (!token || !password || !confirmPassword) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      )
    }

    if (password !== confirmPassword) {
      return NextResponse.json(
        { error: 'Passwords do not match' },
        { status: 400 }
      )
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters long' },
        { status: 400 }
      )
    }

    // Password strength validation
    const hasUpperCase = /[A-Z]/.test(password)
    const hasLowerCase = /[a-z]/.test(password)
    const hasNumbers = /\d/.test(password)
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password)

    if (!hasUpperCase || !hasLowerCase || !hasNumbers) {
      return NextResponse.json(
        { error: 'Password must contain at least one uppercase letter, lowercase letter, and number' },
        { status: 400 }
      )
    }

    // Check if token exists and is valid
    const tokenData = resetTokens.get(token)

    if (!tokenData) {
      return NextResponse.json(
        { error: 'Invalid or expired reset token' },
        { status: 400 }
      )
    }

    if (tokenData.expires < new Date()) {
      resetTokens.delete(token)
      return NextResponse.json(
        { error: 'Reset token has expired' },
        { status: 400 }
      )
    }

    // Get user to verify they exist and use credentials provider
    const user = await client.fetch(
      `*[_type == "user" && _id == $userId][0] {
        _id,
        email,
        name,
        provider
      }`,
      { userId: tokenData.userId }
    )

    if (!user) {
      resetTokens.delete(token)
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    if (user.provider !== 'credentials') {
      resetTokens.delete(token)
      return NextResponse.json(
        { error: 'Cannot reset password for social login accounts' },
        { status: 400 }
      )
    }

    // Hash the new password
    const saltRounds = 12
    const hashedPassword = await bcrypt.hash(password, saltRounds)

    // Update user's password in Sanity
    try {
      await client
        .patch(user._id)
        .set({
          password: hashedPassword,
          updatedAt: new Date().toISOString(),
          // Optionally force email verification again after password reset
          // emailVerified: null
        })
        .commit()

      // Remove the used token
      resetTokens.delete(token)

      return NextResponse.json({
        message: 'Password reset successfully',
        success: true
      })

    } catch (error) {
      console.error('Failed to update password:', error)
      return NextResponse.json(
        { error: 'Failed to update password' },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('Reset password error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Get token info for validation on the frontend
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')

    if (!token) {
      return NextResponse.json(
        { error: 'Reset token required' },
        { status: 400 }
      )
    }

    // Check if token exists and is valid
    const tokenData = resetTokens.get(token)

    if (!tokenData) {
      return NextResponse.json(
        { error: 'Invalid reset token' },
        { status: 400 }
      )
    }

    if (tokenData.expires < new Date()) {
      resetTokens.delete(token)
      return NextResponse.json(
        { error: 'Reset token has expired' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      valid: true,
      email: tokenData.email,
      expiresAt: tokenData.expires.toISOString()
    })

  } catch (error) {
    console.error('Token validation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
