'use client'

import React, { createContext, useContext, useReducer, useEffect } from 'react'
import { useSession } from 'next-auth/react'

export interface CartItem {
  id: string
  product: {
    _id: string
    title: string
    slug: { current: string }
    price: number
    salePrice?: number
    image?: string
    freebie: boolean
  }
  quantity: number
  addedAt: string
}

export interface CartState {
  items: CartItem[]
  isLoading: boolean
  error: string | null
  total: number
  itemCount: number
}

export interface CartContextType extends CartState {
  addToCart: (product: CartItem['product'], quantity?: number) => Promise<void>
  removeFromCart: (productId: string) => Promise<void>
  updateQuantity: (productId: string, quantity: number) => Promise<void>
  clearCart: () => Promise<void>
  syncCart: () => Promise<void>
}

type CartAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_ITEMS'; payload: CartItem[] }
  | { type: 'ADD_ITEM'; payload: CartItem }
  | { type: 'UPDATE_ITEM'; payload: { productId: string; quantity: number } }
  | { type: 'REMOVE_ITEM'; payload: string }
  | { type: 'CLEAR_CART' }

const CartContext = createContext<CartContextType | undefined>(undefined)

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload }

    case 'SET_ERROR':
      return { ...state, error: action.payload, isLoading: false }

    case 'SET_ITEMS': {
      const items = action.payload
      const total = items.reduce((sum, item) => {
        const price = item.product.salePrice || item.product.price
        return sum + (price * item.quantity)
      }, 0)
      const itemCount = items.reduce((count, item) => count + item.quantity, 0)

      return {
        ...state,
        items,
        total,
        itemCount,
        isLoading: false,
        error: null
      }
    }

    case 'ADD_ITEM': {
      const existingItemIndex = state.items.findIndex(
        item => item.product._id === action.payload.product._id
      )

      let newItems: CartItem[]
      if (existingItemIndex >= 0) {
        // Update existing item quantity
        newItems = state.items.map((item, index) =>
          index === existingItemIndex
            ? { ...item, quantity: item.quantity + action.payload.quantity }
            : item
        )
      } else {
        // Add new item
        newItems = [...state.items, action.payload]
      }

      const total = newItems.reduce((sum, item) => {
        const price = item.product.salePrice || item.product.price
        return sum + (price * item.quantity)
      }, 0)
      const itemCount = newItems.reduce((count, item) => count + item.quantity, 0)

      return {
        ...state,
        items: newItems,
        total,
        itemCount,
        error: null
      }
    }

    case 'UPDATE_ITEM': {
      const newItems = state.items.map(item =>
        item.product._id === action.payload.productId
          ? { ...item, quantity: action.payload.quantity }
          : item
      ).filter(item => item.quantity > 0) // Remove items with 0 quantity

      const total = newItems.reduce((sum, item) => {
        const price = item.product.salePrice || item.product.price
        return sum + (price * item.quantity)
      }, 0)
      const itemCount = newItems.reduce((count, item) => count + item.quantity, 0)

      return {
        ...state,
        items: newItems,
        total,
        itemCount,
        error: null
      }
    }

    case 'REMOVE_ITEM': {
      const newItems = state.items.filter(item => item.product._id !== action.payload)
      const total = newItems.reduce((sum, item) => {
        const price = item.product.salePrice || item.product.price
        return sum + (price * item.quantity)
      }, 0)
      const itemCount = newItems.reduce((count, item) => count + item.quantity, 0)

      return {
        ...state,
        items: newItems,
        total,
        itemCount,
        error: null
      }
    }

    case 'CLEAR_CART':
      return {
        ...state,
        items: [],
        total: 0,
        itemCount: 0,
        error: null
      }

    default:
      return state
  }
}

