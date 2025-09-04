'use client'

import { useCart } from '@/context/CartContext'
import { Button } from '@/components/ui/button'
import { ShoppingCart, Plus, Minus, Check } from 'lucide-react'
import { useState } from 'react'
import Link from 'next/link'

interface CartButtonProps {
  product?: {
    _id: string
    title: string
    slug: { current: string }
    price: number
    salePrice?: number
    image?: string
    freebie: boolean
  }
  showCount?: boolean
  variant?: 'default' | 'outline' | 'ghost'
  size?: 'default' | 'sm' | 'lg'
  className?: string
}

export function CartButton({
  product,
  showCount = true,
  variant = 'default',
  size = 'default',
  className
}: CartButtonProps) {
  const { addToCart, removeFromCart, updateQuantity, items, itemCount, isLoading } = useCart()
  const [isAdding, setIsAdding] = useState(false)

  // If product is provided, this is an "Add to Cart" button
  if (product) {
    const cartItem = items.find(item => item.product._id === product._id)
    const quantity = cartItem?.quantity || 0

    const handleAddToCart = async () => {
      try {
        setIsAdding(true)
        await addToCart(product, 1)

        // Show success state briefly
        setTimeout(() => setIsAdding(false), 1000)
      } catch (error) {
        setIsAdding(false)
      }
    }

    const handleUpdateQuantity = async (newQuantity: number) => {
      if (newQuantity <= 0) {
        await removeFromCart(product._id)
      } else {
        await updateQuantity(product._id, newQuantity)
      }
    }

    // If item is already in cart, show quantity controls
    if (quantity > 0) {
      return (
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleUpdateQuantity(quantity - 1)}
            disabled={isLoading}
            className="h-8 w-8 p-0"
          >
            <Minus className="h-3 w-3" />
          </Button>

          <span className="min-w-[2rem] text-center font-medium">
            {quantity}
          </span>

          <Button
            variant="outline"
            size="sm"
            onClick={() => handleUpdateQuantity(quantity + 1)}
            disabled={isLoading}
            className="h-8 w-8 p-0"
          >
            <Plus className="h-3 w-3" />
          </Button>
        </div>
      )
    }

    // Show "Add to Cart" button
    return (
      <Button
        onClick={handleAddToCart}
        disabled={isLoading || isAdding}
        variant={variant}
        size={size}
        className={className}
      >
        {isAdding ? (
          <>
            <Check className="w-4 h-4 mr-2" />
            {product.freebie ? 'Added!' : 'Added to Cart!'}
          </>
        ) : (
          <>
            <ShoppingCart className="w-4 h-4 mr-2" />
            {product.freebie ? 'Get Free' : 'Add to Cart'}
          </>
        )}
      </Button>
    )
  }

  // If no product, this is a cart icon button
  return (
    <Button
      variant={variant}
      size={size}
      className={`relative ${className}`}
      asChild
    >
      <Link href="/cart">
        <ShoppingCart className="w-4 h-4" />
        {showCount && itemCount > 0 && (
          <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
            {itemCount > 99 ? '99+' : itemCount}
          </span>
        )}
        <span className="sr-only">
          Shopping cart with {itemCount} items
        </span>
      </Link>
    </Button>
  )
}
