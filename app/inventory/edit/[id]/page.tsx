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
import { Wand2, ChevronLeft, ChevronRight, X, GripVertical, Upload } from 'lucide-react'
import { motion, Reorder, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import { analyzeImage } from "@/lib/together"

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

interface ItemImage {
  image_url: string;
  display_order: number;
}

async function urlToBase64(url: string): Promise<string> {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('Error converting URL to base64:', error);
    throw error;
  }
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

  // Add state for AI processing
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const [isProcessingImages, setIsProcessingImages] = useState(false);

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

      // Convert Supabase URLs to base64
      if (data.item_images) {
        try {
          const base64Images = await Promise.all(
            data.item_images.map(async (img: ItemImage) => {
              return await urlToBase64(img.image_url);
            })
          );
          setImages(base64Images);
        } catch (error) {
          console.error('Error converting images to base64:', error);
        }
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

  const handleOptimizeWithAI = async () => {
    if (!images.length) {
      alert('Please add at least one image to analyze');
      return;
    }

    setIsAnalyzing(true);
    try {
      const currentImage = images[currentImageIndex];
      console.log('Starting AI analysis for image:', {
        index: currentImageIndex,
        type: typeof currentImage,
        isBase64: currentImage.startsWith('data:'),
      });

      const result = await analyzeImage(currentImage);
      
      // Update form with validated response
      setItemDetails(prev => ({
        ...prev,
        name: result.title || prev.name,
        description: result.description || prev.description,
        price: result.price_avg?.toString() || prev.price,
        category: result.category_id || prev.category
      }));

      // Update condition if provided
      if (result.condition) {
        setSelectedCategories(prev => ({
          ...prev,
          level1: result.category_id
        }));
      }

    } catch (error) {
      console.error('AI analysis failed:', error);
      alert('Failed to analyze image. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setIsProcessingImages(true);
    try {
      // Process each file sequentially
      for (const file of Array.from(files)) {
        if (!file.type.startsWith('image/')) {
          console.warn('Skipping non-image file:', file.name);
          continue;
        }

        // Convert to base64
        const reader = new FileReader();
        const imageDataUrl = await new Promise<string>((resolve, reject) => {
          reader.onload = () => {
            if (typeof reader.result === 'string') {
              resolve(reader.result);
            } else {
              reject(new Error('Failed to read file'));
            }
          };
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });

        // Add to images array
        setImages(prev => [...prev, imageDataUrl]);
      }

      // Clear input for next use
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

    } catch (error) {
      console.error('Error processing images:', error);
      alert('Failed to process images. Please try again.');
    } finally {
      setIsProcessingImages(false);
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
              {/* Main Image Display */}
              {images.length > 0 && (
                <div className="space-y-4">
                  {/* Current Image */}
                  <div className="bg-black rounded-2xl overflow-hidden">
                    <div className="aspect-[4/3] relative">
                      <img
                        src={images[currentImageIndex]}
                        alt={`Image ${currentImageIndex + 1}`}
                        className="w-full h-full object-contain"
                      />
                      
                      {/* Navigation Arrows */}
                      {images.length > 1 && (
                        <div className="absolute inset-0 flex items-center justify-between p-4">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setCurrentImageIndex(prev => prev === 0 ? images.length - 1 : prev - 1)}
                            className="h-10 w-10 rounded-full bg-black/20 hover:bg-black/40 text-white"
                          >
                            <ChevronLeft className="h-6 w-6" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setCurrentImageIndex(prev => prev === images.length - 1 ? 0 : prev + 1)}
                            className="h-10 w-10 rounded-full bg-black/20 hover:bg-black/40 text-white"
                          >
                            <ChevronRight className="h-6 w-6" />
                          </Button>
                        </div>
                      )}

                      {/* Image Counter */}
                      <div className="absolute top-4 right-4 bg-black/60 text-white px-3 py-1.5 rounded-full text-sm">
                        {currentImageIndex + 1} / {images.length}
                      </div>
                    </div>
                  </div>

                  {/* Thumbnails */}
                  <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl p-4">
                    <div className="flex gap-3 overflow-x-auto py-2 px-1">
                      {images.map((image, index) => (
                        <div
                          key={index}
                          onClick={() => setCurrentImageIndex(index)}
                          className={`relative flex-shrink-0 cursor-pointer group
                            ${index === currentImageIndex ? 'ring-2 ring-blue-500' : ''}`}
                        >
                          <div className="w-20 h-20 rounded-lg overflow-hidden border-2 border-transparent 
                                       hover:border-white/25 transition-all duration-200">
                            <img
                              src={image}
                              alt={`Thumbnail ${index + 1}`}
                              className="w-full h-full object-cover"
                            />
                            <Button
                              variant="destructive"
                              size="icon"
                              className="absolute top-1 right-1 h-5 w-5 rounded-full opacity-0 
                                       group-hover:opacity-100 transition-opacity duration-200"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteImage(index);
                              }}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* File Input and Button */}
              <div className="space-y-4">
                <input 
                  ref={fileInputRef}
                  type="file" 
                  accept="image/*" 
                  multiple
                  className="hidden"
                  onChange={handleFileChange}
                />

                <Button 
                  variant="outline" 
                  className="h-32 text-lg w-full"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isProcessingImages}
                >
                  {isProcessingImages ? (
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin h-5 w-5 border-2 border-current border-t-transparent rounded-full" />
                      <span>Processing...</span>
                    </div>
                  ) : (
                    <>
                      <Upload className="mr-2 h-6 w-6" />
                      Choose Photo
                    </>
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
              onClick={handleOptimizeWithAI}
              className="flex items-center space-x-2 bg-purple-600 hover:bg-purple-700 text-white"
              disabled={isAnalyzing || images.length === 0}
            >
              {isAnalyzing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/60 border-t-white" />
                  <span>Analyzing...</span>
                </>
              ) : (
                <>
                  <span className="text-lg">🤖</span>
                  <span>Optimise listing with AI</span>
                </>
              )}
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

