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
import { supabase } from '@/lib/supabase'
import { DeleteDialog } from '@/components/ui/delete-dialog'
import { cn } from '@/lib/utils'
import Image from 'next/image'

interface InventoryItem {
  id: string;
  title: string;
  price: number;
  category: string;
  item_images?: { image_url: string }[];
}

export default function InventoryPage() {
  const [items, setItems] = useState<Item[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedItems, setSelectedItems] = useState<number[]>([])
  const { addItems } = useCart()
  const router = useRouter()
  const [deletingItems, setDeletingItems] = useState<Set<string>>(new Set());
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    const loadItems = async () => {
      try {
        setIsLoading(true);
        const { items, totalPages } = await getItems(currentPage);
        setItems(items);
        setTotalPages(totalPages);
      } catch (error) {
        console.error('Failed to load items:', error);
      } finally {
        setIsLoading(false);
        setIsTransitioning(false);
      }
    };

    loadItems();
  }, [currentPage]);

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

  const handleDelete = async (itemId: string) => {
    setDeletingItems(prev => new Set(prev).add(itemId));
    try {
      // First, delete associated images from storage
      const { data: imageData } = await supabase
        .from('item_images')
        .select('image_url')
        .eq('item_id', itemId);

      if (imageData?.length) {
        // Extract file paths from URLs and delete from storage
        const filePaths = imageData.map(img => {
          const url = new URL(img.image_url);
          return url.pathname.split('/').pop()!;
        });

        if (filePaths.length > 0) {
          await supabase.storage
            .from('items')
            .remove(filePaths);
        }
      }

      // Delete image records
      await supabase
        .from('item_images')
        .delete()
        .eq('item_id', itemId);

      // Delete the item
      await supabase
        .from('items')
        .delete()
        .eq('id', itemId);

      // Update local state
      setItems(prevItems => prevItems.filter(item => item.id !== itemId));
      
      // Close the delete dialog if open
      setItemToDelete(null);

    } catch (error) {
      console.error('Error deleting item:', error);
      alert('Failed to delete item. Please try again.');
    } finally {
      setDeletingItems(prev => {
        const next = new Set(prev);
        next.delete(itemId);
        return next;
      });
    }
  };

  const handleDeleteClick = (itemId: string) => {
    setItemToDelete(itemId);
  };

  const handleDeleteConfirm = async () => {
    if (itemToDelete) {
      await handleDelete(itemToDelete);
    }
  };

  const handlePageChange = async (newPage: number) => {
    setIsTransitioning(true);
    setCurrentPage(newPage);
    // The useEffect will handle the data fetching
  };

  // Add pagination controls
  const Pagination = () => (
    <div className="flex justify-center items-center space-x-2 mt-8">
      <Button
        variant="outline"
        size="sm"
        onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
        disabled={currentPage === 1 || isLoading || isTransitioning}
      >
        Previous
      </Button>
      
      <div className="flex items-center space-x-2">
        {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
          <Button
            key={page}
            variant={currentPage === page ? "default" : "outline"}
            size="sm"
            onClick={() => setCurrentPage(page)}
            disabled={isLoading}
            className={cn(
              "w-8 h-8",
              currentPage === page && "bg-[#FF3B30] text-white"
            )}
          >
            {page}
          </Button>
        ))}
      </div>

      <Button
        variant="outline"
        size="sm"
        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
        disabled={currentPage === totalPages || isLoading}
      >
        Next
      </Button>
    </div>
  );

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
        {isLoading ? (
          Array.from({ length: 9 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4">
                <div className="aspect-[4/3] bg-gray-200 rounded-lg mb-4" />
                <div className="space-y-3">
                  <div className="h-6 bg-gray-200 rounded w-3/4" />
                  <div className="h-8 bg-gray-200 rounded w-1/2" />
                  <div className="h-4 bg-gray-200 rounded w-1/4" />
                  <div className="grid grid-cols-3 gap-2 mt-4">
                    <div className="h-8 bg-gray-200 rounded" />
                    <div className="h-8 bg-gray-200 rounded" />
                    <div className="h-8 bg-gray-200 rounded" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          items.map((item) => (
            <Card 
              key={item.id} 
              className={`overflow-hidden transition-shadow duration-300 ${
                selectedItems.includes(item.id) ? 'ring-2 ring-[#FF3B30]' : ''
              }`}
            >
              <CardContent className="p-4">
                <div className="relative mb-4 aspect-[4/3]">
                  <Image
                    src={item.item_images[0]?.image_url || '/placeholder.svg'}
                    alt={item.title}
                    fill
                    className="object-cover rounded-lg"
                    loading="lazy"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    placeholder="blur"
                    blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/4gHYSUNDX1BST0ZJTEUAAQEAAAHIAAAAAAQwAABtbnRyUkdCIFhZWiAH4AABAAEAAAAAAABhY3NwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAA9tYAAQAAAADTLQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAlkZXNjAAAA8AAAACRyWFlaAAABFAAAABRnWFlaAAABKAAAABRiWFlaAAABPAAAABR3dHB0AAABUAAAABRyVFJDAAABZAAAAChnVFJDAAABZAAAAChiVFJDAAABZAAAAChjcHJ0AAABjAAAADxtbHVjAAAAAAAAAAEAAAAMZW5VUwAAAAgAAAAcAHMAUgBHAEJYWVogAAAAAAAAb6IAADj1AAADkFhZWiAAAAAAAABimQAAt4UAABjaWFlaIAAAAAAAACSgAAAPhAAAts9YWVogAAAAAAAA9tYAAQAAAADTLXBhcmEAAAAAAAQAAAACZmYAAPKnAAANWQAAE9AAAApbAAAAAAAAAABtbHVjAAAAAAAAAAEAAAAMZW5VUwAAACAAAAAcAEcAbwBvAGcAbABlACAASQBuAGMALgAgADIAMAAxADb/2wBDABQODxIPDRQSEBIXFRQdHx4eHRoaHSQtJSEkMjU1LC0yMi4xODY6OTg2MDQ0PkE5OD5FRU1NTy9RUVFRUVFRUVH/2wBDAR"
                  />
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
                    disabled={deletingItems.has(item.id)}
                    onClick={() => handleDeleteClick(item.id)}
                  >
                    {deletingItems.has(item.id) ? (
                      <>
                        <div className="animate-spin h-3 w-3 border-2 border-current border-t-transparent rounded-full mr-1" />
                        <span>Deleting...</span>
                      </>
                    ) : (
                      <>
                        <Trash2 className="mr-1 h-3 w-3" />
                        Delete
                      </>
                    )}
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
          ))
        )}
      </div>

      {totalPages > 1 && <Pagination />}

      <DeleteDialog
        isOpen={!!itemToDelete}
        onClose={() => setItemToDelete(null)}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  )
}

