'use client'

import { useEffect, useState } from 'react'
import { getItems } from '@/lib/services/items'
import { Item } from '@/types/supabase'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { PlusCircle, Pencil, Trash2, ShoppingCart } from 'lucide-react'
import { useCart } from '../contexts/CartContext'

export default function InventoryPage() {
  const [items, setItems] = useState<Item[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedItems, setSelectedItems] = useState<number[]>([])
  const { addItems } = useCart()
  const router = useRouter()

  useEffect(() => {
    const loadItems = async () => {
      try {
        const data = await getItems()
        setItems(data)
      } catch (error) {
        console.error('Failed to load items:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadItems()
  }, [])

  const toggleItemSelection = (id: number) => {
    setSelectedItems(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    )
  }

  const sendSelectedToPOS = () => {
    const selectedItemsData = items.filter(item => selectedItems.includes(item.id))
    addItems(selectedItemsData)
    router.push('/pos')
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <h1 className="text-2xl sm:text-3xl font-bold">Inventory</h1>
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 w-full sm:w-auto">
          <Button 
            onClick={sendSelectedToPOS} 
            disabled={selectedItems.length === 0}
            className="bg-[#FF3B30] hover:bg-[#E6352B] text-white"
          >
            Send to POS
          </Button>
          <Button 
            onClick={() => router.push('/inventory/add')}
            className="bg-[#FF3B30] hover:bg-[#E6352B] text-white"
          >
            Add New Item
          </Button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
        <Input 
          placeholder="Search inventory..." 
          className="flex-grow"
        />
        <Select>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="clothing">Clothing</SelectItem>
            <SelectItem value="home-decor">Home Decor</SelectItem>
            <SelectItem value="electronics">Electronics</SelectItem>
            <SelectItem value="furniture">Furniture</SelectItem>
            <SelectItem value="accessories">Accessories</SelectItem>
            <SelectItem value="music">Music</SelectItem>
            <SelectItem value="sold">Sold Items</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {items.map((item) => (
          <Card 
            key={item.id} 
            className={`overflow-hidden transition-shadow duration-300 ${
              selectedItems.includes(item.id) ? 'ring-2 ring-[#FF3B30]' : ''
            }`}
          >
            <CardContent className="p-4">
              <div className="relative mb-4">
                <img src={item.item_images[0]?.image_url} alt={item.title} className="w-full h-40 sm:h-48 object-cover rounded-lg" />
                {selectedItems.includes(item.id) && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-lg">
                    <span className="text-white text-lg sm:text-xl font-bold">Selected</span>
                  </div>
                )}
              </div>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 space-y-2 sm:space-y-0">
                <div>
                  <h3 className="text-lg sm:text-xl font-semibold mb-1 sm:mb-2">{item.title}</h3>
                  <p className="text-xl sm:text-2xl font-bold text-gray-700">£{item.price.toFixed(2)}</p>
                </div>
                <div className="flex items-center">
                  {item.status === "available" && (
                    <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      In Stock
                    </span>
                  )}
                  {item.status === "low-stock" && (
                    <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                      Low Stock
                    </span>
                  )}
                  {item.status === "out-of-stock" && (
                    <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                      Out of Stock
                    </span>
                  )}
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-4">Category: {item.category}</p>
              <div className="grid grid-cols-3 gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full"
                  onClick={() => router.push(`/inventory/edit/${item.id}`)}
                >
                  <Pencil className="mr-1 h-3 w-3" /> Edit
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="mr-1 h-3 w-3" /> Delete
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className={`w-full ${
                    selectedItems.includes(item.id) 
                      ? 'bg-[#FF3B30] text-white hover:bg-[#E6352B]' 
                      : 'hover:bg-gray-100'
                  }`}
                  onClick={() => toggleItemSelection(item.id)}
                >
                  {selectedItems.includes(item.id) ? 'Deselect' : 'Select'}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

