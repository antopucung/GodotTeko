import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://godot-tekko.vercel.app'

  return {
    rules: [
      {
        userAgent: '*',
        allow: [
          '/',
          '/products/',
          '/category/',
          '/learn',
          '/play-station',
          '/all-access',
          '/become-partner',
          '/auth/signin',
          '/auth/signup',
        ],
        disallow: [
          '/admin/',
          '/api/',
          '/user/',
          '/dashboard/',
          '/checkout/',
          '/cart',
          '/partner/',
          '/creator/',
          '/teacher/',
          '/studio/',
          '/offline',
          '/auth/reset-password/',
          '/auth/verify-email/',
        ],
      },
      {
        userAgent: 'Googlebot',
        allow: [
          '/',
          '/products/',
          '/category/',
          '/learn',
          '/play-station',
          '/all-access',
          '/become-partner',
        ],
        disallow: [
          '/admin/',
          '/api/',
          '/user/',
          '/dashboard/',
          '/checkout/',
          '/cart',
          '/partner/',
          '/creator/',
          '/teacher/',
          '/studio/',
          '/offline',
          '/auth/',
        ],
      },
      {
        userAgent: 'Bingbot',
        allow: [
          '/',
          '/products/',
          '/category/',
          '/learn',
          '/play-station',
          '/all-access',
          '/become-partner',
        ],
        disallow: [
          '/admin/',
          '/api/',
          '/user/',
          '/dashboard/',
          '/checkout/',
          '/cart',
          '/partner/',
          '/creator/',
          '/teacher/',
          '/studio/',
          '/offline',
          '/auth/',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  }
}
