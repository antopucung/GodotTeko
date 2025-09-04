import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { client } from '@/lib/sanity'
import { Resend } from 'resend'
import crypto from 'crypto'

const resend = new Resend(process.env.RESEND_API_KEY)

// Generate verification token
function generateVerificationToken(): string {
  return crypto.randomBytes(32).toString('hex')
}

// Store verification token (in production, use a database)
const verificationTokens = new Map<string, {
  userId: string
  email: string
  expires: Date
}>()

export async function POST(request: NextRequest) {
  try {
    const { action, token, email } = await request.json()

    if (action === 'send') {
      // Send verification email
      const session = await getServerSession(authOptions)

      if (!session?.user?.id) {
        return NextResponse.json(
          { error: 'User not authenticated' },
          { status: 401 }
        )
      }

      // Get user data
      const user = await client.fetch(
        `*[_type == "user" && _id == $userId][0] {
          _id,
          email,
          name,
          emailVerified
        }`,
        { userId: session.user.id }
      )

      if (!user) {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        )
      }

      if (user.emailVerified) {
        return NextResponse.json(
          { error: 'Email already verified' },
          { status: 400 }
        )
      }

      // Generate verification token
      const verificationToken = generateVerificationToken()
      const expires = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

      // Store token temporarily (in production, use database)
      verificationTokens.set(verificationToken, {
        userId: user._id,
        email: user.email,
        expires
      })

      // Send verification email
      if (process.env.RESEND_API_KEY) {
        try {
          await resend.emails.send({
            from: 'Godot Tekko <noreply@godottekko.com>',
            to: [user.email],
            subject: 'Welcome to Godot Tekko - Verify your email',
            html: `
              <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; background-color: #1a1a1a; color: #ffffff; padding: 20px;">
                <div style="text-align: center; padding: 40px 0;">
                  <h1 style="color: #3b82f6; margin: 0 0 20px 0;">Godot Tekko</h1>

                  <div style="background-color: #2a2a2a; padding: 30px; border-radius: 8px; margin: 20px 0;">
                    <h2 style="color: #ffffff; margin: 0 0 20px 0;">Verify your email address</h2>

                    <p style="color: #cccccc; margin: 0 0 30px 0; line-height: 1.6;">
                      Welcome to Godot Tekko! Please verify your email address to complete your account setup and unlock all features.
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
          return NextResponse.json(
            { error: 'Failed to send verification email' },
            { status: 500 }
          )
        }
      }

      return NextResponse.json({
        message: 'Verification email sent successfully',
        email: user.email
      })

    } else if (action === 'verify') {
      // Verify email with token
      if (!token) {
        return NextResponse.json(
          { error: 'Verification token required' },
          { status: 400 }
        )
      }

      // Check if token exists and is valid
      const tokenData = verificationTokens.get(token)

      if (!tokenData) {
        return NextResponse.json(
          { error: 'Invalid or expired verification token' },
          { status: 400 }
        )
      }

      if (tokenData.expires < new Date()) {
        verificationTokens.delete(token)
        return NextResponse.json(
          { error: 'Verification token has expired' },
          { status: 400 }
        )
      }

      // Update user's email verification status
      try {
        await client
          .patch(tokenData.userId)
          .set({
            emailVerified: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          })
          .commit()

        // Remove token after successful verification
        verificationTokens.delete(token)

        return NextResponse.json({
          message: 'Email verified successfully',
          verified: true
        })
      } catch (error) {
        console.error('Failed to update user verification status:', error)
        return NextResponse.json(
          { error: 'Failed to verify email' },
          { status: 500 }
        )
      }

    } else if (action === 'resend') {
      // Resend verification email
      const session = await getServerSession(authOptions)

      if (!session?.user?.id) {
        return NextResponse.json(
          { error: 'User not authenticated' },
          { status: 401 }
        )
      }

      // Use the send logic
      return POST(new NextRequest(request.url, {
        method: 'POST',
        body: JSON.stringify({ action: 'send' })
      }))
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    )

  } catch (error) {
    console.error('Email verification error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')

    if (!token) {
      return NextResponse.json(
        { error: 'Verification token required' },
        { status: 400 }
      )
    }

    // Check if token exists
    const tokenData = verificationTokens.get(token)

    if (!tokenData) {
      return NextResponse.json(
        { error: 'Invalid verification token' },
        { status: 400 }
      )
    }

    if (tokenData.expires < new Date()) {
      verificationTokens.delete(token)
      return NextResponse.json(
        { error: 'Verification token has expired' },
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
