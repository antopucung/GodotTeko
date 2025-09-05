import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token
    const { pathname } = req.nextUrl

    // Admin routes - require admin role
    if (pathname.startsWith('/admin')) {
      if (!token || token.role !== 'admin') {
        return NextResponse.redirect(new URL('/auth/signin?error=unauthorized', req.url))
      }
    }

    // Partner routes - require partner or admin role
    if (pathname.startsWith('/partner')) {
      if (!token || (token.role !== 'partner' && token.role !== 'admin')) {
        return NextResponse.redirect(new URL('/auth/signin?error=unauthorized', req.url))
      }
    }

    // User dashboard routes - require any authenticated user
    if (pathname.startsWith('/user')) {
      if (!token) {
        return NextResponse.redirect(new URL('/auth/signin', req.url))
      }
    }

    // Sanity Studio - require admin role
    if (pathname.startsWith('/studio')) {
      if (!token || token.role !== 'admin') {
        return NextResponse.redirect(new URL('/auth/signin?error=unauthorized', req.url))
      }
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl

        // Public routes that don't require authentication
        const publicRoutes = [
          '/',
          '/auth/signin',
          '/auth/signup',
          '/products',
          '/category',
          '/authors',
          '/all-access',
          '/become-partner',
          '/learn',
          '/play-station',
          '/test-cors',
          '/api/products',
          '/api/categories',
          '/api/authors',
          '/api/subscription-plans',
          '/api/site-configuration',
          '/api/test-plans',
          '/api/play-station/submit'
        ]

        // Check if the current path is public
        const isPublicRoute = publicRoutes.some(route =>
          pathname === route || pathname.startsWith(route + '/')
        )

        // Allow public routes without authentication
        if (isPublicRoute) {
          return true
        }

        // All other routes require authentication
        return !!token
      },
    },
  }
)

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
