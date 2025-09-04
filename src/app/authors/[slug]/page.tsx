'use client'

import { useEffect, useState } from 'react'
import { useParams, notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { Header } from '@/components/Header'
import Footer from '@/components/Footer'
import { ProductCard } from '@/components/cards'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  User,
  MapPin,
  Globe,
  Twitter,
  Linkedin,
  ExternalLink,
  Users,
  Package,
  Star,
  Heart,
  Mail,
  MessageCircle,
  CheckCircle
} from 'lucide-react'
import { client } from '@/lib/sanity'
import { formatNumber } from '@/lib/utils'

interface Author {
  _id: string
  name: string
  slug: { current: string }
  bio?: string
  avatar?: string
  isVerified?: boolean
  website?: string
  location?: string
  socialLinks?: {
    twitter?: string
    linkedin?: string
    dribbble?: string
    behance?: string
  }
  stats?: {
    followers?: number
    totalSales?: number
    averageRating?: number
    productsCount?: number
  }
}

interface Product {
  _id: string
  title: string
  slug: { current: string }
  price: number
  salePrice?: number
  images?: Array<{ asset: { url: string } }>
  freebie: boolean
  featured?: boolean
  description?: string
  category?: { title: string }
  stats?: {
    likes?: number
  }
}

export default function AuthorProfilePage() {
  const params = useParams()
  const [author, setAuthor] = useState<Author | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isFollowing, setIsFollowing] = useState(false)

  useEffect(() => {
    const fetchAuthorData = async () => {
      if (!params.slug) return

      try {
        setLoading(true)
        setError(null)

        // Fetch author data from Sanity
        const authorData = await client.fetch(
          `*[_type == "author" && slug.current == $slug][0] {
            _id,
            name,
            slug,
            bio,
            "avatar": image.asset->url,
            isVerified,
            website,
            location,
            socialLinks,
            "stats": {
              "followers": coalesce(followers, 0),
              "totalSales": coalesce(totalSales, 0),
              "averageRating": coalesce(averageRating, 4.5),
              "productsCount": count(*[_type == "product" && author._ref == ^._id])
            }
          }`,
          { slug: params.slug }
        )

        if (!authorData) {
          notFound()
          return
        }

        setAuthor(authorData)

        // Fetch author's products
        const authorProducts = await client.fetch(
          `*[_type == "product" && author._ref == $authorId] | order(_createdAt desc) [0...12] {
            _id,
            title,
            slug,
            price,
            salePrice,
            "images": images[] {
              asset-> {
                url
              }
            },
            freebie,
            featured,
            description,
            "category": category-> {
              title
            },
            stats {
              likes
            }
          }`,
          { authorId: authorData._id }
        )

        setProducts(authorProducts || [])
      } catch (err) {
        console.error('Error fetching author data:', err)
        setError('Failed to load author profile')
      } finally {
        setLoading(false)
      }
    }

    fetchAuthorData()
  }, [params.slug])

  const handleFollow = () => {
    // TODO: Implement follow functionality
    setIsFollowing(!isFollowing)
  }

  const handleHire = () => {
    // TODO: Implement hire functionality
    window.open(`mailto:${author?.name}@example.com`, '_blank')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#161717]">
        <Header />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-white text-lg">Loading author profile...</div>
        </div>
        <Footer />
      </div>
    )
  }

  if (error || !author) {
    return (
      <div className="min-h-screen bg-[#161717]">
        <Header />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center text-white">
            <h1 className="text-2xl font-bold mb-4">Author Not Found</h1>
            <p className="text-gray-400 mb-6">{error || 'This author profile could not be found.'}</p>
            <Link href="/">
              <Button>Go Home</Button>
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#161717]">
      <Header />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center space-x-2 text-sm text-gray-400 mb-8">
          <Link href="/" className="hover:text-white">Home</Link>
          <span>/</span>
          <Link href="/authors" className="hover:text-white">Authors</Link>
          <span>/</span>
          <span className="text-gray-300">{author.name}</span>
        </div>

        {/* Author Header */}
        <div className="bg-gray-800/50 rounded-2xl p-8 mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center gap-8">
            {/* Avatar */}
            <div className="flex-shrink-0">
              <div className="relative w-32 h-32 lg:w-40 lg:h-40">
                {author.avatar ? (
                  <Image
                    src={author.avatar}
                    alt={author.name}
                    fill
                    className="rounded-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-blue-600 rounded-full flex items-center justify-center">
                    <span className="text-white text-4xl lg:text-5xl font-bold">
                      {author.name.charAt(0)}
                    </span>
                  </div>
                )}
                {author.isVerified && (
                  <div className="absolute -bottom-2 -right-2 bg-blue-600 rounded-full p-2">
                    <CheckCircle className="w-6 h-6 text-white" />
                  </div>
                )}
              </div>
            </div>

            {/* Author Info */}
            <div className="flex-1">
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h1 className="text-3xl lg:text-4xl font-bold text-white">{author.name}</h1>
                    {author.isVerified && (
                      <Badge className="bg-blue-600 text-white">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Verified
                      </Badge>
                    )}
                  </div>

                  {author.bio && (
                    <p className="text-lg text-gray-300 mb-4 max-w-2xl leading-relaxed">
                      {author.bio}
                    </p>
                  )}

                  {/* Location and Website */}
                  <div className="flex flex-wrap items-center gap-4 text-gray-400 mb-6">
                    {author.location && (
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        <span>{author.location}</span>
                      </div>
                    )}
                    {author.website && (
                      <a
                        href={author.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 hover:text-white transition-colors"
                      >
                        <Globe className="w-4 h-4" />
                        <span>Website</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>

                  {/* Social Links */}
                  {author.socialLinks && (
                    <div className="flex items-center gap-4">
                      {author.socialLinks.twitter && (
                        <a
                          href={author.socialLinks.twitter}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-gray-400 hover:text-blue-400 transition-colors"
                        >
                          <Twitter className="w-5 h-5" />
                        </a>
                      )}
                      {author.socialLinks.linkedin && (
                        <a
                          href={author.socialLinks.linkedin}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-gray-400 hover:text-blue-400 transition-colors"
                        >
                          <Linkedin className="w-5 h-5" />
                        </a>
                      )}
                      {author.socialLinks.dribbble && (
                        <a
                          href={author.socialLinks.dribbble}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-gray-400 hover:text-pink-400 transition-colors"
                        >
                          <div className="w-5 h-5 rounded-full bg-pink-500 flex items-center justify-center text-white text-xs font-bold">
                            D
                          </div>
                        </a>
                      )}
                      {author.socialLinks.behance && (
                        <a
                          href={author.socialLinks.behance}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-gray-400 hover:text-blue-400 transition-colors"
                        >
                          <div className="w-5 h-5 rounded bg-blue-600 flex items-center justify-center text-white text-xs font-bold">
                            Be
                          </div>
                        </a>
                      )}
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row lg:flex-col gap-3">
                  <Button
                    onClick={handleFollow}
                    variant={isFollowing ? "outline" : "default"}
                    className={`${
                      isFollowing
                        ? "border-gray-600 text-gray-300 hover:text-white hover:bg-gray-700"
                        : "bg-blue-600 hover:bg-blue-700 text-white"
                    } min-w-[120px]`}
                  >
                    <Users className="w-4 h-4 mr-2" />
                    {isFollowing ? 'Following' : 'Follow'}
                  </Button>

                  <Button
                    onClick={handleHire}
                    variant="outline"
                    className="border-gray-600 text-gray-300 hover:text-white hover:bg-gray-700 min-w-[120px]"
                  >
                    <Mail className="w-4 h-4 mr-2" />
                    Hire
                  </Button>

                  <Button
                    variant="outline"
                    className="border-gray-600 text-gray-300 hover:text-white hover:bg-gray-700 min-w-[120px]"
                  >
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Message
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Author Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="bg-gray-800/50 border-gray-700">
            <CardContent className="pt-6 text-center">
              <div className="text-2xl font-bold text-white mb-1">
                {formatNumber(author.stats?.productsCount || 0)}
              </div>
              <div className="text-sm text-gray-400">Products</div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800/50 border-gray-700">
            <CardContent className="pt-6 text-center">
              <div className="text-2xl font-bold text-white mb-1">
                {formatNumber(author.stats?.followers || 0)}
              </div>
              <div className="text-sm text-gray-400">Followers</div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800/50 border-gray-700">
            <CardContent className="pt-6 text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Star className="w-5 h-5 text-yellow-400 fill-current" />
                <span className="text-2xl font-bold text-white">
                  {(author.stats?.averageRating || 4.5).toFixed(1)}
                </span>
              </div>
              <div className="text-sm text-gray-400">Rating</div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800/50 border-gray-700">
            <CardContent className="pt-6 text-center">
              <div className="text-2xl font-bold text-white mb-1">
                ${formatNumber(author.stats?.totalSales || 0)}
              </div>
              <div className="text-sm text-gray-400">Sales</div>
            </CardContent>
          </Card>
        </div>

        {/* Products Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">
              Products by {author.name}
            </h2>
            {products.length > 12 && (
              <Link
                href={`/products?author=${author.slug.current}`}
                className="text-blue-400 hover:text-blue-300"
              >
                View all products
              </Link>
            )}
          </div>

          {products.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {products.map((product) => (
                <ProductCard
                  key={product._id}
                  product={{
                    _id: product._id,
                    title: product.title,
                    slug: product.slug,
                    price: product.price,
                    salePrice: product.salePrice,
                    images: product.images,
                    freebie: product.freebie,
                    featured: product.featured,
                    description: product.description,
                    category: product.category,
                    author: {
                      name: author.name,
                      image: author.avatar,
                      slug: author.slug
                    },
                    stats: product.stats
                  }}
                />
              ))}
            </div>
          ) : (
            <Card className="bg-gray-800/50 border-gray-700">
              <CardContent className="pt-6">
                <div className="text-center py-12">
                  <Package className="w-16 h-16 text-gray-500 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2">No products yet</h3>
                  <p className="text-gray-400">
                    {author.name} hasn't published any products yet.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Contact Section */}
        <Card className="bg-gray-800/50 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Get in Touch</CardTitle>
            <CardDescription className="text-gray-400">
              Interested in working with {author.name}? Reach out to discuss your project.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                onClick={handleHire}
                className="bg-blue-600 hover:bg-blue-700 text-white flex-1"
              >
                <Mail className="w-4 h-4 mr-2" />
                Hire {author.name}
              </Button>

              <Button
                variant="outline"
                className="border-gray-600 text-gray-300 hover:text-white hover:bg-gray-700 flex-1"
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                Send Message
              </Button>

              <Button
                onClick={handleFollow}
                variant="outline"
                className="border-gray-600 text-gray-300 hover:text-white hover:bg-gray-700 flex-1"
              >
                <Users className="w-4 h-4 mr-2" />
                {isFollowing ? 'Following' : 'Follow'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>

      <Footer />
    </div>
  )
}
