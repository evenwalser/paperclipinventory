'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Wand2 } from 'lucide-react'
import { cn } from "@/lib/utils"
import { GripVertical } from "lucide-react"
import { X } from "lucide-react"
import { motion, Reorder } from "framer-motion"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { AnimatePresence } from "framer-motion"

// Mock data for a single item
const item = {
  id: 1,
  name: "Vintage Denim Jacket",
  description: "A classic denim jacket from the 90s. Great condition with slight distressing for an authentic vintage look.",
  price: 89.99,
  category: "Clothing",
  subcategory1: "Outerwear",
  subcategory2: "Jackets",
  stock: "In Stock",
  image: "/placeholder.svg?height=400&width=400"
}

export default function EditItemPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [isOptimizing, setIsOptimizing] = useState(false)
  const [selectedImage, setSelectedImage] = useState(item.image)
  const [images, setImages] = useState<string[]>([selectedImage])
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleOptimize = async () => {
    setIsOptimizing(true)
    try {
      // Convert current image to File object
      const response = await fetch(images[currentImageIndex])
      const blob = await response.blob()
      const file = new File([blob], 'image.jpg', { type: 'image/jpeg' })

      // Call AI analysis
      const result = await analyzeImage(file)

      // Update form with AI results
      setItemDetails({
        name: result.title,
        description: result.description,
        price: result.price_avg.toString(),
        category: result.category_id
      })

      // Update categories if provided
      if (result.category_id) {
        setSelectedCategories({
          level1: result.category_id,
          level2: "",
          level3: ""
        })
      }

      // Update condition if provided
      if (result.condition) {
        setCondition(result.condition)
      }

    } catch (error) {
      console.error('AI analysis failed:', error)
      alert('Failed to analyze image. Please try again or fill in details manually.')
    } finally {
      setIsOptimizing(false)
    }
  }

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files) return

    const newImages: string[] = []
    
    // Convert FileList to Array for iteration
    Array.from(files).forEach(async (file) => {
      if (file.type.startsWith('image/')) {
        try {
          const reader = new FileReader()
          const imageDataUrl = await new Promise<string>((resolve) => {
            reader.onload = () => resolve(reader.result as string)
            reader.readAsDataURL(file)
          })
          newImages.push(imageDataUrl)
        } catch (error) {
          console.error('Error processing image:', error)
        }
      }
    })

    setImages(prev => [...prev, ...newImages])
    setCurrentImageIndex(images.length) // Show the newly added image
  }

  const handleDeleteImage = (indexToDelete: number) => {
    setImages(prev => {
      const newImages = prev.filter((_, index) => index !== indexToDelete)
      // Adjust currentImageIndex if needed
      if (currentImageIndex >= indexToDelete && currentImageIndex > 0) {
        setCurrentImageIndex(currentImageIndex - 1)
      }
      return newImages
    })
  }

  // Add state for form values
  const [itemDetails, setItemDetails] = useState({
    name: item.name,
    description: item.description,
    price: item.price.toString(),
    category: item.category
  })

  const [selectedCategories, setSelectedCategories] = useState({
    level1: item.category,
    level2: item.subcategory1,
    level3: item.subcategory2
  })

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 sm:space-y-8">
      <Button 
        variant="link" 
        onClick={() => router.push('/inventory')}
        className="mb-4"
      >
        &larr; Back to Inventory
      </Button>
      <h1 className="text-2xl sm:text-3xl font-bold">Edit Item</h1>
      <Card>
        <CardHeader>
          <CardTitle>Item Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col md:flex-row space-y-6 md:space-y-0 md:space-x-6">
            <div className="w-full md:w-1/3 space-y-4">
              <div className="relative aspect-[4/3] rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800">
                <AnimatePresence mode="wait">
                  <motion.img 
                    key={images[currentImageIndex]}
                    src={images[currentImageIndex]} 
                    alt={item.name}
                    className="w-full h-full object-contain"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.2 }}
                  />
                </AnimatePresence>

                {/* Navigation Arrows */}
                {images.length > 1 && (
                  <div className="absolute inset-0 flex items-center justify-between p-4">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => {
                        setCurrentImageIndex(prev => 
                          prev === 0 ? images.length - 1 : prev - 1
                        )
                      }}
                      className="h-10 w-10 rounded-full bg-black/20 hover:bg-black/40 backdrop-blur-sm text-white"
                    >
                      <ChevronLeft className="h-6 w-6" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => {
                        setCurrentImageIndex(prev => 
                          prev === images.length - 1 ? 0 : prev + 1
                        )
                      }}
                      className="h-10 w-10 rounded-full bg-black/20 hover:bg-black/40 backdrop-blur-sm text-white"
                    >
                      <ChevronRight className="h-6 w-6" />
                    </Button>
                  </div>
                )}

                {/* Image Counter */}
                <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-sm text-white px-3 py-1.5 
                                rounded-full text-sm font-medium">
                  {currentImageIndex + 1} / {images.length}
                </div>
              </div>

              {images.length > 1 && (
                <Reorder.Group 
                  axis="x" 
                  values={images} 
                  onReorder={setImages}
                  className="flex gap-2 overflow-x-auto py-2"
                >
                  {images.map((image, index) => (
                    <Reorder.Item
                      key={image}
                      value={image}
                      className="relative"
                    >
                      <motion.div
                        className={cn(
                          "group relative w-16 h-16 rounded-md overflow-hidden flex-shrink-0 cursor-move",
                          currentImageIndex === index && "ring-2 ring-blue-500"
                        )}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <img
                          src={image}
                          alt={`Thumbnail ${index + 1}`}
                          className="w-full h-full object-cover"
                          onClick={() => setCurrentImageIndex(index)}
                        />
                        
                        {/* Delete button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDeleteImage(index)
                          }}
                          className="absolute top-0 right-0 p-1 bg-red-500 text-white rounded-bl-md 
                                 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="h-3 w-3" />
                        </button>

                        {/* Drag handle */}
                        <div className="absolute bottom-0 left-0 right-0 h-6 bg-black/50 
                                      flex items-center justify-center opacity-0 group-hover:opacity-100 
                                      transition-opacity">
                          <GripVertical className="h-4 w-4 text-white" />
                        </div>

                        {/* Selected indicator */}
                        {currentImageIndex === index && (
                          <motion.div
                            className="absolute bottom-0 left-0 right-0 h-1 bg-blue-500"
                            layoutId="selectedIndicator"
                          />
                        )}
                      </motion.div>
                    </Reorder.Item>
                  ))}
                </Reorder.Group>
              )}

              <div className="flex space-x-2">
                <Button 
                  className="flex-1 bg-gray-100 text-gray-800 hover:bg-gray-200"
                  onClick={() => fileInputRef.current?.click()}
                >
                  + Add More Images
                  {images.length > 0 && (
                    <span className="ml-2 text-sm text-gray-500">
                      ({images.length} images)
                    </span>
                  )}
                </Button>
              </div>
            </div>
            <div className="w-full md:w-2/3 space-y-4">
              <div>
                <Label htmlFor="name">Name</Label>
                <Input 
                  id="name" 
                  value={itemDetails.name}
                  onChange={(e) => setItemDetails(prev => ({
                    ...prev,
                    name: e.target.value
                  }))}
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea 
                  id="description" 
                  value={itemDetails.description}
                  onChange={(e) => setItemDetails(prev => ({
                    ...prev,
                    description: e.target.value
                  }))}
                />
              </div>
              <div className="w-full space-y-4">
                <div>
                  <Label htmlFor="price">Price</Label>
                  <Input id="price" type="number" value={itemDetails.price} />
                </div>
                <div className="w-full space-y-4">
                  <div>
                    <Label htmlFor="category">Main Category</Label>
                    <Select defaultValue={itemDetails.category}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent className="bg-white dark:bg-gray-800 border dark:border-gray-700 shadow-lg">
                        <SelectItem value="Clothing">Clothing</SelectItem>
                        <SelectItem value="Home Decor">Home Decor</SelectItem>
                        <SelectItem value="Electronics">Electronics</SelectItem>
                        <SelectItem value="Furniture">Furniture</SelectItem>
                        <SelectItem value="Accessories">Accessories</SelectItem>
                        <SelectItem value="Music">Music</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="subcategory1">Subcategory 1</Label>
                    <Select defaultValue={selectedCategories.level2}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select subcategory" />
                      </SelectTrigger>
                      <SelectContent className="bg-white dark:bg-gray-800 border dark:border-gray-700 shadow-lg">
                        <SelectItem value="SubCat1A">SubCat1A</SelectItem>
                        <SelectItem value="SubCat1B">SubCat1B</SelectItem>
                        <SelectItem value="SubCat1C">SubCat1C</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="subcategory2">Subcategory 2</Label>
                    <Select defaultValue={selectedCategories.level3}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select subcategory" />
                      </SelectTrigger>
                      <SelectContent className="bg-white dark:bg-gray-800 border dark:border-gray-700 shadow-lg">
                        <SelectItem value="SubCat2A">SubCat2A</SelectItem>
                        <SelectItem value="SubCat2B">SubCat2B</SelectItem>
                        <SelectItem value="SubCat2C">SubCat2C</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              <div>
                <Label htmlFor="stock">Stock Status</Label>
                <Select defaultValue={item.stock}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-gray-800 border dark:border-gray-700 shadow-lg">
                    <SelectItem value="In Stock">In Stock</SelectItem>
                    <SelectItem value="Low Stock">Low Stock</SelectItem>
                    <SelectItem value="Out of Stock">Out of Stock</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row justify-between space-y-4 sm:space-y-0 sm:space-x-4">
            <Button 
              onClick={handleOptimize} 
              disabled={isOptimizing}
              className="w-full sm:w-auto bg-purple-600 hover:bg-purple-700 text-white"
            >
              <Wand2 className="mr-2 h-5 w-5" />
              {isOptimizing ? 'Optimizing...' : 'Optimise listing with AI'}
            </Button>
            <Button className="w-full sm:w-auto bg-blue-500 hover:bg-blue-600 text-white">
              Save Changes
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

