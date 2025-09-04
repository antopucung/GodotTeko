import { NextRequest, NextResponse } from 'next/server'
import { createUser, getUserByEmail } from '@/lib/auth'
import { Resend } from 'resend'
import crypto from 'crypto'

const resend = new Resend(process.env.RESEND_API_KEY)

// Store verification tokens (in production, use a database)
const verificationTokens = new Map<string, {
  userId: string
  email: string
  expires: Date
}>()

// Generate verification token
function generateVerificationToken(): string {
  return crypto.randomBytes(32).toString('hex')
}

export async function POST(request: NextRequest) {
  try {
    const { email, password, name, role } = await request.json()

    if (!email || !password || !name) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Check if user already exists
    const existingUser = await getUserByEmail(email)
    if (existingUser) {
      return NextResponse.json(
        { error: 'User already exists' },
        { status: 400 }
      )
    }

    // Create new user
    const user = await createUser({
      email,
      password,
      name,
      role: role || 'user'
    })

    // Send verification email automatically
    if (process.env.RESEND_API_KEY) {
      try {
        // Generate verification token
        const verificationToken = generateVerificationToken()
        const expires = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

        // Store token temporarily
        verificationTokens.set(verificationToken, {
          userId: user._id,
          email: user.email,
          expires
        })

        // Send welcome + verification email
        await resend.emails.send({
          from: 'Godot Tekko <noreply@godottekko.com>',
          to: email,
          subject: 'Welcome to Godot Tekko - Verify your email',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #1a1a1a; color: #ffffff;">
              <div style="text-align: center; padding: 40px 0;">
                <h1 style="color: #3b82f6; margin: 0 0 20px 0;">Welcome to Godot Tekko!</h1>

                <div style="background-color: #2a2a2a; padding: 30px; border-radius: 8px; margin: 20px 0;">
                  <h2 style="color: #ffffff; margin: 0 0 20px 0;">Verify your email address</h2>

                  <p style="color: #cccccc; margin: 0 0 30px 0; line-height: 1.6;">
                    Thank you for joining Godot Tekko! You now have access to thousands of curated design resources and game assets to speed up your creative workflow.
                  </p>

                  <div style="text-align: center; margin: 30px 0;">
                    <a href="${process.env.NEXTAUTH_URL}/auth/verify-email?token=${verificationToken}" style="background-color: #3b82f6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
                      Verify Email Address
                    </a>
                  </div>

                  <p style="color: #888888; font-size: 14px; margin: 30px 0 0 0; line-height: 1.5;">
                    This link will expire in 24 hours. If you didn't create an account with Godot Tekko, please ignore this email.
                  </p>
                </div>

                <div style="text-align: center; margin-top: 40px; color: #666666; font-size: 12px;">
                  <p style="margin: 0;">
                    If the button doesn't work, copy and paste this link into your browser:
                  </p>
                  <p style="margin: 10px 0; word-break: break-all;">
                    <a href="${process.env.NEXTAUTH_URL}/auth/verify-email?token=${verificationToken}" style="color: #3b82f6;">${process.env.NEXTAUTH_URL}/auth/verify-email?token=${verificationToken}</a>
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
        console.error('Failed to send verification email:', emailError)
        // Don't fail registration if email fails - user can still access their account
      }
    }

    return NextResponse.json({
      message: 'Account created successfully! Please check your email to verify your account.',
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        emailVerified: false
      },
      requiresVerification: true
    })

  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
