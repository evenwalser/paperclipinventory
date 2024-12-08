'use client'

import { createContext, useContext, useState, ReactNode } from 'react'

interface CartItem {
  id: string;
  title: string;
  price: number;
  image_url?: string;
  category: string;
  size?: string;
  quantity: number;
}

const CartContext = createContext<{
  items: CartItem[];
  addItems: (items: Omit<CartItem, 'quantity'>[]) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  total: number;
} | undefined>(undefined);

export function useCart() {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}

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

  const removeItem = (id: string) => {
    setItems(currentItems => currentItems.filter(item => item.id !== id))
  }

  const updateQuantity = (id: string, newQuantity: number) => {
    setItems(currentItems => {
      return currentItems.map(item => {
        if (item.id === id) {
          return { ...item, quantity: Math.max(1, newQuantity) };
        }
        return item;
      });
    });
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