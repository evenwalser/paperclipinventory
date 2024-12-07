'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Camera, RotateCcw, Check, Upload, ChevronLeft, ChevronRight, X } from 'lucide-react'
import { CategorySelector } from "@/components/category-selector"
import Link from 'next/link'
import { analyzeImage } from "../../lib/together"
import { createItem, uploadItemImage } from '@/lib/services/items';
import { useRouter } from 'next/navigation';
import { resizeImage } from '@/lib/utils/imageProcessing'
import { ImageLightbox } from "../../components/ImageLightbox"
import { motion, AnimatePresence, Reorder } from "framer-motion"
import { ConditionSelector } from "../../components/ConditionSelector"
import { SizeSelector } from "../../components/SizeSelector"

const base64ToFile = async (base64String: string): Promise<File> => {
  const response = await fetch(base64String);
  const blob = await response.blob();
  return new File([blob], 'image.jpg', { type: 'image/jpeg' });
};

export default function AddItemPage() {
  const [images, setImages] = useState<string[]>([])
  const [capturedImage, setCapturedImage] = useState<string | null>(null)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isCameraActive, setIsCameraActive] = useState(false)
  const [selectedCategories, setSelectedCategories] = useState({
    level1: "",
    level2: "",
    level3: "",
  })
  const [needsUserGesture, setNeedsUserGesture] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [itemDetails, setItemDetails] = useState({
    name: '',
    description: '',
    price: '',
    category: ''
  })
  const router = useRouter();
  const [isDragging, setIsDragging] = useState(false)
  const dropZoneRef = useRef<HTMLDivElement>(null)
  const [lightboxImage, setLightboxImage] = useState<string | null>(null)
  const [condition, setCondition] = useState<'New' | 'Like New' | 'Very Good' | 'Good' | 'Fair'>('New')
  const [size, setSize] = useState('')
  const [availableInStore, setAvailableInStore] = useState(true)
  const [listOnPaperclip, setListOnPaperclip] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    // Cleanup function
    return () => {
      if (videoRef.current?.srcObject) {
        const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
        tracks.forEach(track => track.stop());
      }
    };
  }, []);

  const startCamera = async () => {
    console.log('Starting camera...');
    
    try {
      // First, check if we already have an active stream and clean it up
      if (videoRef.current?.srcObject) {
        const oldStream = videoRef.current.srcObject as MediaStream;
        oldStream.getTracks().forEach(track => track.stop());
      }

      // Safari-specific constraints
      const constraints = {
        video: {
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      };

      console.log('Requesting camera with constraints:', constraints);
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      console.log('Got stream:', stream);

      if (!videoRef.current) {
        console.error('Video ref is null');
        return;
      }

      // Reset video element
      videoRef.current.srcObject = null;
      
      // Set attributes before assigning stream
      videoRef.current.setAttribute('autoplay', '');
      videoRef.current.setAttribute('playsinline', '');
      videoRef.current.setAttribute('muted', '');
      videoRef.current.muted = true; // Explicitly set muted

      // Assign stream
      videoRef.current.srcObject = stream;

      // Wait for metadata to be loaded before playing
      videoRef.current.onloadedmetadata = async () => {
        console.log('Video metadata loaded');
        try {
          await videoRef.current?.play();
          console.log('Video playing');
          setIsCameraActive(true);
          setNeedsUserGesture(false);
        } catch (playError) {
          console.error('Play failed:', playError);
          setNeedsUserGesture(true);
        }
      };

    } catch (err) {
      console.error('Camera error:', err);
      if (err instanceof Error) {
        if (err.name === 'NotAllowedError') {
          alert('Camera access was denied. Please allow camera access and try again.');
        } else {
          alert(`Camera error: ${err.message}`);
        }
      }
    }
  };

  const handleManualPlay = async () => {
    if (videoRef.current) {
      try {
        await videoRef.current.play();
        setNeedsUserGesture(false);
      } catch (error) {
        console.error('Manual play failed:', error);
      }
    }
  };

  const stopCamera = () => {
    if (!videoRef.current?.srcObject) return;

    try {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
      setIsCameraActive(false);
    } catch (error) {
      console.error('Error stopping camera:', error);
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext('2d')
      if (context) {
        canvasRef.current.width = videoRef.current.videoWidth
        canvasRef.current.height = videoRef.current.videoHeight
        context.drawImage(videoRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height)
        const imageDataUrl = canvasRef.current.toDataURL('image/jpeg')
        setCapturedImage(imageDataUrl)
        stopCamera()
      }
    }
  }

  const retakePhoto = () => {
    setCapturedImage(null)
    startCamera()
  }

  const analyzeImageWithAI = async (imageData: string) => {
    setIsAnalyzing(true);
    try {
      console.log('Starting image analysis...');
      const result = await analyzeImage(imageData);
      console.log('Analysis result:', result);

      setItemDetails(prev => ({
        ...prev,
        name: result.name || prev.name,
        description: result.description || prev.description,
        price: result.price?.toString() || prev.price,
        category: result.category || prev.category
      }));
      
      if (result.category) {
        setSelectedCategories(prev => ({
          ...prev,
          level1: result.category,
          level2: "",
          level3: ""
        }));
      }
    } catch (error) {
      console.error('Error in analyzeImageWithAI:', error);
      let errorMessage = 'Failed to analyze image. ';
      if (error instanceof Error) {
        errorMessage += error.message;
      } else {
        errorMessage += 'Please try again or fill in details manually.';
      }
      alert(errorMessage);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const usePhoto = async () => {
    if (capturedImage) {
      setImages(prev => [...prev, capturedImage]);
      setCurrentImageIndex(images.length);
      await analyzeImageWithAI(capturedImage);
      setCapturedImage(null);
    }
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || !files[0]) return;

    try {
      console.log('Processing images...');
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (file.type.startsWith('image/')) {
          try {
            const resizedFile = await resizeImage(file);
            const base64Data = await new Promise<string>((resolve, reject) => {
              const reader = new FileReader();
              reader.onload = () => {
                if (typeof reader.result === 'string') {
                  resolve(reader.result);
                } else {
                  reject(new Error('Failed to convert image'));
                }
              };
              reader.onerror = () => reject(reader.error);
              reader.readAsDataURL(resizedFile);
            });

            setImages(prev => [...prev, base64Data]);
            // Set to first image if this is the first upload
            if (i === 0 && images.length === 0) {
              setCurrentImageIndex(0);
            }
          } catch (error) {
            console.error(`Error processing image ${file.name}:`, error);
            alert(`Failed to process image ${file.name}. Please try again.`);
          }
        }
      }
    } catch (error) {
      console.error('Error handling files:', error);
      alert('Failed to process images. Please try again.');
    }
  };

  const nextImage = () => {
    if (images.length > 0) {
      setCurrentImageIndex((prevIndex) => {
        const nextIndex = prevIndex + 1;
        return nextIndex >= images.length ? 0 : nextIndex;
      });
    }
  };

  const prevImage = () => {
    if (images.length > 0) {
      setCurrentImageIndex((prevIndex) => {
        const nextIndex = prevIndex - 1;
        return nextIndex < 0 ? images.length - 1 : nextIndex;
      });
    }
  };

  const handleSubmit = async () => {
    try {
      // Create the item in Supabase
      const item = await createItem({
        title: itemDetails.name,
        description: itemDetails.description || '',
        price: parseFloat(itemDetails.price),
        category: selectedCategories.level1,
        subcategory1: selectedCategories.level2 || null,
        subcategory2: selectedCategories.level3 || null,
        condition,
        size: size || null,
        status: 'available',
        available_in_store: availableInStore,
        list_on_paperclip: listOnPaperclip,
      });

      // Upload images to Supabase Storage
      await Promise.all(
        images.map(async (imageData, index) => {
          const file = await base64ToFile(imageData);
          return uploadItemImage(file, item.id, index);
        })
      );

      router.push('/inventory');
    } catch (error) {
      console.error('Failed to create item:', error);
      alert('Failed to create item. Please try again.');
    }
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const { files } = e.dataTransfer;
    if (files.length > 0) {
      console.log('Dropped files:', files.length); // Debug log
      await processFiles(files);
    }
  };

  const removeImage = (indexToRemove: number) => {
    setImages(prev => {
      const newImages = prev.filter((_, index) => index !== indexToRemove);
      // Adjust currentImageIndex if needed
      if (currentImageIndex >= newImages.length) {
        setCurrentImageIndex(Math.max(0, newImages.length - 1));
      } else if (indexToRemove < currentImageIndex) {
        setCurrentImageIndex(prev => Math.max(0, prev - 1));
      }
      return newImages;
    });
  };

  const handleReorder = (newOrder: string[]) => {
    const oldIndex = currentImageIndex;
    const oldImage = images[oldIndex];
    const newIndex = newOrder.findIndex(img => img === oldImage);
    
    setImages(newOrder);
    setCurrentImageIndex(newIndex);
  };

  return (
    <div className="space-y-4 p-4">
      <Link href="/inventory" className="text-blue-500 hover:underline mb-4 inline-block">
        &larr; Return to Inventory
      </Link>
      <h1 className="text-3xl font-bold">Add New Item</h1>
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Item Details</CardTitle>
            <Button
              onClick={async () => {
                if (images.length === 0) {
                  alert('Please upload at least one image first');
                  return;
                }

                setIsAnalyzing(true);
                try {
                  // Convert base64 image to File object
                  const imageFile = await base64ToFile(images[currentImageIndex]);
                  
                  // Send to AI for analysis
                  const result = await analyzeImage(imageFile);
                  
                  // Update form with AI results
                  setItemDetails({
                    name: result.title,
                    description: result.description,
                    price: result.price_avg.toString(),
                    category: result.category_id
                  });

                  // Update category if provided
                  if (result.category_id) {
                    setSelectedCategories(prev => ({
                      ...prev,
                      level1: result.category_id,
                      level2: "",
                      level3: ""
                    }));
                  }

                  // Update condition if provided
                  if (result.condition) {
                    setCondition(mapCondition(result.condition));
                  }

                } catch (error) {
                  console.error('AI analysis failed:', error);
                  alert('Failed to analyze image. You can continue filling in details manually.');
                } finally {
                  setIsAnalyzing(false);
                }
              }}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 
                         hover:to-purple-700 text-white shadow-lg"
              disabled={isAnalyzing || images.length === 0}
            >
              {isAnalyzing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/60 border-t-white mr-2" />
                  <span>Analyzing...</span>
                </>
              ) : (
                <>
                  <span className="text-lg mr-2">🤖</span>
                  <span>AI Listing Creation</span>
                </>
              )}
            </Button>
          </div>
          <CardDescription className="text-lg font-semibold">
            <span className="bg-gradient-to-r from-blue-500 to-purple-500 text-transparent bg-clip-text">
              Upload photos and let AI help create your listing
            </span>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
          <div className="space-y-2">
            <Label htmlFor="image" className="text-base font-medium">Item Images</Label>
            
            {/* Image Gallery */}
            {images.length > 0 && (
              <div className="relative w-full max-w-2xl mx-auto mb-8">
                {/* Main Image */}
                <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 shadow-lg">
                  <AnimatePresence mode="wait">
                    <motion.img 
                      key={images[currentImageIndex]}
                      src={images[currentImageIndex]} 
                      alt={`Item image ${currentImageIndex + 1}`} 
                      className="w-full h-full object-contain cursor-zoom-in"
                      onClick={() => setLightboxImage(images[currentImageIndex])}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ duration: 0.2 }}
                    />
                  </AnimatePresence>
                  
                  {/* Image Counter */}
                  <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-sm text-white px-3 py-1.5 
                                rounded-full text-sm font-medium flex items-center gap-2">
                    <span>{currentImageIndex + 1}</span>
                    <span className="text-white/60">/</span>
                    <span>{images.length}</span>
                  </div>

                  {/* Navigation Arrows */}
                  <div className="absolute inset-0 flex items-center justify-between p-4">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={prevImage} 
                      disabled={images.length <= 1}
                      className="h-10 w-10 rounded-full bg-black/20 hover:bg-black/40 backdrop-blur-sm text-white transition-all"
                    >
                      <ChevronLeft className="h-6 w-6" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={nextImage} 
                      disabled={images.length <= 1}
                      className="h-10 w-10 rounded-full bg-black/20 hover:bg-black/40 backdrop-blur-sm text-white transition-all"
                    >
                      <ChevronRight className="h-6 w-6" />
                    </Button>
                  </div>
                </div>

                {/* Thumbnails */}
                <div className="mt-6 px-4">
                  <div className="max-w-3xl mx-auto">
                    <Reorder.Group 
                      axis="x" 
                      values={images} 
                      onReorder={handleReorder}
                      className="flex flex-wrap gap-4 justify-center"
                    >
                      {images.map((image, index) => (
                        <Reorder.Item
                          key={image}
                          value={image}
                          className="relative flex-shrink-0 group"
                          whileDrag={{ scale: 1.1, zIndex: 50 }}
                        >
                          <motion.div
                            className={`
                              relative w-24 h-24 rounded-xl overflow-hidden transition-all duration-200
                              ${index === currentImageIndex 
                                ? 'ring-2 ring-[#FF3B30] ring-offset-2 dark:ring-offset-gray-900 shadow-lg' 
                                : 'hover:ring-2 hover:ring-gray-300 dark:hover:ring-gray-600 ring-offset-2 dark:ring-offset-gray-900'
                              }
                            `}
                            whileHover={{ scale: 1.05, y: -4 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            {/* Thumbnail Image */}
                            <motion.img
                              src={image}
                              alt={`Thumbnail ${index + 1}`}
                              className="w-full h-full object-cover"
                              layoutId={`image-${image}`}
                              onClick={() => setCurrentImageIndex(index)}
                            />

                            {/* Gradient Overlay */}
                            <div className={`
                              absolute inset-0 bg-gradient-to-t from-black/50 to-transparent
                              transition-opacity duration-200
                              ${index === currentImageIndex ? 'opacity-60' : 'opacity-0 group-hover:opacity-40'}
                            `} />

                            {/* Thumbnail Number */}
                            <div className="absolute bottom-2 left-2 text-white text-sm font-medium">
                              {index + 1}
                            </div>

                            {/* Delete Button */}
                            <Button
                              type="button"
                              variant="destructive"
                              size="icon"
                              className="absolute -top-2 -right-2 h-6 w-6 rounded-full opacity-0 group-hover:opacity-100 
                                        transition-all duration-200 shadow-lg transform translate-y-2 group-hover:translate-y-0"
                              onClick={(e) => {
                                e.stopPropagation()
                                removeImage(index)
                              }}
                            >
                              <X className="h-3 w-3" />
                            </Button>

                            {/* Selected Indicator */}
                            {index === currentImageIndex && (
                              <motion.div
                                className="absolute bottom-0 left-0 right-0 h-1 bg-[#FF3B30]"
                                layoutId="selectedIndicator"
                              />
                            )}
                          </motion.div>
                        </Reorder.Item>
                      ))}
                    </Reorder.Group>
                  </div>
                </div>
              </div>
            )}

            {/* Camera Preview */}
            {isCameraActive && (
              <div className="relative max-w-md mx-auto aspect-[3/2] w-full rounded-lg overflow-hidden bg-black">
                <video
                  ref={videoRef}
                  className="absolute inset-0 w-full h-full object-cover"
                  playsInline
                  muted
                  autoPlay
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  {!videoRef.current?.srcObject && (
                    <div className="text-white text-sm">Initializing camera...</div>
                  )}
                </div>
                <div className="absolute bottom-4 left-0 right-0 flex justify-center space-x-4 z-10">
                  <Button 
                    type="button"
                    onClick={capturePhoto}
                    className="bg-white text-black hover:bg-gray-100"
                    disabled={!videoRef.current?.srcObject || needsUserGesture}
                  >
                    Capture
                  </Button>
                  <Button 
                    type="button"
                    variant="outline"
                    onClick={stopCamera}
                    className="bg-white/10 text-white hover:bg-white/20"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            {/* Captured Image Preview */}
            {capturedImage && (
              <div className="relative max-w-md mx-auto aspect-[3/2] w-full rounded-lg overflow-hidden">
                <img 
                  src={capturedImage} 
                  alt="Captured item" 
                  className="w-full h-full object-contain bg-gray-100 dark:bg-gray-800"
                />
                <div className="absolute bottom-4 left-0 right-0 flex justify-center space-x-4">
                  <Button 
                    type="button" 
                    variant="secondary" 
                    onClick={retakePhoto}
                    className="bg-white text-black hover:bg-gray-100"
                  >
                    <RotateCcw className="mr-2 h-5 w-5" />
                    Retake
                  </Button>
                  <Button 
                    type="button" 
                    onClick={usePhoto}
                    className="bg-[#FF3B30] hover:bg-[#E6352B] text-white"
                  >
                    <Check className="mr-2 h-5 w-5" />
                    Use Photo
                  </Button>
                </div>
              </div>
            )}

            {/* Upload Buttons */}
            {!capturedImage && !isCameraActive && (
              <div
                ref={dropZoneRef}
                onDragEnter={handleDragEnter}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`relative grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-lg border-2 border-dashed transition-colors
                  ${isDragging 
                    ? 'border-[#FF3B30] bg-red-50 dark:bg-red-900/10' 
                    : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                  }`}
              >
                {isDragging && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/5 rounded-lg">
                    <p className="text-lg font-medium">Drop images here</p>
                  </div>
                )}
                <Button 
                  type="button" 
                  variant="outline" 
                  className="h-32 text-lg"
                  onClick={startCamera}
                >
                  <Camera className="mr-2 h-6 w-6" />
                  Take Photo
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  className="h-32 text-lg"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="mr-2 h-6 w-6" />
                  Choose Photo
                </Button>
              </div>
            )}

            <input 
              ref={fileInputRef}
              id="image-upload" 
              type="file" 
              accept="image/*" 
              capture="environment"
              className="hidden" 
              onChange={handleFileChange}
              multiple  // Allow multiple file selection
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="name">Item Name</Label>
            <Input 
              id="name" 
              value={itemDetails.name}
              onChange={(e) => setItemDetails(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Enter item name" 
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea 
              id="description" 
              value={itemDetails.description}
              onChange={(e) => setItemDetails(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Enter item description" 
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <CategorySelector
              selectedCategories={selectedCategories}
              onCategorySelect={setSelectedCategories}
            />
          </div>
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="condition" className="text-lg font-medium">Condition</Label>
              <ConditionSelector
                value={condition}
                onChange={setCondition}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="size" className="text-lg font-medium">Size</Label>
              <SizeSelector
                value={size}
                onChange={setSize}
                category={selectedCategories.level1}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="price">Price</Label>
            <Input 
              id="price" 
              type="number"
              value={itemDetails.price}
              onChange={(e) => setItemDetails(prev => ({ ...prev, price: e.target.value }))}
              placeholder="Enter price" 
            />
          </div>
          <div className="flex justify-center items-center space-x-8">
            <div className="flex items-center space-x-2">
              <Switch 
                id="available" 
                checked={availableInStore}
                onCheckedChange={setAvailableInStore}
                className="data-[state=checked]:bg-green-500 data-[state=unchecked]:bg-gray-200 
                           dark:data-[state=unchecked]:bg-gray-600"
              />
              <Label htmlFor="available" className="text-gray-700 dark:text-gray-200 font-semibold">
                Available in-store
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch 
                id="listOnPaperclip" 
                checked={listOnPaperclip}
                onCheckedChange={setListOnPaperclip}
                className="data-[state=checked]:bg-green-500 data-[state=unchecked]:bg-gray-200 
                           dark:data-[state=unchecked]:bg-gray-600"
              />
              <Label htmlFor="listOnPaperclip" className="text-gray-700 dark:text-gray-200 font-semibold">
                List On Paperclip
              </Label>
            </div>
          </div>
          <div className="px-6 py-4">
            <Button 
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="w-full text-lg font-semibold h-14 bg-gradient-to-r from-blue-600 to-purple-600 
                         hover:from-blue-700 hover:to-purple-700 text-white shadow-lg 
                         transform hover:scale-[1.02] transition-all duration-200"
            >
              <motion.div
                whileTap={{ scale: 0.95 }}
                className="flex items-center justify-center space-x-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/60 border-t-white" />
                    <span>Adding Item...</span>
                  </>
                ) : (
                  <>
                    <span>Add Item to Inventory</span>
                    <ChevronRight className="h-5 w-5" />
                  </>
                )}
              </motion.div>
            </Button>
          </div>
          {isAnalyzing && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl max-w-md w-full mx-4"
              >
                <div className="space-y-6">
                  {/* AI Icon Animation */}
                  <div className="flex justify-center">
                    <motion.div
                      animate={{
                        scale: [1, 1.1, 1],
                        rotate: [0, 5, -5, 0],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                      className="text-4xl"
                    >
                      🤖
                    </motion.div>
                  </div>

                  {/* Loading Text */}
                  <div className="text-center space-y-3">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                      AI Analysis in Progress
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      Analyzing your item to create the perfect listing...
                    </p>
                  </div>

                  {/* Progress Bar */}
                  <div className="relative h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <motion.div
                      className="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-600 to-purple-600"
                      animate={{
                        width: ["0%", "100%"],
                        x: ["-100%", "0%"]
                      }}
                      transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                    />
                  </div>

                  {/* Steps */}
                  <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                    <motion.div
                      animate={{ opacity: [0.5, 1, 0.5] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    >
                      ⚡ Identifying item characteristics...
                    </motion.div>
                    <motion.div
                      animate={{ opacity: [0.5, 1, 0.5] }}
                      transition={{ duration: 1.5, repeat: Infinity, delay: 0.5 }}
                    >
                      📝 Generating description...
                    </motion.div>
                    <motion.div
                      animate={{ opacity: [0.5, 1, 0.5] }}
                      transition={{ duration: 1.5, repeat: Infinity, delay: 1 }}
                    >
                      💰 Estimating market value...
                    </motion.div>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
          {lightboxImage && (
            <ImageLightbox
              src={lightboxImage}
              onClose={() => setLightboxImage(null)}
            />
          )}
        </CardContent>
      </Card>
    </div>
  )
}

