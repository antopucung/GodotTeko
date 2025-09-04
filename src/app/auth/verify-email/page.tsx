'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  CheckCircle,
  XCircle,
  Mail,
  Loader2,
  RefreshCw,
  ArrowLeft,
  AlertCircle
} from 'lucide-react'
import { toast } from 'sonner'

function VerifyEmailContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { data: session, status, update } = useSession()

  const [verificationStatus, setVerificationStatus] = useState<'loading' | 'success' | 'error' | 'pending'>('loading')
  const [errorMessage, setErrorMessage] = useState('')
  const [email, setEmail] = useState('')
  const [isResending, setIsResending] = useState(false)
  const [resendCooldown, setResendCooldown] = useState(0)

  const token = searchParams.get('token')

  useEffect(() => {
    if (token) {
      verifyEmailWithToken(token)
    } else if (status === 'authenticated') {
      setVerificationStatus('pending')
      setEmail(session?.user?.email || '')
    } else if (status === 'unauthenticated') {
      router.push('/auth/signin')
    }
  }, [token, status, session, router])

  // Cooldown timer effect
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => {
        setResendCooldown(resendCooldown - 1)
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [resendCooldown])

  const verifyEmailWithToken = async (verificationToken: string) => {
    try {
      setVerificationStatus('loading')

      const response = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'verify',
          token: verificationToken
        }),
      })

      const data = await response.json()

      if (response.ok && data.verified) {
        setVerificationStatus('success')
        toast.success('Email verified successfully!')

        // Update session to reflect verification
        await update()

        // Redirect to dashboard after a short delay
        setTimeout(() => {
          router.push('/user/dashboard')
        }, 2000)
      } else {
        setVerificationStatus('error')
        setErrorMessage(data.error || 'Verification failed')
      }
    } catch (error) {
      console.error('Verification error:', error)
      setVerificationStatus('error')
      setErrorMessage('Network error occurred')
    }
  }

  const handleResendVerification = async () => {
    if (isResending || resendCooldown > 0) return

    try {
      setIsResending(true)

      const response = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'send'
        }),
      })

      const data = await response.json()

      if (response.ok) {
        toast.success('Verification email sent!')
        setResendCooldown(60) // 60 second cooldown
      } else {
        toast.error(data.error || 'Failed to send verification email')
      }
    } catch (error) {
      console.error('Resend error:', error)
      toast.error('Network error occurred')
    } finally {
      setIsResending(false)
    }
  }

  const renderContent = () => {
    switch (verificationStatus) {
      case 'loading':
        return (
          <Card className="w-full max-w-md mx-auto">
            <CardContent className="pt-6">
              <div className="text-center">
                <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-blue-600" />
                <h2 className="text-xl font-semibold mb-2">Verifying your email...</h2>
                <p className="text-gray-600">Please wait while we verify your email address.</p>
              </div>
            </CardContent>
          </Card>
        )

      case 'success':
        return (
          <Card className="w-full max-w-md mx-auto">
            <CardContent className="pt-6">
              <div className="text-center">
                <CheckCircle className="w-16 h-16 mx-auto mb-4 text-green-600" />
                <h2 className="text-2xl font-bold text-green-600 mb-2">Email Verified!</h2>
                <p className="text-gray-600 mb-6">
                  Your email address has been successfully verified. You now have full access to your Godot Tekko account.
                </p>

                <div className="space-y-3">
                  <Button onClick={() => router.push('/user/dashboard')} className="w-full">
                    Go to Dashboard
                  </Button>
                  <Button variant="outline" onClick={() => router.push('/')} className="w-full">
                    Continue Browsing
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )

      case 'error':
        return (
          <Card className="w-full max-w-md mx-auto">
            <CardContent className="pt-6">
              <div className="text-center">
                <XCircle className="w-16 h-16 mx-auto mb-4 text-red-600" />
                <h2 className="text-2xl font-bold text-red-600 mb-2">Verification Failed</h2>
                <p className="text-gray-600 mb-6">{errorMessage}</p>

                <div className="space-y-3">
                  {session && (
                    <Button
                      onClick={handleResendVerification}
                      disabled={isResending || resendCooldown > 0}
                      className="w-full"
                    >
                      {isResending ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Sending...
                        </>
                      ) : resendCooldown > 0 ? (
                        <>
                          <RefreshCw className="w-4 h-4 mr-2" />
                          Resend in {resendCooldown}s
                        </>
                      ) : (
                        <>
                          <RefreshCw className="w-4 h-4 mr-2" />
                          Resend Verification Email
                        </>
                      )}
                    </Button>
                  )}

                  <Button variant="outline" onClick={() => router.push('/')} className="w-full">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Home
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )

      case 'pending':
        return (
          <Card className="w-full max-w-md mx-auto">
            <CardHeader>
              <CardTitle className="text-center">Verify Your Email</CardTitle>
              <CardDescription className="text-center">
                We've sent a verification link to your email address
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <Mail className="w-16 h-16 mx-auto mb-4 text-blue-600" />

                <Alert className="mb-6">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Please check your email at <strong>{email}</strong> and click the verification link to activate your account.
                  </AlertDescription>
                </Alert>

                <div className="space-y-4">
                  <div className="text-sm text-gray-600">
                    <p>Didn't receive the email? Check your spam folder or request a new one.</p>
                  </div>

                  <Button
                    onClick={handleResendVerification}
                    disabled={isResending || resendCooldown > 0}
                    variant="outline"
                    className="w-full"
                  >
                    {isResending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Sending...
                      </>
                    ) : resendCooldown > 0 ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Resend in {resendCooldown}s
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Resend Verification Email
                      </>
                    )}
                  </Button>

                  <div className="pt-4">
                    <Link href="/user/dashboard">
                      <Button variant="ghost" className="w-full">
                        Continue to Dashboard
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )

      default:
        return null
    }
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {renderContent()}

        <div className="text-center mt-6">
          <p className="text-sm text-gray-600">
            Need help? <Link href="/contact" className="text-blue-600 hover:underline">Contact Support</Link>
          </p>
        </div>
      </div>
    </div>
  )
}

// Loading component for Suspense
function VerifyEmailLoading() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// Main export with Suspense boundary
export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<VerifyEmailLoading />}>
      <VerifyEmailContent />
    </Suspense>
  )
}
