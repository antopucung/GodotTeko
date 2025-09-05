/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  experimental: {
    optimizeCss: true
  },
  serverExternalPackages: ['mongoose'],
  images: {
    domains: [
      'images.unsplash.com',
      'res.cloudinary.com',
      'same-assets.com',
      'ext.same-assets.com',
      'cdn.sanity.io'
    ],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**'
      }
    ]
  }
}

export default nextConfig
