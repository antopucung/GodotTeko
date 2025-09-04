'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  CheckCircle,
  XCircle,
  Lock,
  Loader2,
  Eye,
  EyeOff,
  ArrowLeft,
  AlertCircle,
  Shield
} from 'lucide-react'
import { toast } from 'sonner'

export default function ResetPasswordPage() {
  const params = useParams()
  const router = useRouter()

  const [tokenStatus, setTokenStatus] = useState<'loading' | 'valid' | 'invalid'>('loading')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [resetSuccess, setResetSuccess] = useState(false)

  const token = params.token as string

  useEffect(() => {
    if (token) {
      validateToken(token)
    }
  }, [token])

  const validateToken = async (resetToken: string) => {
    try {
      const response = await fetch(`/api/auth/reset-password?token=${resetToken}`)
      const data = await response.json()

      if (response.ok && data.valid) {
        setTokenStatus('valid')
        setEmail(data.email)
      } else {
        setTokenStatus('invalid')
      }
    } catch (error) {
      console.error('Token validation error:', error)
      setTokenStatus('invalid')
    }
  }

  const validatePassword = (password: string) => {
    const errors: string[] = []

    if (password.length < 8) {
      errors.push('At least 8 characters')
    }
    if (!/[A-Z]/.test(password)) {
      errors.push('One uppercase letter')
    }
    if (!/[a-z]/.test(password)) {
      errors.push('One lowercase letter')
    }
    if (!/\d/.test(password)) {
      errors.push('One number')
    }

    return errors
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Clear previous errors
    setErrors({})

    // Validation
    const newErrors: Record<string, string> = {}

    if (!password) {
      newErrors.password = 'Password is required'
    } else {
      const passwordErrors = validatePassword(password)
      if (passwordErrors.length > 0) {
        newErrors.password = 'Password must contain: ' + passwordErrors.join(', ')
      }
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password'
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match'
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          password,
          confirmPassword
        }),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setResetSuccess(true)
        toast.success('Password reset successfully!')

        // Redirect to sign in after a short delay
        setTimeout(() => {
          router.push('/auth/signin?message=password-reset-success')
        }, 2000)
      } else {
        setErrors({ general: data.error || 'Failed to reset password' })
      }
    } catch (error) {
      console.error('Reset error:', error)
      setErrors({ general: 'Network error occurred' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const renderPasswordStrength = () => {
    if (!password) return null

    const errors = validatePassword(password)
    const strength = 4 - errors.length

    const strengthColors = {
      0: 'bg-red-500',
      1: 'bg-red-400',
      2: 'bg-yellow-400',
      3: 'bg-blue-400',
      4: 'bg-green-500'
    }

    const strengthLabels = {
      0: 'Very Weak',
      1: 'Weak',
      2: 'Fair',
      3: 'Good',
      4: 'Strong'
    }

    return (
      <div className="mt-2">
        <div className="flex space-x-1 mb-2">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className={`h-2 flex-1 rounded ${
                i < strength ? strengthColors[strength as keyof typeof strengthColors] : 'bg-gray-200'
              }`}
            />
          ))}
        </div>
        <p className="text-sm text-gray-600">
          Password strength: <span className="font-medium">{strengthLabels[strength as keyof typeof strengthLabels]}</span>
        </p>
        {errors.length > 0 && (
          <p className="text-sm text-red-600 mt-1">
            Missing: {errors.join(', ')}
          </p>
        )}
      </div>
    )
  }

  if (tokenStatus === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md mx-auto">
          <CardContent className="pt-6">
            <div className="text-center">
              <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-blue-600" />
              <h2 className="text-xl font-semibold mb-2">Validating reset link...</h2>
              <p className="text-gray-600">Please wait while we verify your reset token.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (tokenStatus === 'invalid') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md mx-auto">
          <CardContent className="pt-6">
            <div className="text-center">
              <XCircle className="w-16 h-16 mx-auto mb-4 text-red-600" />
              <h2 className="text-2xl font-bold text-red-600 mb-2">Invalid Reset Link</h2>
              <p className="text-gray-600 mb-6">
                This password reset link is invalid or has expired. Please request a new one.
              </p>

              <div className="space-y-3">
                <Link href="/auth/forgot-password">
                  <Button className="w-full">
                    Request New Reset Link
                  </Button>
                </Link>

                <Link href="/auth/signin">
                  <Button variant="outline" className="w-full">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Sign In
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (resetSuccess) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md mx-auto">
          <CardContent className="pt-6">
            <div className="text-center">
              <CheckCircle className="w-16 h-16 mx-auto mb-4 text-green-600" />
              <h2 className="text-2xl font-bold text-green-600 mb-2">Password Reset Successfully!</h2>
              <p className="text-gray-600 mb-6">
                Your password has been updated. You can now sign in with your new password.
              </p>

              <div className="space-y-3">
                <Link href="/auth/signin">
                  <Button className="w-full">
                    Continue to Sign In
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="text-center">Reset Your Password</CardTitle>
          <CardDescription className="text-center">
            Enter a new password for your account: {email}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {errors.general && (
              <Alert className="border-red-200 bg-red-50">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-600">
                  {errors.general}
                </AlertDescription>
              </Alert>
            )}

            {/* Password Field */}
            <div className="space-y-2">
              <Label htmlFor="password">New Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your new password"
                  className={errors.password ? 'border-red-500' : ''}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-sm text-red-600">{errors.password}</p>
              )}
              {renderPasswordStrength()}
            </div>

            {/* Confirm Password Field */}
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm your new password"
                  className={errors.confirmPassword ? 'border-red-500' : ''}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="text-sm text-red-600">{errors.confirmPassword}</p>
              )}
            </div>

            {/* Security Notice */}
            <Alert className="border-blue-200 bg-blue-50">
              <Shield className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-600">
                Choose a strong password that you haven't used elsewhere. Your password will be securely encrypted.
              </AlertDescription>
            </Alert>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Resetting Password...
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4 mr-2" />
                  Reset Password
                </>
              )}
            </Button>
          </form>

          <div className="text-center mt-6">
            <Link href="/auth/signin" className="text-sm text-blue-600 hover:underline">
              <ArrowLeft className="w-4 h-4 inline mr-1" />
              Back to Sign In
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
