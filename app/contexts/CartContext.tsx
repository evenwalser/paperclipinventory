'use client'

import { createContext, useContext, useState, ReactNode } from 'react'

interface CartItem {
  id: number
  name: string
  price: number
  quantity: number
  image: string
  category: string
  stock: string
}

interface CartContextType {
  items: CartItem[]
  addItem: (item: Omit<CartItem, 'quantity'>) => void
  addItems: (items: Omit<CartItem, 'quantity'>[]) => void
  removeItem: (id: number) => void
  updateQuantity: (id: number, change: number) => void
  clearCart: () => void
  total: number
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])

  const addItem = (newItem: Omit<CartItem, 'quantity'>) => {
    setItems(currentItems => {
      const existingItem = currentItems.find(item => item.id === newItem.id)
      if (existingItem) {
        return currentItems.map(item =>
          item.id === newItem.id ? { ...item, quantity: item.quantity + 1 } : item
        )
      }
      return [...currentItems, { ...newItem, quantity: 1 }]
    })
  }

  const addItems = (newItems: Omit<CartItem, 'quantity'>[]) => {
    setItems(currentItems => {
      const updatedItems = [...currentItems]
      newItems.forEach(newItem => {
        const existingItemIndex = updatedItems.findIndex(item => item.id === newItem.id)
        if (existingItemIndex >= 0) {
          updatedItems[existingItemIndex].quantity += 1
        } else {
          updatedItems.push({ ...newItem, quantity: 1 })
        }
      })
      return updatedItems
    })
  }

  const removeItem = (id: number) => {
    setItems(currentItems => currentItems.filter(item => item.id !== id))
  }

  const updateQuantity = (id: number, change: number) => {
    setItems(currentItems => {
      return currentItems.map(item => {
        if (item.id === id) {
          const newQuantity = item.quantity + change
          return newQuantity > 0 ? { ...item, quantity: newQuantity } : null
        }
        return item
      }).filter((item): item is CartItem => item !== null)
    })
  }

  const clearCart = () => {
    setItems([])
  }

  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0)

  return (
    <CartContext.Provider value={{ 
      items, 
      addItem, 
      addItems,
      removeItem, 
      updateQuantity,
      clearCart, 
      total 
    }}>
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