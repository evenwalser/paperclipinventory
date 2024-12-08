'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Wand2, ChevronLeft, ChevronRight, X, GripVertical } from 'lucide-react'
import { motion, Reorder, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"

interface ItemType {
  id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  subcategory1?: string;
  subcategory2?: string;
  status: string;
  item_images?: { image_url: string }[];
}

export default function EditItemPage() {
  const params = useParams()
  const router = useRouter()
  const [item, setItem] = useState<ItemType | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isOptimizing, setIsOptimizing] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [images, setImages] = useState<string[]>([])
  const [currentImageIndex, setCurrentImageIndex] = useState(0)

  const [itemDetails, setItemDetails] = useState({
    name: '',
    description: '',
    price: '',
    category: ''
  });

  const [selectedCategories, setSelectedCategories] = useState({
    level1: '',
    level2: '',
    level3: ''
  });

  const [isSaving, setIsSaving] = useState(false);

  // Add this state to track selected thumbnails for deletion
  const [selectedThumbnail, setSelectedThumbnail] = useState<number | null>(null);

  useEffect(() => {
    const fetchItem = async () => {
      if (!params.id) return

      const { data, error } = await supabase
        .from('items')
        .select(`
          *,
          item_images (
            image_url,
            display_order
          )
        `)
        .eq('id', params.id)
        .single()

      if (error) {
        console.error('Error fetching item:', error)
        return
      }

      setItem(data)
      setIsLoading(false)

      // Set images from item_images
      if (data.item_images) {
        setImages(data.item_images.map(img => img.image_url))
      }

      // Pre-fill the form
      setItemDetails({
        name: data.title || '',
        description: data.description || '',
        price: data.price?.toString() || '',
        category: data.category || ''
      })

      setSelectedCategories({
        level1: data.category || '',
        level2: data.subcategory1 || '',
        level3: data.subcategory2 || ''
      })
    }

    fetchItem()
  }, [params.id])

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
    const files = event.target.files;
    if (!files) return;

    // Process each file
    for (const file of Array.from(files)) {
      if (file.type.startsWith('image/')) {
        try {
          const reader = new FileReader();
          const imageDataUrl = await new Promise<string>((resolve) => {
            reader.onload = () => resolve(reader.result as string);
            reader.readAsDataURL(file);
          });
          setImages(prev => [...prev, imageDataUrl]);
        } catch (error) {
          console.error('Error processing image:', error);
        }
      }
    }
  };

  const handleDeleteImage = async (indexToDelete: number) => {
    if (!item?.id) return;

    try {
      // Get the image URL that's being deleted
      const imageToDelete = images[indexToDelete];

      // Remove from database if it's an existing image
      if (imageToDelete.startsWith('http')) {
        const { error } = await supabase
          .from('item_images')
          .delete()
          .match({
            item_id: item.id,
            display_order: indexToDelete
          });

        if (error) {
          console.error('Database deletion error:', error);
          throw error;
        }

        // Fetch updated images from database to ensure sync
        const { data: updatedImages, error: fetchError } = await supabase
          .from('item_images')
          .select('image_url, display_order')
          .eq('item_id', item.id)
          .order('display_order');

        if (fetchError) {
          console.error('Error fetching updated images:', fetchError);
          throw fetchError;
        }

        // Update local state with fresh data
        setImages(updatedImages.map(img => img.image_url));
      } else {
        // For new images that aren't in the database yet
        setImages(prev => prev.filter((_, index) => index !== indexToDelete));
      }

      // Adjust current image index
      if (currentImageIndex >= images.length - 1) {
        setCurrentImageIndex(Math.max(0, images.length - 2));
      } else if (currentImageIndex > indexToDelete) {
        setCurrentImageIndex(currentImageIndex - 1);
      }

      // Clear selection
      setSelectedThumbnail(null);

    } catch (error) {
      console.error('Error deleting image:', error);
      alert('Failed to delete image. Please try again.');
    }
  };

  const handleSave = async () => {
    if (!item?.id) return;
    
    setIsSaving(true);
    
    try {
      // First update the item details
      const { error: itemError } = await supabase
        .from('items')
        .update({
          title: itemDetails.name,
          description: itemDetails.description,
          price: parseFloat(itemDetails.price),
          category: selectedCategories.level1,
          subcategory1: selectedCategories.level2,
          subcategory2: selectedCategories.level3,
          status: item.status,
          updated_at: new Date().toISOString()
        })
        .eq('id', item.id);

      if (itemError) throw itemError;

      // Then handle images
      // First, delete all existing image records
      const { error: deleteError } = await supabase
        .from('item_images')
        .delete()
        .eq('item_id', item.id);

      if (deleteError) throw deleteError;

      // Then create new image records
      const imagePromises = images.map((imageUrl, index) => {
        return supabase
          .from('item_images')
          .insert({
            item_id: item.id,
            image_url: imageUrl,
            display_order: index
          });
      });

      await Promise.all(imagePromises);

      // Redirect back to inventory
      router.push('/inventory');
    } catch (error) {
      console.error('Error saving changes:', error);
      alert('Failed to save changes. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

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
                    alt={item?.title || ""}
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
                      onClick={() => setCurrentImageIndex(prev => prev === 0 ? images.length - 1 : prev - 1)}
                      className="h-10 w-10 rounded-full bg-black/20 hover:bg-black/40 backdrop-blur-sm text-white"
                    >
                      <ChevronLeft className="h-6 w-6" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => setCurrentImageIndex(prev => prev === images.length - 1 ? 0 : prev + 1)}
                      className="h-10 w-10 rounded-full bg-black/20 hover:bg-black/40 backdrop-blur-sm text-white"
                    >
                      <ChevronRight className="h-6 w-6" />
                    </Button>
                  </div>
                )}

                {/* Image Counter */}
                <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-sm text-white px-3 py-1.5 rounded-full text-sm font-medium">
                  {currentImageIndex + 1} / {images.length}
                </div>
              </div>

              {/* Thumbnails */}
              <div className="flex gap-2 overflow-x-auto py-2">
                {images.map((image, index) => (
                  <div
                    key={image}
                    className={cn(
                      "relative w-20 h-20 rounded-md overflow-hidden flex-shrink-0 cursor-pointer border-2 transition-all duration-200",
                      selectedThumbnail === index ? "border-red-500" : "border-transparent",
                      "hover:border-gray-300"
                    )}
                    onClick={() => {
                      setSelectedThumbnail(selectedThumbnail === index ? null : index);
                      setCurrentImageIndex(index);
                    }}
                  >
                    <img
                      src={image}
                      alt={`Thumbnail ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                    {selectedThumbnail === index && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="absolute inset-0 bg-black/50 flex items-center justify-center"
                      >
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteImage(index);
                          }}
                          className="text-white bg-red-500 hover:bg-red-600"
                        >
                          Remove
                        </Button>
                      </motion.div>
                    )}
                  </div>
                ))}
              </div>

              {/* File Input and Add Button */}
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                multiple
                onChange={handleFileChange}
              />
              <Button 
                className="w-full bg-gray-100 text-gray-800 hover:bg-gray-200"
                onClick={() => fileInputRef.current?.click()}
              >
                + Add More Images
                {images.length > 0 && (
                  <span className="ml-2 text-sm text-gray-500">
                    ({images.length})
                  </span>
                )}
              </Button>
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
                  <Input 
                    id="price" 
                    type="number" 
                    value={itemDetails.price}
                    onChange={(e) => setItemDetails(prev => ({
                      ...prev,
                      price: e.target.value
                    }))}
                  />
                </div>
                <div className="w-full space-y-4">
                  <div>
                    <Label htmlFor="category">Main Category</Label>
                    <Select 
                      value={selectedCategories.level1}
                      onValueChange={(value) => setSelectedCategories(prev => ({
                        ...prev,
                        level1: value
                      }))}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
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
                <Select 
                  value={item?.status || "available"}
                  onValueChange={(value) => setItem(prev => prev ? {
                    ...prev,
                    status: value
                  } : null)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="available">In Stock</SelectItem>
                    <SelectItem value="low_stock">Low Stock</SelectItem>
                    <SelectItem value="out_of_stock">Out of Stock</SelectItem>
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
            <Button 
              onClick={handleSave}
              disabled={isSaving}
              className={cn(
                "w-full sm:w-auto text-white transition-colors",
                isSaving 
                  ? "bg-green-500 hover:bg-green-600" 
                  : "bg-blue-500 hover:bg-blue-600"
              )}
            >
              {isSaving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/60 border-t-white mr-2" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