const initialState: CartState = {
  items: [],
  isLoading: false,
  error: null,
  total: 0,
  itemCount: 0
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, initialState)
  const { data: session } = useSession()

  // Sync cart with server when user logs in
  useEffect(() => {
    if (session?.user?.id) {
      syncCart()
    }
  }, [session?.user?.id])

  // Load cart from localStorage on mount
  useEffect(() => {
    loadCartFromStorage()
  }, [])

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    if (!state.isLoading) {
      saveCartToStorage()
    }
  }, [state.items, state.isLoading])

  const loadCartFromStorage = () => {
    try {
      const savedCart = localStorage.getItem('cart')
      if (savedCart) {
        const cartData = JSON.parse(savedCart)
        dispatch({ type: 'SET_ITEMS', payload: cartData.items || [] })
      }
    } catch (error) {
      console.error('Error loading cart from storage:', error)
    }
  }

  const saveCartToStorage = () => {
    try {
      localStorage.setItem('cart', JSON.stringify({
        items: state.items,
        updatedAt: new Date().toISOString()
      }))
    } catch (error) {
      console.error('Error saving cart to storage:', error)
    }
  }

  const syncCart = async () => {
    if (!session?.user?.id) return

    try {
      dispatch({ type: 'SET_LOADING', payload: true })

      const response = await fetch('/api/cart', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      })

      if (response.ok) {
        const data = await response.json()
        dispatch({ type: 'SET_ITEMS', payload: data.items || [] })
      } else {
        // If no server cart exists, sync local cart to server
        if (state.items.length > 0) {
          await fetch('/api/cart', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ items: state.items })
          })
        }
      }
    } catch (error) {
      console.error('Error syncing cart:', error)
      dispatch({ type: 'SET_ERROR', payload: 'Failed to sync cart' })
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false })
    }
  }

  const addToCart = async (product: CartItem['product'], quantity: number = 1) => {
    try {
      // Check if product is free
      if (product.freebie) {
        // For freebies, we might want to handle differently
        // For now, we'll add them to cart with $0 price
      }

      const cartItem: CartItem = {
        id: `${product._id}-${Date.now()}`,
        product,
        quantity,
        addedAt: new Date().toISOString()
      }

      dispatch({ type: 'ADD_ITEM', payload: cartItem })

      // Sync with server if user is logged in
      if (session?.user?.id) {
        await fetch('/api/cart/add', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            productId: product._id,
            quantity
          })
        })
      }
    } catch (error) {
      console.error('Error adding to cart:', error)
      dispatch({ type: 'SET_ERROR', payload: 'Failed to add item to cart' })
    }
  }

  const removeFromCart = async (productId: string) => {
    try {
      dispatch({ type: 'REMOVE_ITEM', payload: productId })

      // Sync with server if user is logged in
      if (session?.user?.id) {
        await fetch('/api/cart/remove', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ productId })
        })
      }
    } catch (error) {
      console.error('Error removing from cart:', error)
      dispatch({ type: 'SET_ERROR', payload: 'Failed to remove item from cart' })
    }
  }

  const updateQuantity = async (productId: string, quantity: number) => {
    try {
      if (quantity <= 0) {
        await removeFromCart(productId)
        return
      }

      dispatch({ type: 'UPDATE_ITEM', payload: { productId, quantity } })

      // Sync with server if user is logged in
      if (session?.user?.id) {
        await fetch('/api/cart/update', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ productId, quantity })
        })
      }
    } catch (error) {
      console.error('Error updating cart:', error)
      dispatch({ type: 'SET_ERROR', payload: 'Failed to update cart' })
    }
  }

  const clearCart = async () => {
    try {
      dispatch({ type: 'CLEAR_CART' })

      // Sync with server if user is logged in
      if (session?.user?.id) {
        await fetch('/api/cart/clear', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          }
        })
      }
    } catch (error) {
      console.error('Error clearing cart:', error)
      dispatch({ type: 'SET_ERROR', payload: 'Failed to clear cart' })
    }
  }

  const value: CartContextType = {
    ...state,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    syncCart
  }

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}
