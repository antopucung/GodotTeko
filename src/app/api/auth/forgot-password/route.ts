import { NextRequest, NextResponse } from 'next/server'
import { client } from '@/lib/sanity'
import { Resend } from 'resend'
import crypto from 'crypto'
import bcrypt from 'bcryptjs'

const resend = new Resend(process.env.RESEND_API_KEY)

// Store reset tokens (in production, use a database)
const resetTokens = new Map<string, {
  userId: string
  email: string
  expires: Date
}>()

// Generate reset token
function generateResetToken(): string {
  return crypto.randomBytes(32).toString('hex')
}

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { error: 'Valid email address is required' },
        { status: 400 }
      )
    }

    // Find user by email
    const user = await client.fetch(
      `*[_type == "user" && email == $email][0] {
        _id,
        email,
        name,
        provider
      }`,
      { email: email.toLowerCase() }
    )

    // Always return success message for security (don't reveal if email exists)
    const successMessage = 'If an account with this email exists, we\'ve sent password reset instructions.'

    if (!user) {
      return NextResponse.json({
        message: successMessage
      })
    }

    // Check if user signed up with OAuth (can't reset password)
    if (user.provider !== 'credentials') {
      // Still return success message for security
      return NextResponse.json({
        message: successMessage
      })
    }

    // Generate reset token
    const resetToken = generateResetToken()
    const expires = new Date(Date.now() + 60 * 60 * 1000) // 1 hour

    // Store token temporarily
    resetTokens.set(resetToken, {
      userId: user._id,
      email: user.email,
      expires
    })

    // Send reset email
    if (process.env.RESEND_API_KEY) {
      try {
        await resend.emails.send({
          from: 'Godot Tekko <noreply@godottekko.com>',
          to: [user.email],
          subject: 'Reset your Godot Tekko password',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #1a1a1a; color: #ffffff;">
              <div style="text-align: center; padding: 40px 0;">
                <h1 style="color: #3b82f6; margin: 0 0 20px 0;">Godot Tekko</h1>

                <div style="background-color: #2a2a2a; padding: 30px; border-radius: 8px; margin: 20px 0;">
                  <h2 style="color: #ffffff; margin: 0 0 20px 0;">Reset Your Password</h2>

                  <p style="color: #cccccc; margin: 0 0 30px 0; line-height: 1.6;">
                    You requested to reset your password for your Godot Tekko account. Click the button below to set a new password.
                  </p>

                  <div style="text-align: center; margin: 30px 0;">
                    <a href="${process.env.NEXTAUTH_URL}/auth/reset-password/${resetToken}" style="background-color: #3b82f6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
                      Reset Password
                    </a>
                  </div>

                  <p style="color: #888888; font-size: 14px; margin: 30px 0 0 0; line-height: 1.5;">
                    This link will expire in 1 hour. If you didn't request a password reset, please ignore this email.
                  </p>
                </div>

                <div style="text-align: center; margin-top: 40px; color: #666666; font-size: 12px;">
                  <p style="margin: 0;">
                    If the button doesn't work, copy and paste this link into your browser:
                  </p>
                  <p style="margin: 10px 0; word-break: break-all;">
                    <a href="${process.env.NEXTAUTH_URL}/auth/reset-password/${resetToken}" style="color: #3b82f6;">${process.env.NEXTAUTH_URL}/auth/reset-password/${resetToken}</a>
                  </p>
                </div>
              </div>

              <div style="text-align: center; padding-top: 20px; border-top: 1px solid #333333; color: #666666; font-size: 12px;">
                <p style="margin: 0;">
                  © 2024 Godot Tekko. All rights reserved.
                </p>
              </div>
            </div>
          `
        })
      } catch (emailError) {
        console.error('Failed to send reset email:', emailError)
        // Still return success for security
      }
    }

    return NextResponse.json({
      message: successMessage
    })

  } catch (error) {
    console.error('Forgot password error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Validate reset token
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
      email: tokenData.email
    })

  } catch (error) {
    console.error('Token validation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
